import pytest
from converters.geometry import geometry_to_yolo_row

def test_geometry_to_yolo_row_polygon():
    geometry = {
        "type": "polygon",
        "points": [
            {"x": 0.1, "y": 0.1},
            {"x": 0.2, "y": 0.1},
            {"x": 0.2, "y": 0.2},
            {"x": 0.1, "y": 0.2}
        ]
    }
    result = geometry_to_yolo_row(1, geometry)
    expected = "1 0.100000 0.100000 0.200000 0.100000 0.200000 0.200000 0.100000 0.200000"
    assert result == expected

def test_geometry_to_yolo_row_bbox():
    geometry = {
        "type": "bbox",
        "x": 0.1,
        "y": 0.2,
        "w": 0.3,
        "h": 0.4
    }
    result = geometry_to_yolo_row(2, geometry)
    expected = "2 0.250000 0.400000 0.300000 0.400000"
    assert result == expected

def test_geometry_to_yolo_row_too_few_points():
    geometry = {
        "type": "polygon",
        "points": [
            {"x": 0.1, "y": 0.1},
            {"x": 0.2, "y": 0.1}
        ]
    }
    result = geometry_to_yolo_row(3, geometry)
    expected = "3 0.500000 0.500000 1.000000 1.000000"
    assert result == expected
