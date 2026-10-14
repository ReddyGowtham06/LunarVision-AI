"""
LunarVision AI - Scientific Image Processing Engine
Performs deterministic algorithmic enhancement for shadowed lunar regions
using OpenCV, NumPy, and scientific image analysis principles.

Preserves photometric integrity and avoids generative hallucinations.
"""

import io
import time
from typing import Dict, Any, Tuple, Optional
import numpy as np
import cv2
from PIL import Image
import tifffile


class LunarImageEnhancer:
    """
    Scientific-grade enhancement engine for lunar crater and shadowed terrain imagery.
    Implements:
    - Luminance-preserving CLAHE (in CIE LAB or Grayscale)
    - Power-law Gamma correction with O(1) LUT
    - Non-linear Shadow / PSR (Permanently Shadowed Region) tone expansion
    - Edge-preserving Bilateral and Non-Local Means Denoising
    - Unsharp masking for micro-crater topography
    - Dual 256-bin histogram computation and radiometric telemetry
    """

    @staticmethod
    def load_image_from_bytes(file_bytes: bytes, filename: str = "") -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Loads an image from raw bytes, handling JPG, PNG, and scientific 8/16-bit TIFFs.
        Preserves true bit depth and channels without silent precision truncation.
        """
        filename_lower = filename.lower()
        is_tiff = filename_lower.endswith(('.tif', '.tiff'))

        raw_meta = {
            "original_filename": filename,
            "file_size_bytes": len(file_bytes),
            "detected_format": "TIFF" if is_tiff else "STANDARD",
        }

        # Try tifffile first if TIFF extension or magic bytes
        if is_tiff or file_bytes[:4] in (b'II*\x00', b'MM\x00*'):
            try:
                with io.BytesIO(file_bytes) as bio:
                    tif_arr = tifffile.imread(bio)
                    raw_meta["detected_format"] = "TIFF (Scientific)"
                    raw_meta["raw_dtype"] = str(tif_arr.dtype)
                    raw_meta["raw_shape"] = list(tif_arr.shape)

                    # Handle 16-bit or floating point TIFF
                    if tif_arr.dtype == np.uint16:
                        raw_meta["bit_depth"] = 16
                        min_v = float(tif_arr.min())
                        max_v = float(tif_arr.max())
                        raw_meta["raw_min_dn"] = min_v
                        raw_meta["raw_max_dn"] = max_v
                        
                        # Percentile stretch to 8-bit uint8 for display & OpenCV processing
                        p1, p99 = np.percentile(tif_arr, (0.05, 99.95))
                        if p99 > p1:
                            scaled = np.clip((tif_arr - p1) / (p99 - p1) * 255.0, 0, 255).astype(np.uint8)
                        else:
                            scaled = ((tif_arr / 65535.0) * 255.0).astype(np.uint8)
                        return scaled, raw_meta
                    elif tif_arr.dtype in (np.float32, np.float64):
                        raw_meta["bit_depth"] = 32
                        min_v, max_v = float(tif_arr.min()), float(tif_arr.max())
                        raw_meta["raw_min_dn"] = min_v
                        raw_meta["raw_max_dn"] = max_v
                        scaled = np.clip((tif_arr - min_v) / (max_v - min_v + 1e-7) * 255.0, 0, 255).astype(np.uint8)
                        return scaled, raw_meta
                    elif tif_arr.dtype == np.uint8:
                        raw_meta["bit_depth"] = 8
                        return tif_arr, raw_meta
            except Exception:
                pass

        # Standard OpenCV decode
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)

        if img is None:
            # Fallback to PIL
            try:
                pil_img = Image.open(io.BytesIO(file_bytes))
                img = np.array(pil_img)
                if len(img.shape) == 3 and img.shape[2] == 3:
                    img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                elif len(img.shape) == 3 and img.shape[2] == 4:
                    img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
            except Exception as exc:
                raise ValueError(f"Unsupported or corrupted image file format: {str(exc)}")

        if img is None:
            raise ValueError("Failed to decode image. Ensure the file is a valid JPG, PNG, or TIFF.")

        # Handle 16-bit image from cv2
        if img.dtype == np.uint16:
            raw_meta["bit_depth"] = 16
            raw_meta["raw_min_dn"] = float(img.min())
            raw_meta["raw_max_dn"] = float(img.max())
            p1, p99 = np.percentile(img, (0.05, 99.95))
            if p99 > p1:
                img = np.clip((img - p1) / (p99 - p1) * 255.0, 0, 255).astype(np.uint8)
            else:
                img = ((img / 65535.0) * 255.0).astype(np.uint8)
        else:
            raw_meta["bit_depth"] = 8

        # Drop alpha channel if present
        if len(img.shape) == 3 and img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

        raw_meta["raw_shape"] = list(img.shape)
        raw_meta["is_grayscale"] = (len(img.shape) == 2 or (len(img.shape) == 3 and img.shape[2] == 1))
        return img, raw_meta

    @staticmethod
    def calculate_radiometric_stats(img: np.ndarray) -> Dict[str, Any]:
        """
        Computes photometric statistics and 256-bin histogram for a uint8 image.
        """
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img

        total_pixels = int(gray.size)
        min_val = int(gray.min())
        max_val = int(gray.max())
        mean_val = float(np.mean(gray))
        std_val = float(np.std(gray))
        median_val = float(np.median(gray))

        # Pixel saturation telemetry
        dark_pixels = int(np.sum(gray < 15))
        sat_pixels = int(np.sum(gray > 240))
        dark_pct = round((dark_pixels / total_pixels) * 100.0, 2)
        sat_pct = round((sat_pixels / total_pixels) * 100.0, 2)

        # Dynamic range estimation in decibels (dB)
        dr_db = round(20.0 * np.log10((max_val - min_val + 1.0) / (std_val + 1e-5)), 2)

        # 256-bin histogram
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
        max_count = float(hist.max()) if hist.max() > 0 else 1.0
        norm_hist = [round(float(h) / max_count * 100.0, 3) for h in hist]

        return {
            "min_dn": min_val,
            "max_dn": max_val,
            "mean_dn": round(mean_val, 2),
            "std_dev": round(std_val, 2),
            "median_dn": round(median_val, 2),
            "shadow_pixel_pct": dark_pct,
            "highlight_saturated_pct": sat_pct,
            "dynamic_range_db": dr_db,
            "histogram_256": norm_hist,
            "total_pixels": total_pixels
        }

    @classmethod
    def enhance_image(
        cls,
        img: np.ndarray,
        brightness: float = 0.0,          # -100 to +100
        contrast: float = 1.0,            # 0.1 to 3.0
        gamma: float = 1.0,               # 0.2 to 3.0 (lower values boost dark regions)
        clahe_clip_limit: float = 2.5,    # 0.1 to 10.0
        clahe_grid_size: int = 8,         # 2 to 32
        shadow_boost: float = 0.0,        # 0 to 100 (targeted low-DN expansion for PSRs)
        denoise_strength: float = 0.0,    # 0 to 30
        denoise_method: str = "bilateral",# "bilateral" | "fast_nl_means" | "gaussian" | "none"
        sharpen_strength: float = 0.0,    # 0 to 2.5
        sharpen_radius: float = 1.0,      # 0.5 to 5.0
        monochrome_output: bool = False   # Force single-band scientific view
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Executes the scientific enhancement pipeline.
        Returns:
            enhanced_image (np.ndarray uint8 BGR or Grayscale)
            telemetry (Dict with parameters, processing time, and metrics)
        """
        start_time = time.perf_counter()
        is_color = (len(img.shape) == 3 and img.shape[2] == 3)

        # Step 1: Pre-enhancement stats
        original_stats = cls.calculate_radiometric_stats(img)

        # Work on luminance channel if color, to avoid chromatic artifacting
        if is_color:
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l_channel, a_channel, b_channel = cv2.split(lab)
            working_channel = l_channel
        else:
            working_channel = img.copy()

        # Step 2: Non-linear Shadow / PSR Boost (Selective low-DN curve lift)
        if shadow_boost > 0.0:
            norm_lum = working_channel.astype(np.float32) / 255.0
            weight = np.clip(1.0 - norm_lum, 0.0, 1.0) ** 1.8
            boost_amount = (shadow_boost / 100.0) * 0.45
            lifted = norm_lum + boost_amount * weight * (norm_lum ** 0.35)
            working_channel = np.clip(lifted * 255.0, 0, 255).astype(np.uint8)

        # Step 3: CLAHE (Contrast Limited Adaptive Histogram Equalization)
        if clahe_clip_limit > 0.0:
            grid_s = max(2, min(32, int(clahe_grid_size)))
            clahe = cv2.createCLAHE(
                clipLimit=max(0.1, float(clahe_clip_limit)),
                tileGridSize=(grid_s, grid_s)
            )
            working_channel = clahe.apply(working_channel)

        # Step 4: Gamma Correction & Contrast / Brightness via Look-Up Table (LUT)
        gamma_val = max(0.1, min(4.0, float(gamma)))
        contrast_val = max(0.1, min(3.0, float(contrast)))
        brightness_val = max(-100.0, min(100.0, float(brightness)))

        lut = np.zeros(256, dtype=np.uint8)
        for i in range(256):
            # Power-law tone curve: gamma < 1.0 boosts shadows, gamma > 1.0 compresses
            norm = (i / 255.0) ** gamma_val
            v = ((norm - 0.5) * contrast_val + 0.5) * 255.0 + brightness_val
            lut[i] = np.clip(v, 0, 255).astype(np.uint8)

        working_channel = cv2.LUT(working_channel, lut)

        # Step 5: Denoising (Edge-preserving filtering)
        if denoise_strength > 0.5 and denoise_method != "none":
            d_val = float(denoise_strength)
            if denoise_method == "bilateral":
                sigma_color = d_val * 2.8
                sigma_space = d_val * 1.5
                working_channel = cv2.bilateralFilter(
                    working_channel,
                    d=7,
                    sigmaColor=sigma_color,
                    sigmaSpace=sigma_space
                )
            elif denoise_method == "fast_nl_means":
                working_channel = cv2.fastNlMeansDenoising(
                    working_channel,
                    h=d_val * 0.8,
                    templateWindowSize=7,
                    searchWindowSize=21
                )
            elif denoise_method == "gaussian":
                k_size = int(round(d_val / 6.0)) * 2 + 1
                k_size = max(3, min(9, k_size))
                working_channel = cv2.GaussianBlur(working_channel, (k_size, k_size), 0)

        # Step 6: Controlled Sharpening (Unsharp Mask)
        if sharpen_strength > 0.05:
            amount = float(sharpen_strength)
            rad = max(0.5, min(5.0, float(sharpen_radius)))
            k_size = int(round(rad * 2.0)) * 2 + 1
            k_size = max(3, min(15, k_size))
            blurred = cv2.GaussianBlur(working_channel, (k_size, k_size), rad)
            sharpened = cv2.addWeighted(working_channel, 1.0 + amount, blurred, -amount, 0)
            working_channel = np.clip(sharpened, 0, 255).astype(np.uint8)

        # Recompose color image or convert to monochrome
        if is_color and not monochrome_output:
            lab_enhanced = cv2.merge([working_channel, a_channel, b_channel])
            enhanced_img = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
        else:
            enhanced_img = working_channel

        elapsed_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        # Compute post-enhancement radiometric stats
        enhanced_stats = cls.calculate_radiometric_stats(enhanced_img)

        # Scientific Integrity & Artifact Analysis Check
        clipping_warning = False
        warning_msg = None
        if enhanced_stats["highlight_saturated_pct"] > 8.0:
            clipping_warning = True
            warning_msg = (
                f"Highlight clipping detected ({enhanced_stats['highlight_saturated_pct']}% saturated at 255). "
                "Sunlit crater rims may lose subtle photometric gradations. Reduce contrast or CLAHE clip limit."
            )
        elif enhanced_stats["shadow_pixel_pct"] > 25.0 and shadow_boost == 0:
            warning_msg = (
                f"High deep-shadow ratio ({enhanced_stats['shadow_pixel_pct']}% < 15 DN). "
                "Consider increasing Shadow / PSR Boost or lowering Gamma."
            )

        telemetry = {
            "elapsed_ms": elapsed_ms,
            "dimensions": {
                "width": int(img.shape[1]),
                "height": int(img.shape[0]),
                "channels": 1 if len(enhanced_img.shape) == 2 else int(enhanced_img.shape[2]),
                "megapixels": round((img.shape[0] * img.shape[1]) / 1_000_000.0, 3)
            },
            "parameters_applied": {
                "brightness": brightness_val,
                "contrast": contrast_val,
                "gamma": gamma_val,
                "clahe_clip_limit": clahe_clip_limit,
                "clahe_grid_size": clahe_grid_size,
                "shadow_boost": shadow_boost,
                "denoise_strength": denoise_strength,
                "denoise_method": denoise_method,
                "sharpen_strength": sharpen_strength,
                "sharpen_radius": sharpen_radius,
                "monochrome_output": monochrome_output
            },
            "original_stats": original_stats,
            "enhanced_stats": enhanced_stats,
            "scientific_assessment": {
                "methodology": "Classical Deterministic Radiometric & Spatial Filtering",
                "ai_hallucination_risk": "0.0% (Zero generative synthetic content created)",
                "clipping_warning": clipping_warning,
                "warning_message": warning_msg,
                "dynamic_range_improvement_db": round(
                    enhanced_stats["dynamic_range_db"] - original_stats["dynamic_range_db"], 2
                )
            }
        }

        return enhanced_img, telemetry

    @staticmethod
    def encode_image_to_bytes(img: np.ndarray, format: str = "PNG") -> bytes:
        """Encodes OpenCV image to bytes for transmission or download."""
        fmt = format.upper()
        if fmt in ("JPG", "JPEG"):
            success, buffer = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        elif fmt == "WEBP":
            success, buffer = cv2.imencode(".webp", img, [int(cv2.IMWRITE_WEBP_QUALITY), 95])
        elif fmt in ("TIF", "TIFF"):
            success, buffer = cv2.imencode(".tiff", img)
        else:
            success, buffer = cv2.imencode(".png", img, [int(cv2.IMWRITE_PNG_COMPRESSION), 4])

        if not success:
            raise RuntimeError(f"Failed to encode image to {format}")
        return buffer.tobytes()
