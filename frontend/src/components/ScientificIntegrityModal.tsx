import React from 'react';
import { X, ShieldCheck, AlertTriangle, Cpu, Microscope, FileText, CheckCircle2 } from 'lucide-react';

interface ScientificIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScientificIntegrityModal: React.FC<ScientificIntegrityModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none">
      <div
        className="bg-obsidian-900 border border-obsidian-750 w-full max-w-2xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden text-lunar-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scientific-integrity-title"
      >
        {/* Header */}
        <div className="p-4 bg-obsidian-850 border-b border-obsidian-750 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 id="scientific-integrity-title" className="text-sm font-semibold text-lunar-100 uppercase tracking-wider">
                Scientific Integrity &amp; Processing Standards
              </h2>
              <p className="text-[11px] text-lunar-400">
                Ethical transparency, radiometric reproducibility, and planetary research caveats
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-lunar-400 hover:text-white rounded hover:bg-obsidian-750 transition focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-lunar-300">
          {/* Key Rule 1: Zero Generative Hallucination */}
          <div className="p-3.5 bg-obsidian-850 rounded border border-obsidian-750 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-lunar-100 text-xs">
              <Cpu className="w-4 h-4 text-observatory-cyan" />
              <span>1. Classical Deterministic Computer Vision — Zero Hallucination</span>
            </div>
            <p>
              While branded as <strong>LunarVision AI</strong>, our image enhancement engine strictly uses 
              <strong className="text-lunar-100"> deterministic mathematical algorithms</strong> (OpenCV &amp; NumPy):
              Contrast Limited Adaptive Histogram Equalization (CLAHE), power-law gamma transformation ($O(1)$ LUT), 
              non-linear low-DN curve expansion, bilateral edge-preserving filtering, and unsharp masking.
            </p>
            <p className="text-emerald-300/90 text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>
                <strong>Zero Synthetic Content:</strong> We do NOT use generative diffusion models, GANs, neural inpainting, or predictive autoencoders. 
                No craters, boulders, faults, or ice deposits are fabricated.
              </span>
            </p>
          </div>

          {/* CRITICAL TRANSPARENCY CAVEAT: Enhanced visibility does NOT prove recovered terrain */}
          <div className="p-3.5 bg-amber-950/40 rounded border border-amber-600/40 space-y-2 text-amber-200">
            <div className="flex items-center gap-2 font-semibold text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>2. Scientific Caution: Enhanced Visibility ≠ Proven Terrain Recovery</span>
            </div>
            <p className="text-[11.5px] leading-relaxed">
              <strong>Crucial Planetary Science Principle:</strong> Non-linear contrast enhancement and shadow boosting increase the visual perceptibility of faint optical signals. However, 
              <span className="text-white font-semibold underline decoration-amber-400 decoration-1 underline-offset-2"> enhanced visibility does NOT prove that genuine hidden geological terrain details have been authentically recovered</span>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-100/90">
              <li>
                <strong>Detector Read Noise &amp; FPN:</strong> In deeply shadowed regions ($DN &lt; 15$), pixel counts approach the camera sensor's read noise and dark-current floor. High amplification inevitably boosts noise speckle, which can mimic faint topographic textures.
              </li>
              <li>
                <strong>Spatial Artifacts:</strong> Aggressive CLAHE clip limits and unsharp masking can produce artificial ringing halos around bright crater crests.
              </li>
              <li>
                <strong>Validation Protocol:</strong> Faint structures revealed in permanently shadowed regions (PSRs) must always be cross-referenced against independent observation angles, multi-temporal frames, or altimetry datasets (e.g. LOLA) before making scientific claims.
              </li>
            </ul>
          </div>

          {/* Key Rule 3: The Physics of PSR Secondary Photons */}
          <div className="p-3.5 bg-obsidian-850 rounded border border-obsidian-750 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-lunar-100 text-xs">
              <Microscope className="w-4 h-4 text-observatory-blue" />
              <span>3. Physics of Lunar Polar Permanently Shadowed Regions (PSRs)</span>
            </div>
            <p>
              Due to the Moon’s slight 1.54° axial tilt, polar crater floors receive zero direct sunlight. 
              However, they receive <strong>secondary scattered photons</strong> reflecting off sunlit crater rims, central peaks, and Earthshine. 
              Spacecraft digital detectors (such as LRO NAC) record these authentic photons at very low digital numbers ($0 \le DN \le 35$). 
              Our engine remaps these real photons into perceptible contrast ranges.
            </p>
          </div>

          {/* Key Rule 4: Preserving Originals and Telemetry Sidecars */}
          <div className="p-3.5 bg-obsidian-850 rounded border border-obsidian-750 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-lunar-100 text-xs">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>4. Data Preservation &amp; Parameter Reproducibility</span>
            </div>
            <p>
              Original raw upload files are permanently preserved with immutable IDs and never overwritten. 
              All applied radiometric parameters are exportable as standard JSON sidecars alongside lossless 
              PNG or TIFF images to ensure reproducible research for planetary studies.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-obsidian-850 border-t border-obsidian-750 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-observatory-blue hover:bg-observatory-blue/80 text-white rounded text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
          >
            Acknowledge &amp; Return to Observatory
          </button>
        </div>
      </div>
    </div>
  );
};
