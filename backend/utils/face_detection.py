"""
Face detection module for TruthScan AI Pro.
Uses OpenCV DNN face detector for face detection and analysis.
"""

import os
import logging
import urllib.request
import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Model file paths
_MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
_PROTOTXT_URL = "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt"
_CAFFEMODEL_URL = "https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel"
_PROTOTXT_PATH = os.path.join(_MODELS_DIR, "deploy.prototxt")
_CAFFEMODEL_PATH = os.path.join(_MODELS_DIR, "res10_300x300_ssd_iter_140000.caffemodel")

_face_net = None


def _ensure_models_downloaded():
    """Download face detection models if not present."""
    os.makedirs(_MODELS_DIR, exist_ok=True)

    if not os.path.exists(_PROTOTXT_PATH):
        logger.info("Downloading face detector prototxt...")
        urllib.request.urlretrieve(_PROTOTXT_URL, _PROTOTXT_PATH)
        logger.info("Face detector prototxt downloaded.")

    if not os.path.exists(_CAFFEMODEL_PATH):
        logger.info("Downloading face detector caffemodel (~10MB)...")
        urllib.request.urlretrieve(_CAFFEMODEL_URL, _CAFFEMODEL_PATH)
        logger.info("Face detector caffemodel downloaded.")


def _get_face_net():
    """Get or initialize the face detection network."""
    global _face_net
    if _face_net is None:
        _ensure_models_downloaded()
        _face_net = cv2.dnn.readNetFromCaffe(_PROTOTXT_PATH, _CAFFEMODEL_PATH)
        logger.info("Face detection network loaded.")
    return _face_net


def detect_faces(image_bgr: np.ndarray, confidence_threshold: float = 0.5) -> list:
    """Detect faces in a BGR image.

    Args:
        image_bgr: OpenCV BGR image array.
        confidence_threshold: Minimum confidence for a detection.

    Returns:
        List of dicts with keys: 'box' (x1,y1,x2,y2), 'confidence'.
    """
    net = _get_face_net()
    h, w = image_bgr.shape[:2]

    # Prepare blob
    blob = cv2.dnn.blobFromImage(
        cv2.resize(image_bgr, (300, 300)),
        1.0, (300, 300),
        (104.0, 177.0, 123.0)
    )
    net.setInput(blob)
    detections = net.forward()

    faces = []
    for i in range(detections.shape[2]):
        confidence = float(detections[0, 0, i, 2])
        if confidence < confidence_threshold:
            continue

        box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
        x1, y1, x2, y2 = box.astype(int)

        # Clamp to image bounds
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(w, x2)
        y2 = min(h, y2)

        if x2 > x1 and y2 > y1:
            faces.append({
                "box": [int(x1), int(y1), int(x2), int(y2)],
                "confidence": confidence,
            })

    return faces


def crop_face(image_bgr: np.ndarray, box: list, margin: float = 0.2) -> np.ndarray:
    """Crop a face region with margin from an image.

    Args:
        image_bgr: Full BGR image.
        box: [x1, y1, x2, y2] bounding box.
        margin: Fractional margin to add around the face.

    Returns:
        Cropped BGR image of the face region.
    """
    h, w = image_bgr.shape[:2]
    x1, y1, x2, y2 = box
    face_w = x2 - x1
    face_h = y2 - y1

    # Add margin
    mx = int(face_w * margin)
    my = int(face_h * margin)
    x1 = max(0, x1 - mx)
    y1 = max(0, y1 - my)
    x2 = min(w, x2 + mx)
    y2 = min(h, y2 + my)

    return image_bgr[y1:y2, x1:x2].copy()


def analyze_face_manipulation(image_bgr: np.ndarray, faces: list) -> dict:
    """Analyze detected faces for manipulation signals using forensic heuristics.

    Uses multiple OpenCV-based signals to estimate face manipulation probability
    without requiring a dedicated deepfake model.

    Args:
        image_bgr: Full BGR image.
        faces: List of detected face dicts from detect_faces().

    Returns:
        Dict with 'has_faces', 'face_count', 'manipulation_score', 'details'.
    """
    if not faces:
        return {
            "has_faces": False,
            "face_count": 0,
            "manipulation_score": 0.0,
            "details": [],
        }

    face_details = []
    manipulation_scores = []

    for face in faces:
        face_crop = crop_face(image_bgr, face["box"])
        if face_crop.size == 0:
            continue

        face_gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)

        # 1. Blending artifact detection — analyze boundary of face region
        boundary_score = _analyze_face_boundary(image_bgr, face["box"])

        # 2. Noise consistency between face and background
        noise_score = _analyze_face_noise_consistency(image_bgr, face["box"])

        # 3. Symmetry analysis (AI faces tend to be more symmetric)
        symmetry_score = _analyze_face_symmetry(face_gray)

        # 4. Skin smoothness analysis
        smoothness_score = _analyze_skin_smoothness(face_gray)

        # Combine signals
        manipulation = (
            boundary_score * 0.3 +
            noise_score * 0.25 +
            symmetry_score * 0.2 +
            smoothness_score * 0.25
        )
        manipulation = float(np.clip(manipulation, 0.0, 1.0))
        manipulation_scores.append(manipulation)

        face_details.append({
            "box": face["box"],
            "detection_confidence": face["confidence"],
            "manipulation_score": manipulation,
            "signals": {
                "boundary_artifacts": boundary_score,
                "noise_inconsistency": noise_score,
                "symmetry_anomaly": symmetry_score,
                "skin_smoothness_anomaly": smoothness_score,
            }
        })

    avg_manipulation = float(np.mean(manipulation_scores)) if manipulation_scores else 0.0

    return {
        "has_faces": True,
        "face_count": len(faces),
        "manipulation_score": avg_manipulation,
        "details": face_details,
    }


def _analyze_face_boundary(image_bgr: np.ndarray, box: list) -> float:
    """Check for blending artifacts at face boundary."""
    h, w = image_bgr.shape[:2]
    x1, y1, x2, y2 = box

    # Create a mask for the boundary region
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.rectangle(mask, (x1, y1), (x2, y2), 255, thickness=max(3, (x2 - x1) // 20))

    # Analyze gradient magnitude at boundary
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    gradient = np.sqrt(sobel_x ** 2 + sobel_y ** 2)

    boundary_gradient = gradient[mask > 0]
    if len(boundary_gradient) == 0:
        return 0.0

    # Very smooth boundary (low gradient) can indicate blending
    mean_grad = float(boundary_gradient.mean())
    # Normalize: lower gradient = higher suspicion
    score = max(0, 1.0 - mean_grad / 50.0)
    return float(np.clip(score, 0.0, 1.0))


def _analyze_face_noise_consistency(image_bgr: np.ndarray, box: list) -> float:
    """Compare noise levels between face region and background."""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY).astype(np.float64)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    noise = cv2.absdiff(gray.astype(np.uint8), blurred.astype(np.uint8)).astype(np.float64)

    x1, y1, x2, y2 = box
    face_noise = noise[y1:y2, x1:x2]
    bg_noise = noise.copy()
    bg_noise[y1:y2, x1:x2] = 0

    face_std = float(face_noise.std()) if face_noise.size > 0 else 0
    # Create a bg mask
    bg_mask = np.ones_like(noise)
    bg_mask[y1:y2, x1:x2] = 0
    bg_vals = noise[bg_mask > 0]
    bg_std = float(bg_vals.std()) if bg_vals.size > 0 else 0

    # Large difference in noise between face and background is suspicious
    diff = abs(face_std - bg_std)
    score = min(diff / 5.0, 1.0)
    return float(score)


def _analyze_face_symmetry(face_gray: np.ndarray) -> float:
    """Analyze facial symmetry. Perfectly symmetric faces are suspicious."""
    h, w = face_gray.shape
    mid = w // 2

    if mid < 10:
        return 0.0

    left = face_gray[:, :mid].astype(np.float64)
    right = np.flip(face_gray[:, w - mid:], axis=1).astype(np.float64)

    # Resize to match if needed
    min_w = min(left.shape[1], right.shape[1])
    left = left[:, :min_w]
    right = right[:, :min_w]

    diff = np.abs(left - right)
    symmetry = 1.0 - float(diff.mean()) / 128.0  # Normalize

    # Very high symmetry (>0.9) is suspicious for AI
    if symmetry > 0.85:
        return float((symmetry - 0.85) / 0.15)  # 0 at 0.85, 1 at 1.0
    return 0.0


def _analyze_skin_smoothness(face_gray: np.ndarray) -> float:
    """Detect unnaturally smooth skin (common in AI generations)."""
    if face_gray.size < 100:
        return 0.0

    laplacian = cv2.Laplacian(face_gray, cv2.CV_64F)
    lap_var = float(laplacian.var())

    # Very low variance = very smooth = suspicious
    if lap_var < 200:
        return float(max(0, 1.0 - lap_var / 200.0))
    return 0.0
