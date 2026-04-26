"""
OpenCV-based forensic analysis module for TruthScan AI Pro.
Extracts low-level image forensic signals to assist AI detection.
"""

import cv2
import numpy as np


def analyze_image(image_bgr: np.ndarray) -> dict:
    """Run full forensic analysis on a BGR image.

    Args:
        image_bgr: OpenCV BGR image array.

    Returns:
        Dictionary with forensic signals and scores.
    """
    results = {}

    # Convert to grayscale for many operations
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    results["noise"] = _analyze_noise(gray)
    results["blur"] = _analyze_blur(gray)
    results["edges"] = _analyze_edges(gray)
    results["jpeg_artifacts"] = _analyze_jpeg_artifacts(image_bgr)
    results["color_stats"] = _analyze_color_distribution(image_bgr)
    results["texture"] = _analyze_texture(gray)

    # Compute overall forensic suspicion score (0-1)
    results["forensic_score"] = _compute_forensic_score(results)

    return results


def _analyze_noise(gray: np.ndarray) -> dict:
    """Analyze noise patterns. AI-generated images often have unnaturally uniform noise."""
    # Laplacian variance — measures high-frequency content
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    lap_var = float(laplacian.var())
    lap_mean = float(np.abs(laplacian).mean())

    # Noise estimation via difference between original and gaussian-blurred
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    noise_map = cv2.absdiff(gray, blurred).astype(np.float64)
    noise_std = float(noise_map.std())
    noise_mean = float(noise_map.mean())

    # Uniformity of noise (AI images tend to have more uniform noise)
    h, w = gray.shape
    block_size = max(h, w) // 4
    if block_size > 10:
        blocks = []
        for i in range(0, h - block_size, block_size):
            for j in range(0, w - block_size, block_size):
                block = noise_map[i:i + block_size, j:j + block_size]
                blocks.append(float(block.std()))
        noise_uniformity = 1.0 - min(float(np.std(blocks)) / (noise_std + 1e-8), 1.0)
    else:
        noise_uniformity = 0.5

    return {
        "laplacian_variance": lap_var,
        "laplacian_mean": lap_mean,
        "noise_std": noise_std,
        "noise_mean": noise_mean,
        "noise_uniformity": noise_uniformity,
    }


def _analyze_blur(gray: np.ndarray) -> dict:
    """Detect blur characteristics. AI images may have inconsistent blur."""
    # Global blur via Laplacian variance
    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_blurry = lap_var < 100

    # Local blur variation — split image into quadrants
    h, w = gray.shape
    mid_h, mid_w = h // 2, w // 2
    quadrants = [
        gray[:mid_h, :mid_w],
        gray[:mid_h, mid_w:],
        gray[mid_h:, :mid_w],
        gray[mid_h:, mid_w:],
    ]
    quad_blurs = [float(cv2.Laplacian(q, cv2.CV_64F).var()) for q in quadrants]
    blur_variance = float(np.std(quad_blurs))

    # Inconsistent blur across quadrants can signal manipulation
    blur_inconsistency = min(blur_variance / (np.mean(quad_blurs) + 1e-8), 1.0)

    return {
        "laplacian_variance": lap_var,
        "is_blurry": is_blurry,
        "blur_inconsistency": float(blur_inconsistency),
        "quadrant_blurs": quad_blurs,
    }


def _analyze_edges(gray: np.ndarray) -> dict:
    """Analyze edge patterns for inconsistencies."""
    # Canny edge detection
    edges = cv2.Canny(gray, 50, 150)
    edge_density = float(np.sum(edges > 0)) / float(edges.size)

    # Sobel gradients
    sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    gradient_magnitude = np.sqrt(sobel_x ** 2 + sobel_y ** 2)
    gradient_mean = float(gradient_magnitude.mean())
    gradient_std = float(gradient_magnitude.std())

    # Edge coherence — ratio of std to mean (lower = more uniform = possibly AI)
    edge_coherence = gradient_std / (gradient_mean + 1e-8)

    return {
        "edge_density": edge_density,
        "gradient_mean": gradient_mean,
        "gradient_std": gradient_std,
        "edge_coherence": float(edge_coherence),
    }


def _analyze_jpeg_artifacts(image_bgr: np.ndarray) -> dict:
    """Detect JPEG compression artifacts and inconsistencies."""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)

    # Encode at different quality levels and measure difference
    _, buf_high = cv2.imencode('.jpg', gray, [cv2.IMWRITE_JPEG_QUALITY, 95])
    _, buf_low = cv2.imencode('.jpg', gray, [cv2.IMWRITE_JPEG_QUALITY, 50])

    decoded_high = cv2.imdecode(buf_high, cv2.IMREAD_GRAYSCALE)
    decoded_low = cv2.imdecode(buf_low, cv2.IMREAD_GRAYSCALE)

    diff_high = cv2.absdiff(gray, decoded_high).astype(np.float64)
    diff_low = cv2.absdiff(gray, decoded_low).astype(np.float64)

    artifact_score_high = float(diff_high.mean())
    artifact_score_low = float(diff_low.mean())

    # Double compression detection heuristic
    double_compression_indicator = artifact_score_low / (artifact_score_high + 1e-8)

    return {
        "artifact_score_high_q": artifact_score_high,
        "artifact_score_low_q": artifact_score_low,
        "double_compression_indicator": float(double_compression_indicator),
    }


def _analyze_color_distribution(image_bgr: np.ndarray) -> dict:
    """Analyze color distribution patterns."""
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)

    stats = {}
    channel_names = ["hue", "saturation", "value"]
    for i, name in enumerate(channel_names):
        channel = hsv[:, :, i].astype(np.float64)
        stats[f"{name}_mean"] = float(channel.mean())
        stats[f"{name}_std"] = float(channel.std())

    # Color diversity — number of unique hue values relative to possible
    unique_hues = len(np.unique(hsv[:, :, 0]))
    stats["color_diversity"] = unique_hues / 180.0  # Hue range in OpenCV is 0-179

    # Saturation uniformity (AI images often have uniform saturation)
    sat_channel = hsv[:, :, 1].astype(np.float64)
    stats["saturation_uniformity"] = 1.0 - min(float(sat_channel.std()) / 80.0, 1.0)

    return stats


def _analyze_texture(gray: np.ndarray) -> dict:
    """Analyze texture patterns using local binary patterns approximation."""
    # Simple texture analysis using gradient statistics
    dx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    dy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)

    magnitude = np.sqrt(dx ** 2 + dy ** 2)
    direction = np.arctan2(dy, dx)

    # Texture regularity — how uniform are the gradient directions
    dir_hist, _ = np.histogram(direction, bins=36, range=(-np.pi, np.pi))
    dir_hist = dir_hist.astype(np.float64)
    dir_hist /= dir_hist.sum() + 1e-8
    entropy = -np.sum(dir_hist * np.log2(dir_hist + 1e-8))
    max_entropy = np.log2(36)
    texture_regularity = 1.0 - (entropy / max_entropy)

    return {
        "texture_magnitude_mean": float(magnitude.mean()),
        "texture_magnitude_std": float(magnitude.std()),
        "texture_regularity": float(texture_regularity),
        "direction_entropy": float(entropy),
    }


def _compute_forensic_score(results: dict) -> float:
    """Compute overall forensic suspicion score (0-1).

    Higher scores indicate more suspicion of AI generation.
    """
    signals = []

    # Noise uniformity — reduce impact so it doesn't dominate real compressed photos
    noise_uni = results["noise"]["noise_uniformity"]
    signals.append(noise_uni * 0.10)

    # Low noise standard deviation
    noise_std = results["noise"]["noise_std"]
    clean_score = max(0, 1.0 - noise_std / 15.0)
    signals.append(clean_score * 0.10)

    # Blur inconsistency is suspicious
    blur_inc = results["blur"]["blur_inconsistency"]
    signals.append(min(blur_inc, 1.0) * 0.15)

    # Low edge coherence is suspicious
    edge_coh = results["edges"]["edge_coherence"]
    low_edge = max(0, 1.0 - edge_coh / 2.0)
    signals.append(low_edge * 0.15)

    # High saturation uniformity is suspicious
    sat_uni = results["color_stats"]["saturation_uniformity"]
    signals.append(sat_uni * 0.15)

    # High texture regularity is suspicious
    tex_reg = results["texture"]["texture_regularity"]
    signals.append(tex_reg * 0.15)

    score = sum(signals)
    
    # Image Quality Adjustment: Reduce false positives for typical mobile photos
    is_blurry = results["blur"].get("is_blurry", False)
    blur_inc = results["blur"].get("blur_inconsistency", 0.0)
    noise_std = results["noise"].get("noise_std", 0.0)
    
    # If blurry but blur is fairly consistent (natural DSLR or motion blur)
    if is_blurry and blur_inc < 0.6:
        score *= 0.50  # Reduce forensic suspicion heavily for natural blur
        
    # If the image has high natural noise (typical low-light mobile)
    if noise_std > 20.0:
        score *= 0.70
        
    return float(np.clip(score, 0.0, 1.0))
