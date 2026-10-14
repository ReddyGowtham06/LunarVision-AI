import React from 'react';
import { X, Download, ShieldCheck, Activity, AlertTriangle, Layers } from 'lucide-react';
import type { ProcessingTelemetry, UploadResponse } from '../types';

interface MetadataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: ProcessingTelemetry | null;
  uploadInfo: UploadResponse | null;
  onDownloadTelemetry: () => void;
}

export const MetadataDrawer: React.FC<MetadataDrawerProps> = ({
  isOpen,
  onClose,
  telemetry,
  uploadInfo,
  onDownloadTelemetry
}) => {
  if (!isOpen) return null;

  const applied = telemetry?.parameters_applied;
  const originalStats = telemetry?.original_stats || uploadInfo?.initial_stats;
  const enhancedStats = telemetry?.enhanced_stats;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
      <div
        className="w-full max-w-md bg-obsidian-900 border-l border-obsidian-750 h-full flex flex-col shadow-2xl text-lunar-200 text-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="telemetry-drawer-title"
      >
        {/* Drawer Header */}
        <div className="p-4 bg-obsidian-850 border-b border-obsidian-750 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-observatory-cyan" />
            <h2 id="telemetry-drawer-title" className="font-semibold text-lunar-100 uppercase tracking-wider text-xs">
              Scientific Telemetry &amp; Provenance
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close telemetry drawer"
            className="p-1 text-lunar-400 hover:text-white rounded hover:bg-obsidian-750 transition focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Scientific Integrity Stamp */}
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg flex items-start gap-2.5 text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-xs text-emerald-300">Deterministic CV Provenance</div>
              <div className="text-[10px] text-emerald-200/80 mt-0.5 leading-relaxed">
                Classical radiometric &amp; spatial filtering algorithms (OpenCV / NumPy). 100% verified optical detector measurements; zero generative synthetic content.
              </div>
            </div>
          </div>

          {/* Scientific Transparency Caveat */}
          <div className="p-3 bg-amber-950/30 border border-amber-600/30 rounded-lg flex items-start gap-2.5 text-amber-200 text-[10px] leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-300">Planetary Research Caveat</div>
              <div className="mt-0.5 text-amber-100/80">
                Enhanced visibility does <strong>not</strong> constitute proof of authentic subsurface or shadow terrain recovery. Low-signal regions ($DN &lt; 15$) can amplify sensor read noise, fixed pattern noise (FPN), and scatter. Confirm features with multi-temporal datasets.
              </div>
            </div>
          </div>

          {/* Processing Methodology Pipeline Steps */}
          <div className="space-y-2">
            <span className="font-semibold text-[10px] uppercase tracking-wider text-lunar-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-observatory-cyan" />
              Processing Pipeline Architecture
            </span>
            <div className="bg-obsidian-850 border border-obsidian-750 rounded-lg p-2.5 font-mono text-[10px] space-y-1.5 text-lunar-300">
              <div className="flex items-center gap-2">
                <span className="text-observatory-cyan font-bold">Step 1:</span>
                <span>Radiance Calibration &amp; CIE-LAB Luminance Isolation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-observatory-cyan font-bold">Step 2:</span>
                <span>Non-linear Polar PSR Curve Lift for Low Digital Numbers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-observatory-cyan font-bold">Step 3:</span>
                <span>Local Contrast Limited Adaptive Histogram Equalization</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-observatory-cyan font-bold">Step 4:</span>
                <span>Power-Law Gamma Remapping &amp; Contrast LUT ($O(1)$)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-observatory-cyan font-bold">Step 5:</span>
                <span>Edge-Preserving Bilateral / NL-Means Spatial Smoothing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-observatory-cyan font-bold">Step 6:</span>
                <span>High-Frequency Unsharp Mask Acutance Sharpening</span>
              </div>
            </div>
          </div>

          {/* Section 1: Image Technical Specifications */}
          <div className="space-y-2">
            <span className="font-semibold text-[10px] uppercase tracking-wider text-lunar-400">
              Sensor &amp; Raster Specifications
            </span>
            <div className="bg-obsidian-850 border border-obsidian-750 rounded-lg p-2.5 font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between py-0.5 border-b border-obsidian-800">
                <span className="text-lunar-400">Active Image ID</span>
                <span className="text-lunar-200">{uploadInfo?.image_id || 'Sample Observation'}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-obsidian-800">
                <span className="text-lunar-400">Dimensions</span>
                <span className="text-lunar-200">
                  {telemetry?.dimensions.width || uploadInfo?.dimensions.width} × {telemetry?.dimensions.height || uploadInfo?.dimensions.height} px
                </span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-obsidian-800">
                <span className="text-lunar-400">Bit Depth</span>
                <span className="text-observatory-cyan">{uploadInfo?.bit_depth || 8}-bit per channel</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-obsidian-800">
                <span className="text-lunar-400">Channels</span>
                <span className="text-lunar-200">
                  {(telemetry?.dimensions.channels || uploadInfo?.channels) === 1 ? '1 (Monochrome Scientific)' : '3 (CIE-LAB Luminance)'}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-lunar-400">Total Pixels</span>
                <span className="text-lunar-200">{originalStats?.total_pixels?.toLocaleString()} px</span>
              </div>
            </div>
          </div>

          {/* Section 2: Applied Radiometric Parameters */}
          {applied && (
            <div className="space-y-2">
              <span className="font-semibold text-[10px] uppercase tracking-wider text-lunar-400">
                Applied Transform Parameters
              </span>
              <div className="bg-obsidian-850 border border-obsidian-750 rounded-lg p-2.5 font-mono text-[11px] space-y-1.5">
                <div className="flex justify-between py-0.5 border-b border-obsidian-800">
                  <span className="text-lunar-400">Gamma Correction (γ)</span>
                  <span className="text-observatory-cyan">{applied.gamma}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-obsidian-800">
                  <span className="text-lunar-400">Contrast Multiplier</span>
                  <span className="text-observatory-cyan">{applied.contrast}x</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-obsidian-800">
                  <span className="text-lunar-400">Brightness Offset</span>
                  <span className="text-observatory-cyan">{applied.brightness} DN</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-obsidian-800">
                  <span className="text-lunar-400">Polar PSR Shadow Lift</span>
                  <span className="text-observatory-cyan">{applied.shadow_boost}%</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-obsidian-800">
                  <span className="text-lunar-400">CLAHE Clip Limit</span>
                  <span className="text-observatory-cyan">{applied.clahe_clip_limit}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-obsidian-800">
                  <span className="text-lunar-400">CLAHE Tile Grid</span>
                  <span className="text-observatory-cyan">{applied.clahe_grid_size} × {applied.clahe_grid_size}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-obsidian-800">
                  <span className="text-lunar-400">Denoising Kernel</span>
                  <span className="text-observatory-cyan">{applied.denoise_method} (σ={applied.denoise_strength})</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-lunar-400">Unsharp Sharpening</span>
                  <span className="text-observatory-cyan">amt={applied.sharpen_strength}, rad={applied.sharpen_radius}px</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Radiometric Comparison Table */}
          {originalStats && enhancedStats && (
            <div className="space-y-2">
              <span className="font-semibold text-[10px] uppercase tracking-wider text-lunar-400">
                Radiometric Photometry Delta
              </span>
              <div className="bg-obsidian-850 border border-obsidian-750 rounded-lg overflow-hidden">
                <table className="w-full text-left font-mono text-[10.5px]">
                  <thead className="bg-obsidian-800 text-lunar-400 border-b border-obsidian-750 text-[9.5px]">
                    <tr>
                      <th className="p-2">Metric</th>
                      <th className="p-2">Original Raw</th>
                      <th className="p-2">Enhanced Processed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-obsidian-800">
                    <tr>
                      <td className="p-2 text-lunar-400">Mean Radiance</td>
                      <td className="p-2">{originalStats.mean_dn} DN</td>
                      <td className="p-2 text-observatory-cyan font-bold">{enhancedStats.mean_dn} DN</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-lunar-400">Std Dev (RMS Contrast)</td>
                      <td className="p-2">{originalStats.std_dev} DN</td>
                      <td className="p-2 text-observatory-cyan font-bold">{enhancedStats.std_dev} DN</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-lunar-400">Dynamic Range</td>
                      <td className="p-2">{originalStats.dynamic_range_db} dB</td>
                      <td className="p-2 text-emerald-400 font-bold">{enhancedStats.dynamic_range_db} dB</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-lunar-400">Deep Shadow (&lt;15 DN)</td>
                      <td className="p-2">{originalStats.shadow_pixel_pct}%</td>
                      <td className="p-2 text-observatory-cyan">{enhancedStats.shadow_pixel_pct}%</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-lunar-400">Rim Saturation (&gt;240 DN)</td>
                      <td className="p-2">{originalStats.highlight_saturated_pct}%</td>
                      <td className="p-2">{enhancedStats.highlight_saturated_pct}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer CTA */}
        <div className="p-3.5 bg-obsidian-850 border-t border-obsidian-750 flex items-center justify-between">
          <button
            type="button"
            onClick={onDownloadTelemetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-obsidian-750 hover:bg-obsidian-700 text-lunar-200 hover:text-white rounded font-mono text-[11px] transition focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
          >
            <Download className="w-3.5 h-3.5 text-observatory-cyan" />
            <span>Export JSON Sidecar</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-obsidian-800 hover:bg-obsidian-750 text-lunar-300 rounded text-xs transition focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
