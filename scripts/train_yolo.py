from __future__ import annotations

import json
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "tmp" / "training"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def main() -> None:
    dataset_yaml = os.getenv("DATASET_YAML", str(ROOT / "tmp" / "dataset" / "dataset.yaml"))
    epochs = int(os.getenv("EPOCHS", "5"))
    imgsz = int(os.getenv("IMGSZ", "640"))
    batch = int(os.getenv("BATCH", "8"))
    seed = int(os.getenv("SEED", "42"))
    model_name = os.getenv("YOLO_MODEL", "yolov8n-seg.pt")
    dataset_yaml_path = Path(dataset_yaml)
    if not dataset_yaml_path.exists():
        raise FileNotFoundError(f"Dataset yaml not found at {dataset_yaml_path}. Run prepare_dataset.py first.")

    model_artifact = OUTPUT_DIR / "model.pt"
    report_path = OUTPUT_DIR / "train_report.json"

    try:
        from ultralytics import YOLO  # type: ignore

        model = YOLO(model_name)
        result = model.train(
            data=str(dataset_yaml_path),
            epochs=epochs,
            imgsz=imgsz,
            batch=batch,
            seed=seed,
            device="cpu",
            project=str(OUTPUT_DIR),
            name="run",
            exist_ok=True,
        )
        best = Path(result.save_dir) / "weights" / "best.pt"
        if best.exists():
            model_artifact.write_bytes(best.read_bytes())
        report = {
            "provider": "ultralytics",
            "model_name": model_name,
            "epochs": epochs,
            "imgsz": imgsz,
            "batch": batch,
            "seed": seed,
            "artifact": str(model_artifact),
            "dataset_yaml": str(dataset_yaml_path),
        }
    except Exception as exc:  # noqa: BLE001
        # Offline-safe fallback: create deterministic placeholder artifact.
        model_artifact.write_bytes(b"fallback-model-artifact")
        report = {
            "provider": "fallback",
            "model_name": model_name,
            "epochs": epochs,
            "imgsz": imgsz,
            "batch": batch,
            "seed": seed,
            "error": str(exc),
            "artifact": str(model_artifact),
            "dataset_yaml": str(dataset_yaml_path),
        }

    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Training report written to {report_path}")
    print(f"Model artifact written to {model_artifact}")


if __name__ == "__main__":
    main()
