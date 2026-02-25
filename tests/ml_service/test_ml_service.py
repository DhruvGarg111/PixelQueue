import base64
import io
import sys
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
ML_SRC = ROOT / "ml-service"
if str(ML_SRC) not in sys.path:
    sys.path.insert(0, str(ML_SRC))

# Force ml-service package resolution when another top-level `app` package is present.
for module_name in list(sys.modules):
    if module_name == "app" or module_name.startswith("app."):
        sys.modules.pop(module_name, None)

from app.main import app  # noqa: E402


client = TestClient(app)


def image_b64() -> str:
    image = Image.new("RGB", (512, 320), "white")
    draw = ImageDraw.Draw(image)
    draw.rectangle((100, 80, 260, 220), outline="black", width=4)
    draw.ellipse((320, 100, 440, 220), outline="blue", width=4)
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def test_fallback_provider_returns_valid_predictions():
    res = client.post(
        "/infer/auto-label",
        json={"image_base64": image_b64(), "provider": "cv_fallback", "max_predictions": 5},
    )
    assert res.status_code == 200, res.text
    payload = res.json()
    assert payload["provider"] == "cv_fallback"
    assert len(payload["predictions"]) > 0
    for pred in payload["predictions"]:
        assert pred["geometry"]["type"] in {"bbox", "polygon"}


def test_yolo_provider_falls_back_when_unavailable():
    res = client.post(
        "/infer/auto-label",
        json={"image_base64": image_b64(), "provider": "yolo_seg", "max_predictions": 5},
    )
    assert res.status_code == 200, res.text
    payload = res.json()
    assert payload["provider"] in {"yolo_seg", "cv_fallback"}
    assert len(payload["predictions"]) > 0
