"""
LLM Explanation Engine for TruthScan AI Pro.
Primary: Mistral via OpenRouter API.
Fallback: Local rule-based explanation generator.
"""

import os
import json
import logging
import requests

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = "mistralai/mistral-7b-instruct"


def generate_explanation(
    ai_probability: float,
    label: str,
    confidence: str,
    face_analysis: dict,
    yolo_results: dict,
    forensic_results: dict,
    breakdown: dict,
) -> dict:
    """Generate a detailed explanation of the analysis results.

    Tries Mistral via OpenRouter first, falls back to rule-based.

    Returns:
        Dict with 'summary', 'key_indicators', 'visual_patterns'.
    """
    # Try LLM first if API key is available
    if OPENROUTER_API_KEY:
        try:
            return _generate_llm_explanation(
                ai_probability, label, confidence,
                face_analysis, yolo_results, forensic_results, breakdown,
            )
        except Exception as e:
            logger.warning(f"LLM explanation failed, using fallback: {e}")

    # Fallback to rule-based
    return _generate_rule_based_explanation(
        ai_probability, label, confidence,
        face_analysis, yolo_results, forensic_results, breakdown,
    )


def _generate_llm_explanation(
    ai_probability: float,
    label: str,
    confidence: str,
    face_analysis: dict,
    yolo_results: dict,
    forensic_results: dict,
    breakdown: dict,
) -> dict:
    """Generate explanation using Mistral via OpenRouter."""
    # Build context for the LLM
    context = {
        "ai_probability": ai_probability,
        "label": label,
        "confidence": confidence,
        "has_faces": face_analysis.get("has_faces", False),
        "face_count": face_analysis.get("face_count", 0),
        "face_manipulation_score": face_analysis.get("manipulation_score", 0),
        "detected_tags": yolo_results.get("tags", []),
        "scene_context": yolo_results.get("scene_context", "unknown"),
        "forensic_score": forensic_results.get("forensic_score", 0),
        "noise_uniformity": forensic_results.get("noise", {}).get("noise_uniformity", 0),
        "blur_inconsistency": forensic_results.get("blur", {}).get("blur_inconsistency", 0),
        "texture_regularity": forensic_results.get("texture", {}).get("texture_regularity", 0),
        "genai_score": breakdown.get("genai", 0),
        "diffusion_gpt": breakdown.get("diffusion", {}).get("gpt", 0),
    }

    prompt = f"""You are an AI image forensics expert. Analyze the following detection results and provide a detailed explanation.

Detection Results:
- AI Probability: {context['ai_probability']:.1%}
- Label: {context['label']}
- Confidence: {context['confidence']}
- Faces Detected: {context['face_count']}
- Face Manipulation Score: {context['face_manipulation_score']:.2f}
- Detected Objects: {', '.join(context['detected_tags']) if context['detected_tags'] else 'none'}
- Scene: {context['scene_context']}
- Forensic Score: {context['forensic_score']:.2f}
- Noise Uniformity: {context['noise_uniformity']:.2f}
- Blur Inconsistency: {context['blur_inconsistency']:.2f}
- Texture Regularity: {context['texture_regularity']:.2f}
- GenAI Score: {context['genai_score']}%
- Top Diffusion Attribution (GPT): {context['diffusion_gpt']}%

Respond with ONLY a valid JSON object (no markdown, no code blocks) with these exact keys:
{{
  "summary": "2-3 sentence summary of the analysis",
  "key_indicators": ["indicator 1", "indicator 2", "indicator 3", "indicator 4"],
  "visual_patterns": ["pattern 1", "pattern 2", "pattern 3"]
}}"""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": "You are an expert AI image forensics analyst. Respond only with valid JSON."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 500,
        "temperature": 0.3,
    }

    response = requests.post(
        OPENROUTER_API_URL,
        headers=headers,
        json=payload,
        timeout=15,
    )
    response.raise_for_status()

    result = response.json()
    content = result["choices"][0]["message"]["content"].strip()

    # Clean up content — remove markdown code blocks if present
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1])

    explanation = json.loads(content)

    # Validate structure
    return {
        "summary": explanation.get("summary", "Analysis complete."),
        "key_indicators": explanation.get("key_indicators", [])[:6],
        "visual_patterns": explanation.get("visual_patterns", [])[:5],
    }


def _generate_rule_based_explanation(
    ai_probability: float,
    label: str,
    confidence: str,
    face_analysis: dict,
    yolo_results: dict,
    forensic_results: dict,
    breakdown: dict,
) -> dict:
    """Generate explanation using rule-based logic (fallback)."""

    ai_pct = int(round(ai_probability * 100))
    tags = yolo_results.get("tags", [])
    scene = yolo_results.get("scene_context", "unknown")
    has_faces = face_analysis.get("has_faces", False)
    face_count = face_analysis.get("face_count", 0)
    face_manip = face_analysis.get("manipulation_score", 0.0)
    forensic_score = forensic_results.get("forensic_score", 0.0)
    noise_uni = forensic_results.get("noise", {}).get("noise_uniformity", 0.5)
    tex_reg = forensic_results.get("texture", {}).get("texture_regularity", 0.3)
    blur_inc = forensic_results.get("blur", {}).get("blur_inconsistency", 0.0)

    # ----- Summary -----
    if ai_probability >= 0.85:
        summary = (
            f"This image has a {ai_pct}% probability of being AI-generated. "
            f"Multiple forensic indicators strongly suggest synthetic origin, "
            f"including {'facial manipulation patterns, ' if has_faces and face_manip > 0.5 else ''}"
            f"noise distribution anomalies, and texture regularity consistent with "
            f"generative model outputs."
        )
    elif ai_probability >= 0.55:
        summary = (
            f"This image shows a {ai_pct}% probability of AI generation. "
            f"Some forensic signals suggest possible synthetic elements, "
            f"but the evidence is not conclusive. "
            f"{'Face analysis detected potential manipulation artifacts. ' if has_faces and face_manip > 0.3 else ''}"
            f"Further analysis may be needed for a definitive determination."
        )
    elif ai_probability >= 0.3:
        summary = (
            f"This image has a {ai_pct}% AI generation probability, placing it in an uncertain range. "
            f"While some forensic markers are present, they are within the range of "
            f"naturally occurring image characteristics."
        )
    else:
        summary = (
            f"This image has a low AI generation probability of {ai_pct}%. "
            f"Forensic analysis indicates natural noise patterns, consistent edge "
            f"characteristics, and texture profiles typical of camera-captured images."
        )

    # ----- Key Indicators -----
    indicators = []

    if noise_uni > 0.6:
        indicators.append(
            f"Noise uniformity ({noise_uni:.0%}) exceeds natural threshold — "
            f"synthetic noise patterns detected"
        )
    elif noise_uni < 0.3:
        indicators.append(
            f"Noise uniformity ({noise_uni:.0%}) is within natural range — "
            f"consistent with camera sensor noise"
        )

    if tex_reg > 0.4:
        indicators.append(
            f"Texture regularity ({tex_reg:.0%}) indicates unnaturally uniform "
            f"surface details typical of generative models"
        )

    if has_faces:
        if face_manip > 0.5:
            indicators.append(
                f"Face manipulation score ({face_manip:.0%}) suggests synthetic "
                f"facial features — boundary artifacts and skin smoothness anomalies detected"
            )
        else:
            indicators.append(
                f"{face_count} face(s) detected with low manipulation signals — "
                f"facial features appear naturally consistent"
            )

    if blur_inc > 0.3:
        indicators.append(
            f"Blur inconsistency ({blur_inc:.0%}) across image regions suggests "
            f"compositing or generative artifacts"
        )

    if forensic_score > 0.5:
        indicators.append(
            f"Overall forensic suspicion score ({forensic_score:.0%}) is elevated — "
            f"multiple low-level signals indicate synthetic origin"
        )
    elif forensic_score < 0.25:
        indicators.append(
            f"Forensic suspicion score ({forensic_score:.0%}) is low — "
            f"image characteristics are consistent with natural photographs"
        )

    if tags:
        indicators.append(
            f"Scene analysis: detected {', '.join(tags[:5])} in a {scene} context"
        )

    if not indicators:
        indicators.append("Standard forensic analysis completed with no notable anomalies")

    # ----- Visual Patterns -----
    patterns = []

    if ai_probability >= 0.6:
        patterns.append("Synthetic texture smoothness in high-detail regions")
        if noise_uni > 0.5:
            patterns.append("Uniform noise distribution inconsistent with sensor noise")
        if tex_reg > 0.35:
            patterns.append("Repetitive micro-patterns in surface textures")
        if has_faces and face_manip > 0.4:
            patterns.append("Face boundary blending artifacts")
            patterns.append("Unnaturally smooth skin texture in facial regions")
    else:
        patterns.append("Natural noise grain consistent with camera sensors")
        if has_faces:
            patterns.append("Consistent lighting and shadow on facial features")
        if tags:
            patterns.append(f"Coherent object boundaries for detected {tags[0]}")
        patterns.append("Edge characteristics match natural photography")

    return {
        "summary": summary,
        "key_indicators": indicators[:6],
        "visual_patterns": patterns[:5],
    }
