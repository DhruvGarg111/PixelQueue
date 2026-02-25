from __future__ import annotations

import json
from pathlib import Path
from statistics import mean


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    dataset_path = ROOT / "tmp" / "dataset" / "summary.json"
    legacy_path = ROOT / "tmp" / "prepared_dataset.json"
    output_path = ROOT / "tmp" / "evaluation.json"

    if not dataset_path.exists() and legacy_path.exists():
        dataset_path = legacy_path
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset summary not found at {dataset_path}. Run prepare_dataset.py first.")

    payload = json.loads(dataset_path.read_text(encoding="utf-8"))
    totals = payload.get("totals", {})
    image_count = int(totals.get("images", payload.get("summary", {}).get("images", 0)))
    ann_count = int(totals.get("approved_annotations", payload.get("summary", {}).get("approved_annotations", 0)))
    split_counts = payload.get("split_counts", {})
    class_counts = payload.get("class_counts", {})

    density = ann_count / image_count if image_count else 0.0
    class_distribution = list(class_counts.values())
    class_balance = 0.0
    if class_distribution:
        avg = mean(class_distribution)
        max_dev = max(abs(x - avg) for x in class_distribution)
        class_balance = max(0.0, 1.0 - (max_dev / max(avg, 1.0)))

    metrics = {
        "image_count": image_count,
        "approved_annotation_count": ann_count,
        "annotation_density": density,
        "train_images": int(split_counts.get("train", {}).get("images", 0)),
        "val_images": int(split_counts.get("val", {}).get("images", 0)),
        "class_balance_score": round(class_balance, 4),
        "quality_proxy_score": round(min(1.0, 0.2 + density / 8.0 + class_balance * 0.2), 4),
    }
    output_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    print(f"Evaluation metrics written to {output_path}")


if __name__ == "__main__":
    main()
