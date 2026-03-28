"""
YOLOv8 object detection and tag extraction for TruthScan AI Pro.
"""

import logging
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

_yolo_model = None


def _get_yolo_model():
    """Lazy-load YOLOv8 nano model."""
    global _yolo_model
    if _yolo_model is None:
        try:
            from ultralytics import YOLO
            logger.info("Loading YOLOv8n model (auto-download if needed)...")
            _yolo_model = YOLO("yolov8n.pt")
            logger.info("YOLOv8n model loaded.")
        except Exception as e:
            logger.error(f"Failed to load YOLOv8 model: {e}")
            _yolo_model = None
    return _yolo_model


def detect_objects(image: Image.Image, confidence_threshold: float = 0.3) -> dict:
    """Run YOLOv8 object detection on an image.

    Args:
        image: PIL Image (RGB).
        confidence_threshold: Minimum detection confidence.

    Returns:
        Dict with 'detections' (list) and 'tags' (list of unique labels).
    """
    model = _get_yolo_model()

    if model is None:
        return {
            "detections": [],
            "tags": [],
            "scene_context": "unknown",
            "has_person": False,
        }

    try:
        # Run inference
        results = model(image, verbose=False, conf=confidence_threshold)
        result = results[0]

        detections = []
        tag_counts = {}

        for box in result.boxes:
            cls_id = int(box.cls[0])
            label = result.names[cls_id]
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].cpu().numpy().tolist()

            detections.append({
                "label": label,
                "confidence": conf,
                "box": [int(x) for x in xyxy],
            })

            tag_counts[label] = tag_counts.get(label, 0) + 1

        # Derive tags (unique labels sorted by count)
        tags = sorted(tag_counts.keys(), key=lambda t: tag_counts[t], reverse=True)

        # Determine scene context
        scene_context = _infer_scene_context(tags, detections)
        has_person = "person" in tags

        return {
            "detections": detections,
            "tags": tags,
            "scene_context": scene_context,
            "has_person": has_person,
        }

    except Exception as e:
        logger.error(f"YOLOv8 inference failed: {e}")
        return {
            "detections": [],
            "tags": [],
            "scene_context": "unknown",
            "has_person": False,
        }


def _infer_scene_context(tags: list, detections: list) -> str:
    """Infer scene context from detected objects."""
    indoor_objects = {
        "chair", "couch", "bed", "dining table", "tv", "laptop",
        "keyboard", "mouse", "remote", "microwave", "oven",
        "refrigerator", "book", "clock", "vase", "toilet", "sink",
    }
    outdoor_objects = {
        "car", "truck", "bus", "motorcycle", "bicycle", "traffic light",
        "stop sign", "parking meter", "fire hydrant", "boat", "airplane",
        "train", "horse", "cow", "sheep", "bird", "kite",
    }
    person_objects = {"person", "tie", "handbag", "backpack", "suitcase"}

    tag_set = set(tags)

    indoor_count = len(tag_set & indoor_objects)
    outdoor_count = len(tag_set & outdoor_objects)
    person_count = len(tag_set & person_objects)

    contexts = []
    if "person" in tag_set:
        # Check if portrait-like
        if len(detections) <= 3 and person_count > 0:
            contexts.append("portrait")
        else:
            contexts.append("people")

    if indoor_count > outdoor_count:
        contexts.append("indoor")
    elif outdoor_count > indoor_count:
        contexts.append("outdoor")

    if not contexts:
        if tags:
            contexts.append("scene")
        else:
            contexts.append("unknown")

    return ", ".join(contexts)
