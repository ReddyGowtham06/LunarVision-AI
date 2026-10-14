import React, { useState } from 'react';
import { X, Download, FileCode, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ProcessingTelemetry, ImageDimensions } from '../types';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageId: string | null;
  dimensions?: ImageDimensions;
  telemetry: ProcessingTelemetry | null;
  onExportImage: (format: 'PNG' | 'JPEG' | 'TIFF', prefix: string) => Promise<void>;
  onExportJson: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  imageId,
  dimensions,
  telemetry,
  onExportImage,
  onExportJson
}) => {
  const [format, setFormat] = useState<'PNG' | 'JPEG' | 'TIFF'>('PNG');
  const [prefix, setPrefix] = useState<string>('lunarvision_enhanced');
  const [includeJson, setIncludeJson] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedSuccess, setExportedSuccess] = useState<boolean>(false);

  if (!isOpen || !imageId) return null;

  const handleDownload = async () => {
    setIsExporting(true);
    setExportedSuccess(false);
    try {
      await onExportImage(format, prefix);
      if (includeJson && telemetry) {
        onExportJson();
      }
      setExportedSuccess(true);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsExporting(false);
    }
  };

  const ext = format === 'JPEG' ? 'jpg' : format === 'TIFF' ? 'tif' : 'png';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none">
      <div
        className="bg-obsidian-900 border border-obsidian-750 w-full max-w-lg rounded-lg shadow-2xl flex flex-col overflow-hidden text-lunar-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
      >
        {/* Header */}
        <div className="p-4 bg-obsidian-850 border-b border-obsidian-750 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-observatory-cyan" />
            <div>
              <h2 id="download-modal-title" className="text-sm font-semibold text-lunar-100 uppercase tracking-wider">
                Export Enhanced Observation
              </h2>
              <p className="text-[11px] text-lunar-400">
                Download scientifically enhanced lunar imagery and parameter sidecars
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="p-1.5 text-lunar-400 hover:text-white rounded hover:bg-obsidian-750 transition focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Format Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold tracking-wider uppercase text-lunar-400">
              Output Image Format
            </label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Export Image Format">
              {[
                { id: 'PNG', label: 'PNG (Lossless)', desc: 'Standard publication quality' },
                { id: 'TIFF', label: 'TIFF (Scientific)', desc: 'Planetary analysis archive' },
                { id: 'JPEG', label: 'JPEG (Compact)', desc: 'Web & presentation friendly' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  role="radio"
                  aria-checked={format === fmt.id}
                  onClick={() => setFormat(fmt.id as any)}
                  className={`p-2.5 text-left rounded-lg border transition ${
                    format === fmt.id
                      ? 'bg-observatory-blue/20 border-observatory-cyan text-observatory-cyan shadow-sm'
                      : 'bg-obsidian-850 border-obsidian-750 text-lunar-300 hover:border-lunar-600'
                  } focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan`}
                >
                  <div className="font-semibold text-xs">{fmt.label}</div>
                  <div className="text-[9.5px] text-lunar-400 mt-0.5">{fmt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Filename Prefix */}
          <div className="space-y-1">
            <label htmlFor="filename-prefix-input" className="text-[10px] font-semibold tracking-wider uppercase text-lunar-400">
              Filename Prefix
            </label>
            <input
              id="filename-prefix-input"
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_'))}
              className="w-full bg-obsidian-850 border border-obsidian-750 rounded px-3 py-1.5 text-lunar-100 font-mono text-xs focus:outline-none focus:border-observatory-cyan focus-visible:ring-1 focus-visible:ring-observatory-cyan"
            />
            <div className="text-[10px] text-lunar-400 font-mono mt-0.5">
              Saved as: <span className="text-lunar-200">{prefix}_{imageId}.{ext}</span>
            </div>
          </div>

          {/* Telemetry JSON Sidecar Option */}
          <label className="p-3 bg-obsidian-850 rounded-lg border border-obsidian-750 flex items-center justify-between cursor-pointer hover:bg-obsidian-800/80 transition">
            <div className="flex items-center gap-2.5">
              <FileCode className="w-4 h-4 text-observatory-cyan" />
              <div>
                <div className="font-medium text-lunar-100 text-xs">Include Telemetry Sidecar (JSON)</div>
                <div className="text-[10px] text-lunar-400">
                  Exports exact gamma, CLAHE clip, and bilateral filter parameters for scientific reproducibility
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeJson}
              onChange={(e) => setIncludeJson(e.target.checked)}
              className="w-4 h-4 rounded border-obsidian-750 text-observatory-blue focus:ring-observatory-cyan cursor-pointer"
            />
          </label>

          {/* Image Spec summary */}
          {dimensions && (
            <div className="p-2.5 bg-obsidian-950 rounded-lg border border-obsidian-750 font-mono text-[10.5px] text-lunar-400 grid grid-cols-2 gap-2">
              <div>Dimensions: <span className="text-lunar-200">{dimensions.width} × {dimensions.height} px</span></div>
              <div>Megapixels: <span className="text-lunar-200">{dimensions.megapixels || ((dimensions.width * dimensions.height) / 1e6).toFixed(2)} MP</span></div>
            </div>
          )}

          {/* Scientific Provenance Note */}
          <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-300 text-[10px]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Files exported with metadata tags certifying deterministic classical CV processing.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-obsidian-850 border-t border-obsidian-750 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded text-lunar-400 hover:text-white hover:bg-obsidian-750 transition text-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-1.5 rounded bg-observatory-blue hover:bg-observatory-blue/80 text-white font-medium text-xs shadow transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
          >
            {exportedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Downloaded Successfully</span>
              </>
            ) : isExporting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating {format}...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Enhanced Image</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
