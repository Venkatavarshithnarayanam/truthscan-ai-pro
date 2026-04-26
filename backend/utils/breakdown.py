"""
Breakdown engine for TruthScan AI Pro.
Derives GenAI, face manipulation, diffusion, and GAN sub-scores
from model outputs — no random values.
"""

import numpy as np


def compute_breakdown(
    ai_probability: float,
    face_analysis: dict,
    forensic_results: dict,
    yolo_results: dict,
) -> dict:
    """Compute the full breakdown from model outputs.

    Args:
        ai_probability: Primary AI detection probability (0-1).
        face_analysis: Output from face_detection.analyze_face_manipulation().
        forensic_results: Output from cv_analysis.analyze_image().
        yolo_results: Output from yolo.detect_objects().

    Returns:
        Breakdown dict with genai, face_manipulation, diffusion, gan scores.
    """
    # ------ GenAI Score ------
    # Directly derived from AI probability, scaled to 0-100
    genai_score = int(round(ai_probability * 100))

    # ------ Face Manipulation Score ------
    if face_analysis["has_faces"]:
        # Combine face manipulation model score with AI probability
        face_manip_raw = face_analysis["manipulation_score"]
        # Weight: 60% face model, 40% overall AI probability
        face_manipulation_score = int(round(
            (face_manip_raw * 0.6 + ai_probability * 0.4) * 100
        ))
    else:
        # No faces detected — low face manipulation score, but not zero if AI detected
        face_manipulation_score = int(round(ai_probability * 15))

    face_manipulation_score = int(np.clip(face_manipulation_score, 0, 100))

    # ------ Diffusion Breakdown ------
    diffusion_breakdown = _compute_diffusion_breakdown(
        ai_probability, forensic_results
    )

    # ------ GAN Breakdown ------
    gan_breakdown = _compute_gan_breakdown(
        ai_probability, forensic_results
    )

    return {
        "genai": genai_score,
        "face_manipulation": face_manipulation_score,
        "diffusion": diffusion_breakdown,
        "gan": gan_breakdown,
    }


def _compute_diffusion_breakdown(ai_probability: float, forensic: dict) -> dict:
    """Compute diffusion model attribution based on forensic signals.

    When AI is detected, we attribute to diffusion models based on
    forensic signal patterns. This isn't random — it's derived from
    the image characteristics that correlate with specific generators.
    """
    if ai_probability < 0.3:
        # Low AI probability — minimal diffusion scores
        return {
            "gpt": max(1, int(ai_probability * 20)),
            "stable_diffusion": max(1, int(ai_probability * 10)),
            "midjourney": max(1, int(ai_probability * 5)),
            "dalle": max(1, int(ai_probability * 5)),
            "recraft": 1,
            "qwen": 1,
            "imagen": 1,
            "others": 1,
        }

    forensic_score = forensic.get("forensic_score", 0.5)
    noise_uniformity = forensic.get("noise", {}).get("noise_uniformity", 0.5)
    texture_regularity = forensic.get("texture", {}).get("texture_regularity", 0.3)
    sat_uniformity = forensic.get("color_stats", {}).get("saturation_uniformity", 0.5)

    # Base AI attribution — total diffusion percentage scales with AI prob
    total_diffusion = ai_probability * 100

    # GPT/DALL-E 4o style: high noise uniformity + high texture regularity
    gpt_signal = (noise_uniformity * 0.5 + texture_regularity * 0.3 + ai_probability * 0.2)
    gpt_score = int(round(gpt_signal * total_diffusion * 0.95))
    gpt_score = int(np.clip(gpt_score, 1, 99))

    # Distribute remainder among other models based on signals
    remainder = max(0, int(total_diffusion) - gpt_score)

    # Stable Diffusion: tends to have lower saturation uniformity
    sd_signal = max(0.05, 1.0 - sat_uniformity)
    sd_score = max(1, int(remainder * sd_signal * 0.3))

    # MidJourney: tends to have distinctive color patterns
    mj_signal = max(0.05, sat_uniformity * 0.5)
    mj_score = max(1, int(remainder * mj_signal * 0.2))

    # DALL-E: similar to GPT but typically lower
    dalle_score = max(1, int(remainder * 0.15))

    # Others get minimal scores
    recraft_score = max(1, int(remainder * 0.05))
    qwen_score = max(1, int(remainder * 0.05))
    imagen_score = max(1, int(remainder * 0.05))
    others_score = max(1, int(remainder * 0.05))

    return {
        "gpt": gpt_score,
        "stable_diffusion": sd_score,
        "midjourney": mj_score,
        "dalle": dalle_score,
        "recraft": recraft_score,
        "qwen": qwen_score,
        "imagen": imagen_score,
        "others": others_score,
    }


def _compute_gan_breakdown(ai_probability: float, forensic: dict) -> dict:
    """Compute GAN attribution based on forensic signals.

    GAN-generated images typically have different forensic profiles
    than diffusion models — more edge artifacts, less noise uniformity.
    """
    if ai_probability < 0.3:
        return {
            "stylegan": max(0, int(ai_probability * 10)),
            "others": max(0, int(ai_probability * 5)),
        }

    # GAN indicators: lower noise uniformity, more edge artifacts
    noise_uniformity = forensic.get("noise", {}).get("noise_uniformity", 0.5)
    edge_coherence = forensic.get("edges", {}).get("edge_coherence", 1.0)

    # GAN images tend to have LESS noise uniformity than diffusion
    # So higher noise_uniformity = LESS likely GAN
    gan_signal = (1.0 - noise_uniformity) * 0.6 + min(edge_coherence / 3.0, 1.0) * 0.4

    # GAN total is typically lower than diffusion for modern AI images
    gan_total = int(round(gan_signal * ai_probability * 40))

    stylegan_score = max(0, int(gan_total * 0.7))
    others_score = max(0, gan_total - stylegan_score)

    return {
        "stylegan": stylegan_score,
        "others": others_score,
    }


def get_confidence_label(ai_probability: float) -> str:
    """Get human-readable confidence label."""
    if ai_probability > 0.85:
        return "High"
    elif ai_probability > 0.65:
        return "Medium"
    else:
        return "Low"


def get_result_label(ai_probability: float) -> str:
    """Get the detection result label."""
    if ai_probability > 0.72:
        return "Likely AI-generated"
    elif ai_probability < 0.30:
        return "Likely Real"
    else:
        return "Uncertain"
