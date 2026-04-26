"""
Ensemble pipeline for TruthScan AI Pro.
Orchestrates all models and produces the final analysis result.
"""

import time
import logging
from PIL import Image
import numpy as np

from inference import predict as ai_predict, is_model_ready
from utils.preprocessing import preprocess_for_opencv
from utils.cv_analysis import analyze_image as cv_analyze
from utils.face_detection import detect_faces, analyze_face_manipulation
from utils.yolo import detect_objects
from utils.breakdown import (
    compute_breakdown,
    get_confidence_label,
    get_result_label,
)
from utils.llm_explainer import generate_explanation

logger = logging.getLogger(__name__)


def analyze(image: Image.Image, file_size: int = 0, file_type: str = "image/jpeg") -> dict:
    """Run the full ensemble analysis pipeline on an image.

    Steps:
    1. Run EfficientNet-B3 → AI probability
    2. Run OpenCV forensics → forensic signals
    3. Run face detector → if faces, analyze manipulation
    4. Run YOLOv8 → extract tags
    5. Compute breakdown scores
    6. Generate explanation
    7. Combine all results

    Args:
        image: PIL Image in RGB mode.
        file_size: Original file size in bytes.
        file_type: MIME type of the original file.

    Returns:
        Complete analysis result dictionary.
    """
    start_time = time.time()

    # Convert to OpenCV format for forensic analysis
    image_bgr = preprocess_for_opencv(image)

    # Step 1: Primary AI detection -> Lazy Load attempt
    model_ready = False
    try:
        from inference import load_model
        load_model()
        model_ready = True
    except Exception as e:
        logger.error(f"Model lazy initialization failed: {e}")
        
    if model_ready:
        logger.info("Running EfficientNet-B3 AI detection...")
        try:
            ai_probability = ai_predict(image)
        except Exception as e:
            logger.error(f"AI detection failed: {e}")
            ai_probability = 0.5  # Neutral fallback
        logger.info(f"AI probability: {ai_probability:.4f}")
    else:
        logger.info("Model not initialized. Bypassing EfficientNet-B3 (Fallback Mode).")
        ai_probability = None

    # Step 2: OpenCV forensic analysis
    logger.info("Running OpenCV forensic analysis...")
    try:
        forensic_results = cv_analyze(image_bgr)
    except Exception as e:
        logger.error(f"OpenCV analysis failed: {e}")
        forensic_results = {"forensic_score": 0.0, "noise": {}, "blur": {}, "edges": {}, "color_stats": {}, "texture": {}}

    logger.info(f"Forensic score: {forensic_results.get('forensic_score', 0):.4f}")

    # Step 3: Face detection and manipulation analysis
    logger.info("Running face detection...")
    try:
        faces = detect_faces(image_bgr)
        face_analysis = analyze_face_manipulation(image_bgr, faces)
    except Exception as e:
        logger.error(f"Face detection failed: {e}")
        face_analysis = {"has_faces": False, "face_count": 0, "manipulation_score": 0.0, "details": []}

    logger.info(f"Faces detected: {face_analysis['face_count']}")

    # Step 4: YOLO object detection
    logger.info("Running YOLOv8 object detection...")
    try:
        yolo_results = detect_objects(image)
    except Exception as e:
        logger.error(f"YOLO detection failed: {e}")
        yolo_results = {"detections": [], "tags": [], "scene_context": "unknown", "has_person": False}

    logger.info(f"Tags: {yolo_results.get('tags', [])}")

    # Step 5: Ensemble fusion — adjust AI probability with all signals
    adjusted_probability = _ensemble_fusion(
        ai_probability, forensic_results, face_analysis, yolo_results
    )
    logger.info(f"Adjusted AI probability: {adjusted_probability:.4f}")

    # Step 6: Compute breakdown
    label = get_result_label(adjusted_probability)
    confidence = get_confidence_label(adjusted_probability)
    breakdown = compute_breakdown(
        adjusted_probability, face_analysis, forensic_results, yolo_results
    )

    # Step 7: Generate explanation
    logger.info("Generating explanation...")
    try:
        explanation = generate_explanation(
            adjusted_probability, label, confidence,
            face_analysis, yolo_results, forensic_results, breakdown,
        )
    except Exception as e:
        logger.error(f"Explanation generation failed: {e}")
        explanation = {
            "summary": f"Image analyzed with {adjusted_probability:.0%} AI probability.",
            "key_indicators": ["Analysis completed"],
            "visual_patterns": ["Standard analysis"],
        }

    elapsed = time.time() - start_time
    logger.info(f"Analysis complete in {elapsed:.2f}s")

    # Build enriched tags list
    tags = yolo_results.get("tags", [])
    if face_analysis["has_faces"] and "person" not in tags:
        tags.insert(0, "person")
    scene = yolo_results.get("scene_context", "")
    if scene and scene not in tags:
        tags.append(scene)

    # Construct final result
    return {
        "ai_probability": round(adjusted_probability, 4),
        "label": label,
        "confidence": confidence,
        "breakdown": breakdown,
        "tags": tags[:10],  # Cap tags
        "metadata": {
            "file_size": _format_file_size(file_size),
            "file_type": file_type,
            "image_dimensions": f"{image.width}x{image.height}",
            "analysis_time_ms": int(elapsed * 1000),
            "faces_detected": face_analysis["face_count"],
            "forensic_score": round(forensic_results.get("forensic_score", 0), 4),
            "model_ready": model_ready,
        },
        "explanation": explanation,
    }


def _ensemble_fusion(
    ai_prob: float | None,
    forensic: dict,
    face_analysis: dict,
    yolo_results: dict,
) -> float:
    """Fuse AI detection probability with forensic, face, and YOLO signals.

    Implements: 0.70 * EfficientNet + 0.15 * forensic + 0.10 * face analysis + 0.05 * YOLO
    Also reduces AI score for real portraits with low face manipulation.
    """
    forensic_score = forensic.get("forensic_score", 0.5)

    has_faces = face_analysis.get("has_faces", False)
    face_count = face_analysis.get("face_count", 0)
    face_manip = face_analysis.get("manipulation_score", 0.5) if has_faces else 0.5
    
    # Image Quality Adjustment (Detect blur, compression, resolution)
    quality_adjustment = 0.0
    is_blurry = forensic.get("blur", {}).get("is_blurry", False)
    blur_inc = forensic.get("blur", {}).get("blur_inconsistency", 0.0)
    artifact_score = forensic.get("jpeg_artifacts", {}).get("artifact_score_low_q", 0.0)
    
    if is_blurry and blur_inc < 0.6:
        quality_adjustment += 0.08  # Reduce for consistent natural blur
    if artifact_score < 5.0:  # Indicates already highly compressed image
        quality_adjustment += 0.07  # Reduce for WhatsApp-style compression

    # Cap quality adjustment to 15% max
    quality_adjustment = min(quality_adjustment, 0.15)
    
    # Extract texture and noise indicators
    tex_reg = forensic.get("texture", {}).get("texture_regularity", 0.0)
    noise_uni = forensic.get("noise", {}).get("noise_uniformity", 0.0)
    
    # 1. Face Discount (Stronger discount for real portraits)
    face_penalty = 0.0
    has_person = yolo_results.get("has_person", False)
    tags = yolo_results.get("tags", [])
    is_portrait = has_person or "portrait" in tags or "selfie" in tags
    
    if has_faces and face_manip < 0.3 and forensic_score < 0.30 and is_portrait:
        face_penalty = 0.22  # Stronger protection for real portraits
        
    # 2. Portrait Bonus (Additional reduction if forensic is extremely clean)
    portrait_bonus = 0.0
    if has_faces and face_manip < 0.3 and is_portrait:
        if forensic_score < 0.20:
            portrait_bonus = 0.08
            
    # 3. Diffusion Boost (Force AI probability upward if signals are high)
    ai_boost = 0.0
    strong_ai_evidence = (ai_prob is not None and ai_prob > 0.85) or forensic_score > 0.40 or tex_reg > 0.7 or noise_uni > 0.7
    if strong_ai_evidence:
        ai_boost = 0.05  # Force upward unless it's a very clear real portrait
            
    # 4. Multi-Face AI Images (Increase suspicion if multiple faces in synthetic scene)
    is_synthetic_scene = (ai_prob is not None and ai_prob > 0.65) or forensic_score > 0.35 or strong_ai_evidence
    if has_faces and face_count > 1 and is_synthetic_scene:
        face_penalty = -0.15  # Negative penalty increases final AI score
        portrait_bonus = 0.0  # Revoke any bonuses
        ai_boost += 0.05      # Extra boost for multi-face synthetic
        
    # YOLO contribution
    yolo_score = 0.5
    if has_person:
        yolo_score = 0.2  # Presence of person correlates more with real photos
    elif yolo_results.get("scene_context") == "scene":
        yolo_score = 0.6  # Complex scenes without people

    if ai_prob is not None:
        # Full Ensemble (0.75 weight for EfficientNet)
        base_score = (ai_prob * 0.75) + (forensic_score * 0.10) + (face_manip * 0.10) + (yolo_score * 0.05)
        adjusted = base_score - face_penalty - portrait_bonus - quality_adjustment + ai_boost
    else:
        # Fallback Heuristic
        adjusted = (forensic_score * 0.60) + (face_manip * 0.30) + (yolo_score * 0.10) - face_penalty - portrait_bonus - quality_adjustment + ai_boost

    # Clamp to [0, 1]
    adjusted = float(np.clip(adjusted, 0.0, 1.0))

    # 3. Clear Debug Logs
    logger.info("--- DEBUG SCORE LOG ---")
    logger.info(f"Raw EfficientNet: {ai_prob if ai_prob else 'N/A'}")
    logger.info(f"Forensic Score: {forensic_score:.4f}")
    logger.info(f"Face Adjustment (Penalty): -{face_penalty:.4f}")
    logger.info(f"Portrait Bonus: -{portrait_bonus:.4f}")
    logger.info(f"Quality Adjustment: -{quality_adjustment:.4f}")
    logger.info(f"Diffusion Boost: +{ai_boost:.4f}")
    logger.info(f"Final Adjusted Score: {adjusted:.4f}")
    logger.info("-----------------------")

    return adjusted


def _format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable form."""
    if size_bytes <= 0:
        return "unknown"
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
