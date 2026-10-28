"""
LunarVision AI - Scientific Lunar Image Enhancement Platform (v2.0 Studio Edition)
FastAPI Backend Service.
"""

import os
import sys
import io
import uuid
import base64
import time
import tempfile
from typing import Dict, Any, Tuple
import numpy as np
import cv2
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

try:
    from backend.enhancer import LunarImageEnhancer
    from backend.sample_data import (
        get_samples_catalog,
        get_sample_filepath,
        ensure_samples_cached,
        VERIFIED_SAMPLES
    )
except (ImportError, ModuleNotFoundError):
    from enhancer import LunarImageEnhancer
    from sample_data import (
        get_samples_catalog,
        get_sample_filepath,
        ensure_samples_cached,
        VERIFIED_SAMPLES
    )

if os.environ.get("VERCEL") or not os.access(BASE_DIR, os.W_OK):
    TEMP_DIR = tempfile.gettempdir()
    UPLOADS_DIR = os.path.join(TEMP_DIR, "lunarvision_uploads")
    SAMPLES_CACHE_DIR = os.path.join(TEMP_DIR, "lunarvision_samples")
else:
    UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
    SAMPLES_CACHE_DIR = os.path.join(BASE_DIR, "samples")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(SAMPLES_CACHE_DIR, exist_ok=True)

RAW_IMAGE_CACHE: Dict[str, Dict[str, Any]] = {}
ENHANCED_CACHE: Dict[str, Dict[str, Any]] = {}

app = FastAPI(
    title="LunarVision AI Studio API",
    description="32-Bit Float Radiometric & 3-Zone Masked CLAHE Enhancement for Lunar Imagery",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    ensure_samples_cached(SAMPLES_CACHE_DIR)


@app.get("/")
def root_status():
    return {
        "service": "LunarVision AI Studio 2.0",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "LunarVision AI Processing Engine v2.0",
        "version": "2.0.0",
        "opencv_version": cv2.__version__,
        "cached_sessions": len(RAW_IMAGE_CACHE)
    }


@app.get("/api/samples")
def list_sample_imagery():
    return get_samples_catalog()


@app.post("/api/upload")
async def upload_lunar_image(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        raw_img, raw_meta = LunarImageEnhancer.load_image_from_bytes(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Image decoding failed: {str(e)}")

    image_id = str(uuid.uuid4())
    stats = LunarImageEnhancer.calculate_radiometric_stats(raw_img)

    RAW_IMAGE_CACHE[image_id] = {
        "image_bytes": content,
        "image_array": raw_img,
        "filename": file.filename,
        "metadata": raw_meta,
        "stats": stats,
        "created_at": time.time()
    }

    raw_b64_bytes = LunarImageEnhancer.encode_image_to_bytes(raw_img, "PNG")
    raw_data_url = f"data:image/png;base64,{base64.b64encode(raw_b64_bytes).decode('utf-8')}"

    return {
        "image_id": image_id,
        "filename": file.filename,
        "raw_preview_url": raw_data_url,
        "dimensions": {
            "width": int(raw_img.shape[1]),
            "height": int(raw_img.shape[0]),
            "channels": 1 if len(raw_img.shape) == 2 else int(raw_img.shape[2]),
            "megapixels": round((raw_img.shape[0] * raw_img.shape[1]) / 1_000_000.0, 3)
        },
        "file_metadata": raw_meta,
        "original_stats": stats
    }


@app.post("/api/load-sample/{sample_id}")
def load_sample_by_id(sample_id: str):
    sample_path = get_sample_filepath(sample_id, SAMPLES_CACHE_DIR)
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail=f"Sample target '{sample_id}' not found.")

    with open(sample_path, "rb") as f:
        content = f.read()

    filename = os.path.basename(sample_path)
    raw_img, raw_meta = LunarImageEnhancer.load_image_from_bytes(content, filename)
    stats = LunarImageEnhancer.calculate_radiometric_stats(raw_img)

    RAW_IMAGE_CACHE[sample_id] = {
        "image_bytes": content,
        "image_array": raw_img,
        "filename": filename,
        "metadata": raw_meta,
        "stats": stats,
        "created_at": time.time()
    }

    raw_b64_bytes = LunarImageEnhancer.encode_image_to_bytes(raw_img, "PNG")
    raw_data_url = f"data:image/png;base64,{base64.b64encode(raw_b64_bytes).decode('utf-8')}"
    sample_info = VERIFIED_SAMPLES.get(sample_id, {})

    return {
        "image_id": sample_id,
        "filename": filename,
        "title": sample_info.get("title", sample_id),
        "target_region": sample_info.get("target_region", "Lunar Surface"),
        "description": sample_info.get("description", ""),
        "raw_preview_url": raw_data_url,
        "dimensions": {
            "width": int(raw_img.shape[1]),
            "height": int(raw_img.shape[0]),
            "channels": 1 if len(raw_img.shape) == 2 else int(raw_img.shape[2]),
            "megapixels": round((raw_img.shape[0] * raw_img.shape[1]) / 1_000_000.0, 3)
        },
        "file_metadata": raw_meta,
        "original_stats": stats
    }


def get_image_by_id(image_id: str) -> Tuple[np.ndarray, Dict[str, Any]]:
    if image_id in RAW_IMAGE_CACHE:
        entry = RAW_IMAGE_CACHE[image_id]
        return entry["image_array"], entry["metadata"]

    if image_id in VERIFIED_SAMPLES:
        sample_path = get_sample_filepath(image_id, SAMPLES_CACHE_DIR)
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as f:
                content = f.read()
            raw_img, raw_meta = LunarImageEnhancer.load_image_from_bytes(content, os.path.basename(sample_path))
            stats = LunarImageEnhancer.calculate_radiometric_stats(raw_img)
            RAW_IMAGE_CACHE[image_id] = {
                "image_bytes": content,
                "image_array": raw_img,
                "filename": os.path.basename(sample_path),
                "metadata": raw_meta,
                "stats": stats,
                "created_at": time.time()
            }
            return raw_img, raw_meta

    raise HTTPException(status_code=404, detail=f"Image session '{image_id}' expired or not found.")


@app.post("/api/enhance")
@app.post("/enhance")
def process_enhancement(
    image_id: str = Form(...),
    brightness: float = Form(0.0),
    contrast: float = Form(1.14),
    gamma: float = Form(0.96),
    clahe_clip_limit: float = Form(3.0),
    clahe_grid_size: int = Form(8),
    shadow_boost: float = Form(6.0),
    denoise_strength: float = Form(0.0),
    denoise_method: str = Form("none"),
    sharpen_strength: float = Form(1.50),
    sharpen_radius: float = Form(0.9),
    crater_clarity: float = Form(1.25),
    monochrome_output: bool = Form(False),
    space_bg_cleanup: bool = Form(True)
):
    raw_img, _ = get_image_by_id(image_id)

    enhanced_img, telemetry = LunarImageEnhancer.enhance_image(
        img=raw_img,
        brightness=brightness,
        contrast=contrast,
        gamma=gamma,
        clahe_clip_limit=clahe_clip_limit,
        clahe_grid_size=clahe_grid_size,
        shadow_boost=shadow_boost,
        denoise_strength=denoise_strength,
        denoise_method=denoise_method,
        sharpen_strength=sharpen_strength,
        sharpen_radius=sharpen_radius,
        crater_clarity=crater_clarity,
        monochrome_output=monochrome_output,
        space_bg_cleanup=space_bg_cleanup
    )

    enhanced_bytes = LunarImageEnhancer.encode_image_to_bytes(enhanced_img, "PNG")
    enhanced_b64 = f"data:image/png;base64,{base64.b64encode(enhanced_bytes).decode('utf-8')}"

    ENHANCED_CACHE[image_id] = {
        "image_array": enhanced_img,
        "telemetry": telemetry,
        "timestamp": time.time()
    }

    return {
        "image_id": image_id,
        "enhanced_preview_url": enhanced_b64,
        "telemetry": telemetry
    }


@app.get("/api/download/{image_id}")
def download_enhanced_image(
    image_id: str,
    format: str = Query("PNG", regex="^(PNG|JPG|JPEG|WEBP|TIFF)$")
):
    if image_id not in ENHANCED_CACHE:
        raw_img, _ = get_image_by_id(image_id)
        enhanced_img, _ = LunarImageEnhancer.enhance_image(raw_img)
    else:
        enhanced_img = ENHANCED_CACHE[image_id]["image_array"]

    fmt = format.upper()
    img_bytes = LunarImageEnhancer.encode_image_to_bytes(enhanced_img, fmt)

    media_types = {
        "PNG": "image/png",
        "JPG": "image/jpeg",
        "JPEG": "image/jpeg",
        "WEBP": "image/webp",
        "TIFF": "image/tiff"
    }

    ext = "tif" if fmt == "TIFF" else fmt.lower()
    filename = f"lunarvision_enhanced_{image_id[:8]}.{ext}"

    return Response(
        content=img_bytes,
        media_type=media_types.get(fmt, "image/png"),
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/image/{image_id}/telemetry")
def get_image_telemetry(image_id: str):
    _, meta = get_image_by_id(image_id)
    enhanced_entry = ENHANCED_CACHE.get(image_id)
    return {
        "image_id": image_id,
        "metadata": meta,
        "latest_telemetry": enhanced_entry.get("telemetry") if enhanced_entry else None
    }
