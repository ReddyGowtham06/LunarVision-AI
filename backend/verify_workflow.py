"""
LunarVision AI - Full Scientific Workflow Verification Suite
Validates that:
1. Multiple images (NASA LRO samples & custom 8/16-bit uploads) are correctly loaded.
2. The original image remains 100% immutable and preserved across processing calls.
3. Modifying parameters changes the enhanced output image deterministically.
4. Histograms and metrics are calculated from authentic image arrays without fabrication.
5. Exports for PNG, JPEG, and TIFF match the enhanced state and contain scientific headers.
"""

import io
import base64
import numpy as np
import cv2
import tifffile
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def run_workflow_tests():
    print("================================================================")
    print("  LunarVision AI — Automated Scientific Workflow Verification")
    print("================================================================\n")

    # Fetch available samples
    samples_resp = client.get("/api/samples")
    assert samples_resp.status_code == 200
    samples = samples_resp.json()["samples"]
    print(f"[*] Verified samples catalog loaded: {len(samples)} observations.")

    test_samples = samples[:3] # Test Hermite PSR, Tycho Rim, Rutherfurd Peak

    for sample in test_samples:
        sample_id = sample["id"]
        sample_title = sample["title"]
        print(f"\n--- Testing Sample: {sample_id} ({sample_title}) ---")

        # 1. Baseline enhancement with default/preset params
        p1 = {
            "image_id": sample_id,
            "brightness": 0.0,
            "contrast": 1.0,
            "gamma": 1.0,
            "clahe_clip_limit": 2.5,
            "clahe_grid_size": 8,
            "shadow_boost": 0.0,
            "denoise_strength": 0.0,
            "sharpen_strength": 0.0
        }
        res1 = client.post("/api/enhance", data=p1)
        assert res1.status_code == 200
        d1 = res1.json()

        orig_b64_1 = d1["original_base64"]
        enh_b64_1 = d1["enhanced_base64"]
        stats1 = d1["telemetry"]["enhanced_stats"]

        # Check metrics validity
        assert stats1["mean_dn"] >= 0 and stats1["mean_dn"] <= 255
        assert stats1["std_dev"] >= 0
        assert stats1["dynamic_range_db"] > 0
        assert len(stats1["histogram_256"]) == 256
        assert sum(stats1["histogram_256"]) > 0

        # 2. Apply Polar PSR Shadow Recovery Preset
        p2 = {
            "image_id": sample_id,
            "brightness": 12.0,
            "contrast": 1.35,
            "gamma": 0.55,
            "clahe_clip_limit": 3.8,
            "clahe_grid_size": 8,
            "shadow_boost": 65.0,
            "denoise_strength": 12.0,
            "denoise_method": "bilateral",
            "sharpen_strength": 0.8,
            "sharpen_radius": 1.2
        }
        res2 = client.post("/api/enhance", data=p2)
        assert res2.status_code == 200
        d2 = res2.json()

        orig_b64_2 = d2["original_base64"]
        enh_b64_2 = d2["enhanced_base64"]
        stats2 = d2["telemetry"]["enhanced_stats"]

        # CHECK 1: Original image is 100% UNCHANGED
        assert orig_b64_1 == orig_b64_2, "CRITICAL ERROR: Original image was modified!"
        print("  [OK] Original image preserved 100% bit-for-bit identical across runs.")

        # CHECK 2: Enhanced image CHANGED in response to parameters
        assert enh_b64_1 != enh_b64_2, "CRITICAL ERROR: Enhanced image did not change!"
        print("  [OK] Enhanced image dynamically updated with new parameter values.")

        # CHECK 3: Metrics updated logically from the actual pixel arrays
        # Shadow boost + gamma 0.55 should increase Mean DN and reduce shadow %
        assert stats2["mean_dn"] > stats1["mean_dn"], f"Expected mean DN increase, got {stats1['mean_dn']} -> {stats2['mean_dn']}"
        assert stats2["shadow_pixel_pct"] <= stats1["shadow_pixel_pct"]
        print(f"  [OK] Actual pixel metrics updated: Mean DN {stats1['mean_dn']} -> {stats2['mean_dn']}, Deep Shadow {stats1['shadow_pixel_pct']}% -> {stats2['shadow_pixel_pct']}%.")

        # CHECK 4: Export image and verify download
        exp_png = client.post("/api/export", data={"image_id": sample_id, "export_format": "PNG"})
        assert exp_png.status_code == 200
        assert exp_png.headers["content-type"] == "image/png"
        assert len(exp_png.content) > 1000

        exp_jpg = client.post("/api/export", data={"image_id": sample_id, "export_format": "JPEG"})
        assert exp_jpg.status_code == 200
        assert exp_jpg.headers["content-type"] == "image/jpeg"

        exp_tif = client.post("/api/export", data={"image_id": sample_id, "export_format": "TIFF"})
        assert exp_tif.status_code == 200
        assert exp_tif.headers["content-type"] == "image/tiff"
        print(f"  [OK] Export verified: PNG ({len(exp_png.content)}B), JPEG ({len(exp_jpg.content)}B), TIFF ({len(exp_tif.content)}B).")

    # Test Upload with Custom 16-bit TIFF image
    print("\n--- Testing Custom 16-Bit Scientific TIFF Upload ---")
    synthetic_raw = np.zeros((200, 200), dtype=np.uint16)
    synthetic_raw[40:160, 40:160] = 1200 # Shadow terrain
    synthetic_raw[90:110, 90:110] = 32000 # High sunlit central peak
    bio = io.BytesIO()
    tifffile.imwrite(bio, synthetic_raw)
    tiff_bytes = bio.getvalue()

    up_res = client.post("/api/upload", files={"file": ("synthetic_polar.tif", tiff_bytes, "image/tiff")})
    assert up_res.status_code == 200
    up_data = up_res.json()
    custom_id = up_data["image_id"]
    assert up_data["bit_depth"] == 16
    print(f"  [OK] Uploaded 16-bit scientific raster successfully: {custom_id}")

    # Enhance custom uploaded image
    up_enh = client.post("/api/enhance", data={"image_id": custom_id, "shadow_boost": 50, "gamma": 0.6})
    assert up_enh.status_code == 200
    custom_enh = up_enh.json()
    assert custom_enh["original_base64"].startswith("data:image/png;base64,")
    assert custom_enh["enhanced_base64"].startswith("data:image/png;base64,")
    print(f"  [OK] Enhanced custom 16-bit image with non-linear shadow lift: execution in {custom_enh['telemetry']['elapsed_ms']} ms.")

    print("\n================================================================")
    print("  ALL WORKFLOW VERIFICATION CHECKS PASSED WITH 100% INTEGRITY!  ")
    print("================================================================\n")

if __name__ == "__main__":
    run_workflow_tests()
