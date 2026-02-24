from __future__ import annotations

from typing import Any

import cv2
import numpy as np


def _clip(v: float) -> float:
    return max(0.0, min(1.0, float(v)))


def run_yolo_segmentation(
    image_bgr: np.ndarray,
    model_name: str = "yolov8n-seg.pt",
    max_predictions: int = 12,
) -> list[dict[str, Any]]:
    """Best-effort YOLO segmentation provider.

    If ultralytics is unavailable or model loading fails, the caller should fallback.
    """

    try:
        from ultralytics import YOLO  # type: ignore
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError("ultralytics not installed") from exc

    model = YOLO(model_name)
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    results = model.predict(rgb, verbose=False)
    if not results:
        return []

    result = results[0]
    names = result.names if hasattr(result, "names") else {}
    h, w = rgb.shape[:2]
    predictions: list[dict[str, Any]] = []

    if result.masks is not None and result.boxes is not None:
        masks = result.masks.xy
        boxes = result.boxes
        for idx in range(min(len(masks), len(boxes))):
            polygon = masks[idx]
            if polygon is None or len(polygon) < 3:
                continue
            points = [{"x": _clip(float(pt[0]) / w), "y": _clip(float(pt[1]) / h)} for pt in polygon]

            cls_id = int(boxes.cls[idx].item()) if boxes.cls is not None else 0
            conf = float(boxes.conf[idx].item()) if boxes.conf is not None else 0.5
            label = str(names.get(cls_id, f"class_{cls_id}"))
            predictions.append(
                {
                    "label": label,
                    "confidence": _clip(conf),
                    "geometry": {"type": "polygon", "points": points},
                }
            )
            if len(predictions) >= max_predictions:
                break

    return predictions

