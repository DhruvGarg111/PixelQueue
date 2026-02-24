from __future__ import annotations

from typing import Any

import cv2
import numpy as np


def _normalize_point(x: int, y: int, width: int, height: int) -> dict[str, float]:
    return {"x": max(0.0, min(1.0, x / float(width))), "y": max(0.0, min(1.0, y / float(height)))}


def run_cv_fallback(image_bgr: np.ndarray, max_predictions: int = 12) -> list[dict[str, Any]]:
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, threshold1=40, threshold2=120)
    kernel = np.ones((3, 3), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    height, width = image_bgr.shape[:2]

    predictions: list[dict[str, Any]] = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 300:
            continue
        epsilon = 0.01 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        points = [_normalize_point(int(pt[0][0]), int(pt[0][1]), width, height) for pt in approx]
        if len(points) < 3:
            continue
        x, y, w, h = cv2.boundingRect(contour)
        bbox_area = max(1.0, float(w * h))
        confidence = max(0.2, min(0.95, area / bbox_area))
        predictions.append(
            {
                "label": "object",
                "confidence": float(confidence),
                "geometry": {
                    "type": "polygon",
                    "points": points,
                },
            }
        )
        if len(predictions) >= max_predictions:
            break

    if not predictions:
        predictions.append(
            {
                "label": "scene",
                "confidence": 0.1,
                "geometry": {"type": "bbox", "x": 0.1, "y": 0.1, "w": 0.8, "h": 0.8},
            }
        )

    return predictions

