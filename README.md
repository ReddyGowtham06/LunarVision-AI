# LunarVision AI — Lunar Image Enhancement Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.14-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green)](https://fastapi.tiangolo.com)
[![OpenCV](https://img.shields.io/badge/OpenCV-5.0.0-red)](https://opencv.org)
[![React](https://img.shields.io/badge/React-18%2F19-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8)](https://tailwindcss.com)

**LunarVision AI** is a scientific-grade web application engineered for planetary researchers, astronomers, and educators to analyze and enhance dark, shadowed lunar terrain. It specifically targets lunar polar **Permanently Shadowed Regions (PSRs)**, deep impact crater interiors, and oblique low-angle terminator observations.

---

## 🔭 Scientific Integrity & Core Philosophy

- **Deterministic Classical Computer Vision (Zero Generative Hallucination)**:  
  While branded as *LunarVision AI*, the engine strictly uses mathematically rigorous, classical computer vision operations via **OpenCV** and **NumPy**. It does **NOT** use generative diffusion models, GANs, or predictive autoencoders. No craters, boulders, or geological features are fabricated. Every visible pixel originates from true photons recorded by spacecraft optical sensors.
- **Physics of Lunar PSRs**:  
  Due to the Moon's slight 1.54° axial tilt, polar crater floors receive zero direct sunlight. However, they are illuminated by **secondary scattered photons** reflecting off illuminated crater rims and Earthshine. These authentic photons occupy low digital numbers ($0 \le DN \le 35$). LunarVision AI remaps these true photons into perceptible contrast ranges.
- **Preservation & Traceability**:  
  Original raw upload files are permanently archived with immutable identifiers and never overwritten. Applied parameters are exportable as JSON telemetry alongside original image files to guarantee reproducible scientific research.
- **Artifact Awareness**:  
  Real-time clipping alerts warn users when aggressive enhancement approaches Poisson shot noise amplification or rim saturation ($DN = 255$).

---

## 🛰️ Key Features

1. **Interactive Comparison Slider**:
   - Split comparison slider with smooth draggable divider handle.
   - Dual-panel **Side-by-Side** mode for direct comparative inspection.
   - Single-click toggle between **Enhanced Only** and **Raw Original**.
2. **Infinite Zoom & Pan Inspection**:
   - Mouse wheel zoom (10% to 800%) centered on cursor position.
   - Click-and-drag pan navigation.
   - Instant Fit to Screen (Key `0`), 1:1 Pixel Native View, and Zoom In/Out toolbar.
   - Real-time **(X, Y) pixel coordinate and dimension HUD**.
3. **Scientific Radiometric Controls**:
   - **Gamma Correction ($\gamma$)**: Power-law tone expansion ($0.2 \le \gamma \le 2.5$) with $O(1)$ lookup tables.
   - **Contrast & Brightness**: Midtone-centered contrast scaling and digital number offset.
   - **Polar PSR / Shadow Boost**: Non-linear curve lift specifically targeting low-DN shadows without blowing out illuminated crater rims.
   - **CLAHE (Contrast Limited Adaptive Histogram Equalization)**: Adjustable clip limit ($0.1$ to $8.0$) and local tile grid matrix ($2\times2$ to $24\times24$).
   - **Edge-Preserving Denoising**: Bilateral filter, Fast Non-Local Means, or Gaussian smoothing to suppress sensor read noise.
   - **Acutance / Sharpening**: Unsharp masking with controllable kernel radius and amount.
   - **Scientific Monochrome Toggle**: Single-band reflectance representation standard in planetary science.
4. **Real-time Dual 256-Bin Histogram**:
   - Dual curves comparing Original (Slate) vs. Enhanced (Observatory Cyan) intensity distribution.
   - Radiometric metrics: Dynamic Range in decibels ($dB$), Mean DN, Standard Deviation, Deep Shadow % ($<15$ DN), and Rim Saturation % ($>240$ DN).
5. **Verified Lunar Observations Catalog**:
   - Integrated PDS-calibrated sample imagery from NASA Lunar Reconnaissance Orbiter (LRO) and Apollo 16:
     - **Hermite & Whipple Craters PSR** (LRO NAC, PIA12899, 89.1°N)
     - **Tycho Crater Rim Terraces** (LRO NAC, PIA13694, 43.31°S)
     - **Rutherfurd Crater Central Peak** (LRO NAC, PIA12928, 61.1°S)
     - **Copernicus Crater Floor Slumps** (LRO NAC, PIA13524, 9.62°N)
     - **Guyot Crater Rim & Far-Side Highlands** (Apollo 16 Hasselblad, as16-121-19407)
6. **Scientific Export & Telemetry**:
   - Export enhanced imagery in **PNG** (lossless 8-bit), **TIFF** (scientific archive), or **JPEG**.
   - One-click export of reproducible **JSON Telemetry Sidecars** containing exact parameter logs and photometric statistics.
7. **Drag-and-Drop Image Upload**:
   - Full viewport drag-and-drop support for custom **JPG, PNG, and 8-bit / 16-bit TIFF** images.

---

## 🏗️ Architecture & Technology Stack

```
LunarVisionAI/
├── backend/
│   ├── main.py            # FastAPI REST API, routing, upload validation, session registry
│   ├── enhancer.py        # OpenCV + NumPy scientific image enhancement algorithms
│   ├── sample_data.py     # NASA/PDS verified lunar dataset catalog and asset caching
│   ├── test_suite.py      # Automated backend testing suite
│   ├── samples/           # Cached verified NASA lunar images
│   ├── uploads/           # Preserved original user uploads (immutable)
│   ├── requirements.txt   # Python backend dependencies
│   └── venv/              # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx                   # Observatory header, actions, and status
│   │   │   ├── ComparisonSlider.tsx         # Split slider, side-by-side, zoom & pan
│   │   │   ├── ControlPanel.tsx             # Scientific parameter sliders and presets
│   │   │   ├── HistogramViewer.tsx          # Dual 256-bin histogram and metrics
│   │   │   ├── SampleGalleryModal.tsx       # Verified NASA observation browser
│   │   │   ├── ScientificIntegrityModal.tsx # Educational classical CV standard
│   │   │   ├── MetadataDrawer.tsx           # Telemetry parameters and raster specs
│   │   │   └── DownloadModal.tsx            # Multi-format export and JSON sidecars
│   │   ├── services/
│   │   │   └── api.ts                       # REST API client with error handling
│   │   ├── types/
│   │   │   └── index.ts                     # TypeScript interfaces
│   │   ├── App.tsx                          # Central application orchestrator
│   │   └── index.css                        # Observatory dark design system
│   ├── package.json
│   ├── vite.config.ts                       # Vite configuration with API proxy
│   └── tailwind.config.js                   # Observatory theme palette
├── run_dev.bat                              # One-click Windows startup script
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- **Python 3.10+** (tested on Python 3.11, 3.12, 3.14)
- **Node.js 18+** and **npm**

### Option A: One-Click Startup (Windows)
Double-click `run_dev.bat` or run:
```powershell
.\run_dev.bat
```

### Option B: Manual Startup

#### 1. Start the Python FastAPI Backend
```powershell
# Create and activate virtual environment
python -m venv backend/venv
.\backend\venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Start backend server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API documentation is available at `http://127.0.0.1:8000/docs`.

#### 2. Start the Vite React Frontend
In a new terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open your browser to:
👉 **`http://localhost:5173/`**

---

## 🧪 Running Automated Tests

Run the complete backend test suite:
```powershell
.\backend\venv\Scripts\python.exe -m backend.test_suite
```
All tests verify:
- Health diagnostics and supported formats
- Sample catalog availability and image streaming
- Custom PNG and 16-bit scientific TIFF uploads
- OpenCV enhancement pipelines and sub-10ms response latency
- Multi-format exports (PNG, JPEG, TIFF)
- Safe error handling for invalid files and payloads

---

## 📄 License
MIT License. Verified lunar images courtesy of NASA, GSFC, Arizona State University (LROC), and the Apollo 16 Flight Crew.
