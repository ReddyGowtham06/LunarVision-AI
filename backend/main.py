"""
LunarVision AI - Scientific Lunar Image Enhancement Platform
Backend API Service powered by FastAPI, OpenCV, and NumPy.
"""

import os
import sys
import io
import uuid
import base64
import time
import tempfile
from typing import Optional, Dict, Any, Tuple
import numpy as np
import cv2
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# Ensure both current directory (for Vercel Root Directory = 'backend')
# and parent directory (for monorepo root execution) are on sys.path
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

# Workspace directories (serverless-aware for Vercel read-only filesystem)
if os.environ.get("VERCEL") or not os.access(BASE_DIR, os.W_OK):
    TEMP_DIR = tempfile.gettempdir()
    UPLOADS_DIR = os.path.join(TEMP_DIR, "lunarvision_uploads")
    CACHE_DIR = os.path.join(TEMP_DIR, "lunarvision_cache")
else:
    UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
    CACHE_DIR = os.path.join(BASE_DIR, "cache")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

# File upload constraints
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}
MAX_DIMENSION = 12000

# In-memory LRU-style cache for active sessions: {image_id: {"img": np.ndarray, "meta": dict, "timestamp": float}}
IMAGE_REGISTRY: Dict[str, Dict[str, Any]] = {}
ENHANCED_CACHE: Dict[str, Dict[str, Any]] = {}

app = FastAPI(
    title="LunarVision AI API",
    description="Scientific image enhancement platform for permanently shadowed lunar regions and craters.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Ensure samples are cached on startup."""
    try:
        ensure_samples_cached()
    except Exception as e:
        print(f"Warning: sample pre-cache failed: {e}")


@app.get("/")
def root():
    """Root endpoint for Vercel deployment health diagnostics."""
    return {
        "service": "LunarVision AI Scientific Backend",
        "status": "operational",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }


@app.get("/api/health")
def health_check():
    """Returns system diagnostic information and capabilities."""
    samples = get_samples_catalog()
    return {
        "status": "operational",
        "service": "LunarVision AI Scientific Backend",
        "opencv_version": cv2.__version__,
        "numpy_version": np.__version__,
        "supported_formats": ["JPG", "JPEG", "PNG", "TIFF (8-bit / 16-bit)", "WEBP", "BMP"],
        "max_upload_size_mb": MAX_FILE_SIZE_BYTES // (1024 * 1024),
        "available_samples_count": len(samples),
        "active_sessions_cached": len(IMAGE_REGISTRY)
    }


@app.get("/api/samples")
def list_samples():
    """Returns catalog of verified, properly attributed lunar imagery."""
    catalog = get_samples_catalog()
    return {
        "count": len(catalog),
        "samples": catalog
    }


@app.get("/api/samples/{sample_id}/image")
def get_sample_image(sample_id: str):
    """Streams the raw verified sample image file."""
    try:
        path = get_sample_filepath(sample_id)
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Sample image file not found on disk.")
        with open(path, "rb") as f:
            data = f.read()
        return Response(content=data, media_type="image/jpeg")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_id}' not found.")


def register_image(image_id: str, img: np.ndarray, meta: Dict[str, Any]):
    """Registers an image in memory with automatic eviction if over 20 items."""
    if len(IMAGE_REGISTRY) > 20:
        oldest_key = min(IMAGE_REGISTRY, key=lambda k: IMAGE_REGISTRY[k]["timestamp"])
        del IMAGE_REGISTRY[oldest_key]
    IMAGE_REGISTRY[image_id] = {
        "img": img,
        "meta": meta,
        "timestamp": time.time()
    }


def get_image_by_id(image_id: str) -> Tuple[np.ndarray, Dict[str, Any]]:
    """Retrieves an image by ID (either from upload registry or sample catalog)."""
    # Check in-memory registry
    if image_id in IMAGE_REGISTRY:
        IMAGE_REGISTRY[image_id]["timestamp"] = time.time()
        return IMAGE_REGISTRY[image_id]["img"], IMAGE_REGISTRY[image_id]["meta"]

    # Check if it corresponds to a sample ID
    for sample in VERIFIED_SAMPLES:
        if sample["id"] == image_id:
            path = get_sample_filepath(sample["id"])
            with open(path, "rb") as f:
                raw_bytes = f.read()
            img, meta = LunarImageEnhancer.load_image_from_bytes(raw_bytes, sample["local_filename"])
            meta["is_verified_sample"] = True
            meta["sample_metadata"] = sample
            register_image(image_id, img, meta)
            return img, meta

    # Check disk uploads
    for ext in ALLOWED_EXTENSIONS:
        disk_path = os.path.join(UPLOADS_DIR, f"{image_id}{ext}")
        if os.path.exists(disk_path):
            with open(disk_path, "rb") as f:
                raw_bytes = f.read()
            img, meta = LunarImageEnhancer.load_image_from_bytes(raw_bytes, f"{image_id}{ext}")
            register_image(image_id, img, meta)
            return img, meta

    raise HTTPException(
        status_code=404,
        detail=f"Image ID '{image_id}' not found in active session or sample catalog."
    )


@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Safely uploads and registers a lunar image.
    Validates file extension, size, dimensions, and preserves original file permanently.
    """
    filename = file.filename or "unnamed_image.png"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
        )

    image_id = f"img_{uuid.uuid4().hex[:12]}"
    
    # Preserve original upload to disk without overwriting
    preserved_path = os.path.join(UPLOADS_DIR, f"{image_id}{ext}")
    with open(preserved_path, "wb") as pf:
        pf.write(file_bytes)

    # Decode and compute initial telemetry
    try:
        img, meta = LunarImageEnhancer.load_image_from_bytes(file_bytes, filename)
    except Exception as exc:
        if os.path.exists(preserved_path):
            os.remove(preserved_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to decode scientific image: {str(exc)}"
        )

    # Validate image dimensions
    h, w = img.shape[:2]
    if h > MAX_DIMENSION or w > MAX_DIMENSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image dimensions ({w}x{h}) exceed safety threshold of {MAX_DIMENSION}px."
        )

    meta["image_id"] = image_id
    meta["saved_path"] = preserved_path
    meta["channels"] = 1 if len(img.shape) == 2 else int(img.shape[2])
    meta["width"] = int(w)
    meta["height"] = int(h)

    # Compute baseline radiometric statistics
    initial_stats = LunarImageEnhancer.calculate_radiometric_stats(img)
    meta["initial_stats"] = initial_stats

    # Register in memory
    register_image(image_id, img, meta)

    # Generate standard PNG preview base64
    preview_bytes = LunarImageEnhancer.encode_image_to_bytes(img, "PNG")
    preview_b64 = "data:image/png;base64," + base64.b64encode(preview_bytes).decode("ascii")

    return {
        "success": True,
        "image_id": image_id,
        "filename": filename,
        "file_size_bytes": len(file_bytes),
        "dimensions": {"width": w, "height": h},
        "bit_depth": meta.get("bit_depth", 8),
        "channels": meta["channels"],
        "is_grayscale": meta.get("is_grayscale", False),
        "initial_stats": initial_stats,
        "preview_url": f"/api/image/{image_id}/original",
        "preview_base64": preview_b64
    }


@app.post("/api/enhance")
async def enhance_image_endpoint(
    image_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    brightness: float = Form(0.0),
    contrast: float = Form(1.0),
    gamma: float = Form(1.0),
    clahe_clip_limit: float = Form(2.5),
    clahe_grid_size: int = Form(8),
    shadow_boost: float = Form(0.0),
    denoise_strength: float = Form(0.0),
    denoise_method: str = Form("bilateral"),
    sharpen_strength: float = Form(0.0),
    sharpen_radius: float = Form(1.0),
    monochrome_output: bool = Form(False)
):
    """
    Applies scientific enhancement algorithms with fine-grained parameter control.
    Supports either an existing image_id or a direct file payload.
    """
    target_img: Optional[np.ndarray] = None
    target_meta: Optional[Dict[str, Any]] = None
    active_image_id = image_id

    # Handle direct file payload if supplied
    if file and file.filename:
        file_bytes = await file.read()
        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported format '{ext}'."
            )
        active_image_id = f"img_{uuid.uuid4().hex[:12]}"
        preserved_path = os.path.join(UPLOADS_DIR, f"{active_image_id}{ext}")
        with open(preserved_path, "wb") as pf:
            pf.write(file_bytes)
        target_img, target_meta = LunarImageEnhancer.load_image_from_bytes(file_bytes, filename)
        target_meta["image_id"] = active_image_id
        register_image(active_image_id, target_img, target_meta)
    elif active_image_id:
        target_img, target_meta = get_image_by_id(active_image_id)
    else:
        raise HTTPException(
            status_code=400,
            detail="Must supply either an 'image_id' or upload a 'file'."
        )

    # Perform scientific enhancement
    try:
        enhanced_img, telemetry = LunarImageEnhancer.enhance_image(
            img=target_img,
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
            monochrome_output=monochrome_output
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Enhancement algorithm failed: {str(exc)}"
        )

    # Cache enhanced image for download
    ENHANCED_CACHE[active_image_id] = {
        "img": enhanced_img,
        "telemetry": telemetry,
        "timestamp": time.time()
    }

    # Encode original and enhanced as Base64 for instantaneous UI synchronization
    orig_bytes = LunarImageEnhancer.encode_image_to_bytes(target_img, "PNG")
    enh_bytes = LunarImageEnhancer.encode_image_to_bytes(enhanced_img, "PNG")

    orig_b64 = "data:image/png;base64," + base64.b64encode(orig_bytes).decode("ascii")
    enh_b64 = "data:image/png;base64," + base64.b64encode(enh_bytes).decode("ascii")

    return {
        "success": True,
        "image_id": active_image_id,
        "enhanced_base64": enh_b64,
        "original_base64": orig_b64,
        "telemetry": telemetry
    }


@app.get("/api/image/{image_id}/original")
def get_original_image(image_id: str):
    """Streams the original uncompressed image file."""
    img, _ = get_image_by_id(image_id)
    img_bytes = LunarImageEnhancer.encode_image_to_bytes(img, "PNG")
    return Response(content=img_bytes, media_type="image/png")


@app.get("/api/image/{image_id}/enhanced")
def get_latest_enhanced_image(image_id: str):
    """Streams the most recently computed enhanced image."""
    if image_id not in ENHANCED_CACHE:
        # Generate default enhancement if not cached
        img, _ = get_image_by_id(image_id)
        enh, _ = LunarImageEnhancer.enhance_image(img)
        ENHANCED_CACHE[image_id] = {"img": enh, "timestamp": time.time()}
    
    cached = ENHANCED_CACHE[image_id]["img"]
    img_bytes = LunarImageEnhancer.encode_image_to_bytes(cached, "PNG")
    return Response(content=img_bytes, media_type="image/png")


@app.post("/api/export")
def export_enhanced_image(
    image_id: str = Form(...),
    export_format: str = Form("PNG"),   # "PNG" | "JPEG" | "TIFF"
    filename_prefix: str = Form("lunarvision_enhanced")
):
    """
    Exports and triggers browser download of the enhanced image in PNG, JPEG, or TIFF format.
    Includes scientific processing headers.
    """
    if image_id not in ENHANCED_CACHE:
        # Fallback to enhancing with default
        img, _ = get_image_by_id(image_id)
        enh, telemetry = LunarImageEnhancer.enhance_image(img)
        ENHANCED_CACHE[image_id] = {"img": enh, "telemetry": telemetry, "timestamp": time.time()}

    cached_entry = ENHANCED_CACHE[image_id]
    img = cached_entry["img"]
    telemetry = cached_entry.get("telemetry", {})

    fmt = export_format.upper()
    if fmt == "JPEG" or fmt == "JPG":
        ext = "jpg"
        media_type = "image/jpeg"
    elif fmt in ("TIFF", "TIF"):
        ext = "tif"
        media_type = "image/tiff"
    else:
        ext = "png"
        media_type = "image/png"

    img_bytes = LunarImageEnhancer.encode_image_to_bytes(img, fmt)
    output_filename = f"{filename_prefix}_{image_id}.{ext}"

    headers = {
        "Content-Disposition": f"attachment; filename=\"{output_filename}\"",
        "X-LunarVision-Methodology": "Classical Deterministic Radiometric & Spatial Filtering",
        "X-LunarVision-Elapsed-MS": str(telemetry.get("elapsed_ms", 0.0))
    }

    return Response(
        content=img_bytes,
        media_type=media_type,
        headers=headers
    )


@app.get("/api/image/{image_id}/telemetry")
def get_image_telemetry(image_id: str):
    """Returns telemetry and parameter history for an image."""
    img, meta = get_image_by_id(image_id)
    enhanced_entry = ENHANCED_CACHE.get(image_id)
    return {
        "image_id": image_id,
        "metadata": meta,
        "latest_telemetry": enhanced_entry.get("telemetry") if enhanced_entry else None
    }
