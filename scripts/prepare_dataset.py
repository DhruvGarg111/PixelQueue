from __future__ import annotations

import json
import os
import uuid
import sys
from pathlib import Path
from typing import Any

import yaml
from sqlalchemy import text


ROOT = Path(__file__).resolve().parents[1]
API_ROOT = ROOT / "api"
if str(API_ROOT) not in sys.path:
    sys.path.append(str(API_ROOT))

from app.db.session import SessionLocal  # noqa: E402
from app.services.minio_client import get_object_bytes  # noqa: E402


def _point_to_xy(point: Any) -> tuple[float, float]:
    if isinstance(point, dict):
        return float(point["x"]), float(point["y"])
    if isinstance(point, (list, tuple)) and len(point) == 2:
        return float(point[0]), float(point[1])
    raise ValueError("invalid polygon point payload")


def _to_yolo_row(class_id: int, geometry: dict[str, Any]) -> str:
    gtype = geometry.get("type")
    if gtype == "bbox":
        x = float(geometry["x"])
        y = float(geometry["y"])
        w = float(geometry["w"])
        h = float(geometry["h"])
        x_center = x + (w / 2.0)
        y_center = y + (h / 2.0)
        return f"{class_id} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}"
    if gtype == "polygon":
        points = geometry.get("points", [])
        flat = " ".join(f"{x:.6f} {y:.6f}" for x, y in (_point_to_xy(pt) for pt in points))
        return f"{class_id} {flat}".strip()
    raise ValueError(f"unsupported geometry type: {gtype}")


def _split_for_image(image_id: str, val_ratio: float) -> str:
    bucket = (uuid.UUID(image_id).int % 10_000) / 10_000.0
    return "val" if bucket < val_ratio else "train"


def main() -> None:
    dataset_root = ROOT / "tmp" / "dataset"
    images_train = dataset_root / "images" / "train"
    images_val = dataset_root / "images" / "val"
    labels_train = dataset_root / "labels" / "train"
    labels_val = dataset_root / "labels" / "val"
    dataset_root.mkdir(parents=True, exist_ok=True)
    images_train.mkdir(parents=True, exist_ok=True)
    images_val.mkdir(parents=True, exist_ok=True)
    labels_train.mkdir(parents=True, exist_ok=True)
    labels_val.mkdir(parents=True, exist_ok=True)

    val_ratio = float(os.getenv("VAL_RATIO", "0.2"))
    val_ratio = max(0.05, min(0.5, val_ratio))

    db = SessionLocal()
    try:
        image_rows = db.execute(
            text(
                """
                SELECT i.id, i.project_id, i.object_key, i.width, i.height
                FROM images i
                ORDER BY i.created_at ASC
                """
            )
        ).mappings().all()
        ann_rows = db.execute(
            text(
                """
                SELECT a.id, a.project_id, a.image_id, a.label, a.geometry_jsonb, a.status
                FROM annotations a
                WHERE a.status = 'approved'
                ORDER BY a.created_at ASC
                """
            )
        ).mappings().all()

        if not ann_rows:
            raise RuntimeError("No approved annotations found. Review/approve annotations before preparing dataset.")

        image_by_id = {str(row["id"]): row for row in image_rows}
        ann_by_image: dict[str, list[dict[str, Any]]] = {}
        for row in ann_rows:
            image_id = str(row["image_id"])
            ann_by_image.setdefault(image_id, []).append(dict(row))

        labels = sorted({str(row["label"]) for row in ann_rows})
        label_to_id = {label: idx for idx, label in enumerate(labels)}

        split_counts = {"train": {"images": 0, "annotations": 0}, "val": {"images": 0, "annotations": 0}}
        class_counts = {label: 0 for label in labels}

        for image_id, image_anns in ann_by_image.items():
            image_row = image_by_id.get(image_id)
            if not image_row:
                continue

            split = _split_for_image(image_id, val_ratio)
            image_dir = images_val if split == "val" else images_train
            label_dir = labels_val if split == "val" else labels_train

            suffix = Path(str(image_row["object_key"])).suffix or ".jpg"
            image_path = image_dir / f"{image_id}{suffix}"
            image_path.write_bytes(get_object_bytes(str(image_row["object_key"])))

            label_path = label_dir / f"{image_id}.txt"
            yolo_rows: list[str] = []
            for ann in image_anns:
                label = str(ann["label"])
                class_id = label_to_id[label]
                yolo_rows.append(_to_yolo_row(class_id, ann["geometry_jsonb"]))
                class_counts[label] += 1
            label_path.write_text("\n".join(yolo_rows) + "\n", encoding="utf-8")

            split_counts[split]["images"] += 1
            split_counts[split]["annotations"] += len(image_anns)

        dataset_yaml = {
            "path": str(dataset_root),
            "train": "images/train",
            "val": "images/val",
            "names": labels,
        }
        (dataset_root / "dataset.yaml").write_text(yaml.safe_dump(dataset_yaml, sort_keys=False), encoding="utf-8")

        summary = {
            "dataset_root": str(dataset_root),
            "labels": labels,
            "label_to_id": label_to_id,
            "class_counts": class_counts,
            "split_counts": split_counts,
            "totals": {
                "images": split_counts["train"]["images"] + split_counts["val"]["images"],
                "approved_annotations": split_counts["train"]["annotations"] + split_counts["val"]["annotations"],
            },
        }
        (dataset_root / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
        # Backward-compatible summary location used by evaluate.py defaults.
        (ROOT / "tmp" / "prepared_dataset.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
        print(f"Prepared YOLO dataset at {dataset_root}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
