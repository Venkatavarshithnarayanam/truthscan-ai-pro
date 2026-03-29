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

    # Step 1: Primary AI detection
    from app import MODEL_INITIALIZED
    
    if MODEL_INITIALIZED:
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

    # Step 5: Ensemble fusion — adjust AI probability with forensic signals
    adjusted_probability = _ensemble_fusion(
        ai_probability, forensic_results, face_analysis
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
            "model_ready": MODEL_INITIALIZED,
        },
        "explanation": explanation,
    }


def _ensemble_fusion(
    ai_prob: float | None,
    forensic: dict,
    face_analysis: dict,
) -> float:
    """Fuse AI detection probability with forensic signals.

    If AI model is present, uses weights: 0.6 model + 0.4 forensic (+ face boost).
    If AI model is missing, falls back purely to forensic heuristics.
    """
    forensic_score = forensic.get("forensic_score", 0.5)

    # Face manipulation adds to AI probability if present
    face_boost = 0.0
    if face_analysis.get("has_faces", False):
        face_manip = face_analysis.get("manipulation_score", 0.0)
        if face_manip > 0.5:
            face_boost = face_manip * 0.15  # Up to 0.15 boost based on severe face warping

    if ai_prob is not None:
        # Full Ensemble: User's requested 60/40 combination
        adjusted = (ai_prob * 0.60) + (forensic_score * 0.40) + face_boost
    else:
        # Fallback Heuristic
        adjusted = forensic_score + (face_boost * 2.0)

    # Clamp to [0, 1]
    adjusted = float(np.clip(adjusted, 0.0, 1.0))

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
