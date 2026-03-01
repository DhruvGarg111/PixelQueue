"""COCO and YOLO geometry conversion utilities for annotation export."""

from __future__ import annotations

from typing import Any


def point_to_xy(point: Any) -> tuple[float, float]:
    """Normalize a point payload (dict or list/tuple) into (x, y)."""
    if isinstance(point, dict):
        return float(point["x"]), float(point["y"])
    if isinstance(point, (list, tuple)) and len(point) == 2:
        return float(point[0]), float(point[1])
    raise ValueError("invalid polygon point payload")


def polygon_area(points: list[tuple[float, float]]) -> float:
    """Calculate the area of a polygon using the Shoelace formula."""
    if len(points) < 3:
        return 0.0
    area = 0.0
    for idx, (x1, y1) in enumerate(points):
        x2, y2 = points[(idx + 1) % len(points)]
        area += (x1 * y2) - (x2 * y1)
    return abs(area) * 0.5


def geometry_to_coco(
    geometry: dict[str, Any], width: int, height: int
) -> tuple[list[float], list[float], float]:
    """Convert a normalized geometry dict to COCO format (bbox, segmentation, area)."""
    if geometry.get("type") == "bbox":
        x = float(geometry["x"]) * width
        y = float(geometry["y"]) * height
        w = float(geometry["w"]) * width
        h = float(geometry["h"]) * height
        return [x, y, w, h], [], w * h

    points = geometry.get("points", [])
    abs_points = [(x * width, y * height) for x, y in (point_to_xy(p) for p in points)]
    if len(abs_points) < 3:
        return [0.0, 0.0, 0.0, 0.0], [], 0.0

    xs = [p[0] for p in abs_points]
    ys = [p[1] for p in abs_points]
    x_min, x_max = min(xs), max(xs)
    y_min, y_max = min(ys), max(ys)
    bbox = [x_min, y_min, x_max - x_min, y_max - y_min]
    segmentation = [coord for xy in abs_points for coord in xy]
    area = polygon_area(abs_points)
    return bbox, segmentation, area


def geometry_to_yolo_row(class_id: int, geometry: dict[str, Any]) -> str:
    """Convert a normalized geometry dict to a YOLO label row."""
    if geometry.get("type") == "bbox":
        x = float(geometry["x"])
        y = float(geometry["y"])
        w = float(geometry["w"])
        h = float(geometry["h"])
        x_center = x + w / 2.0
        y_center = y + h / 2.0
        return f"{class_id} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}"

    pts = geometry.get("points", [])
    if len(pts) < 3:
        return f"{class_id} 0.500000 0.500000 1.000000 1.000000"
    flattened = " ".join([f"{x:.6f} {y:.6f}" for x, y in (point_to_xy(p) for p in pts)])
    return f"{class_id} {flattened}".strip()
