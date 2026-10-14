"""
LunarVision AI - Backend Automated Test Suite
Verifies all FastAPI endpoints, image decoding, enhancement pipelines, and scientific telemetry.
"""

import io
import os
import sys
import numpy as np
import cv2
import tifffile
from fastapi.testclient import TestClient

# Ensure both current directory and parent directory are on sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

try:
    from backend.main import app
except (ImportError, ModuleNotFoundError):
    from main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200, f"Health check failed: {response.text}"
    data = response.json()
    assert data["status"] == "operational"
    assert "opencv_version" in data
    assert data["available_samples_count"] >= 5
    print("PASS: test_health")


def test_samples_catalog():
    response = client.get("/api/samples")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 5
    first_sample = data["samples"][0]
    assert "id" in first_sample
    assert "title" in first_sample
    assert "attribution" in first_sample
    assert "recommended_preset" in first_sample
    print(f"PASS: test_samples_catalog ({data['count']} verified lunar images)")

    # Test downloading sample image directly
    sample_id = first_sample["id"]
    img_resp = client.get(f"/api/samples/{sample_id}/image")
    assert img_resp.status_code == 200
    assert len(img_resp.content) > 1000
    print(f"PASS: test_samples_image_stream for '{sample_id}' ({len(img_resp.content)} bytes)")


def test_upload_and_enhance():
    # 1. Create synthetic lunar crater test image in memory
    img = np.zeros((300, 300), dtype=np.uint8)
    cv2.circle(img, (150, 150), 90, 30, -1)   # dark crater interior
    cv2.circle(img, (150, 150), 90, 210, 4)   # bright sunlit rim
    
    buf = cv2.imencode(".png", img)[1].tobytes()

    # Upload test image
    files = {"file": ("crater_test.png", buf, "image/png")}
    up_resp = client.post("/api/upload", files=files)
    assert up_resp.status_code == 200, f"Upload failed: {up_resp.text}"
    up_data = up_resp.json()
    image_id = up_data["image_id"]
    assert up_data["dimensions"]["width"] == 300
    assert up_data["dimensions"]["height"] == 300
    assert up_data["channels"] == 1
    assert "initial_stats" in up_data
    print(f"PASS: test_upload (Registered image ID: {image_id})")

    # 2. Enhance image using image_id
    enhance_params = {
        "image_id": image_id,
        "brightness": 10.0,
        "contrast": 1.3,
        "gamma": 0.6,
        "clahe_clip_limit": 3.0,
        "clahe_grid_size": 8,
        "shadow_boost": 50.0,
        "denoise_strength": 12.0,
        "denoise_method": "bilateral",
        "sharpen_strength": 0.8,
        "sharpen_radius": 1.0,
        "monochrome_output": False
    }
    enh_resp = client.post("/api/enhance", data=enhance_params)
    assert enh_resp.status_code == 200, f"Enhance failed: {enh_resp.text}"
    enh_data = enh_resp.json()
    assert enh_data["success"] is True
    assert enh_data["enhanced_base64"].startswith("data:image/png;base64,")
    telemetry = enh_data["telemetry"]
    assert "elapsed_ms" in telemetry
    assert "histogram_256" in telemetry["enhanced_stats"]
    assert len(telemetry["enhanced_stats"]["histogram_256"]) == 256
    print(f"PASS: test_enhance (Execution time: {telemetry['elapsed_ms']} ms)")

    # 3. Test export
    export_resp = client.post(
        "/api/export",
        data={"image_id": image_id, "export_format": "PNG", "filename_prefix": "test_lunar"}
    )
    assert export_resp.status_code == 200
    assert export_resp.headers["content-type"] == "image/png"
    assert "attachment" in export_resp.headers["content-disposition"]
    print(f"PASS: test_export_png ({len(export_resp.content)} bytes)")


def test_scientific_16bit_tiff_upload():
    # Create 16-bit TIFF image
    raw_16 = (np.random.rand(250, 250) * 12000).astype(np.uint16)
    bio = io.BytesIO()
    tifffile.imwrite(bio, raw_16)
    tiff_bytes = bio.getvalue()

    files = {"file": ("lro_polar_16bit.tif", tiff_bytes, "image/tiff")}
    resp = client.post("/api/upload", files=files)
    assert resp.status_code == 200, f"16-bit TIFF upload failed: {resp.text}"
    data = resp.json()
    assert data["bit_depth"] == 16
    print(f"PASS: test_scientific_16bit_tiff_upload (Bit depth detected: {data['bit_depth']})")


def test_error_handling():
    # Test invalid extension
    fake_file = {"file": ("script.exe", b"binarycontent", "application/octet-stream")}
    resp = client.post("/api/upload", files=fake_file)
    assert resp.status_code == 415

    # Test missing image ID
    resp2 = client.post("/api/enhance", data={"image_id": "non_existent_id_xyz"})
    assert resp2.status_code == 404
    print("PASS: test_error_handling (Handled 415 and 404 safely)")


if __name__ == "__main__":
    test_health()
    test_samples_catalog()
    test_upload_and_enhance()
    test_scientific_16bit_tiff_upload()
    test_error_handling()
    print("\nALL BACKEND AUTOMATED TESTS PASSED SUCCESSFULLY!")
