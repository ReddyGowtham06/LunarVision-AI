import React, { useMemo } from 'react';
import {
  UploadCloud,
  RotateCcw,
  Download,
  Sparkles,
  Search,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Grid,
  Sliders,
  Eye,
  Layers,
  X
} from 'lucide-react';
import type {
  EnhancementParameters,
  ProcessingTelemetry,
  UploadResponse,
  VerifiedSample,
  ViewMode,
  ExportFormat
} from '../types';
import { apiService } from '../services/api';

interface DesktopStudioProps {
  activeImageId: string | null;
  originalSrc: string | null;
  enhancedSrc: string | null;
  uploadInfo: UploadResponse | null;
  telemetry: ProcessingTelemetry | null;
  params: EnhancementParameters;
  activePreset: string;
  viewMode: ViewMode;
  sliderPos: number;
  zoom: number;
  loupeEnabled: boolean;
  loupeState: { visible: boolean; x: number; y: number; normX: number; normY: number };
  isProcessing: boolean;
  isUploading: boolean;
  isBackendHealthy: boolean;
  samples: VerifiedSample[];
  presets: Record<string, { name: string; subtitle: string; params: EnhancementParameters }>;
  exportFormat: ExportFormat;
  isSamplesOpen: boolean;
  isSpecOpen: boolean;
  isExportOpen: boolean;
  setViewMode: (mode: ViewMode) => void;
  setSliderPos: (pos: number) => void;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setLoupeEnabled: (enabled: boolean) => void;
  setIsDraggingSlider: (dragging: boolean) => void;
  setIsSamplesOpen: (open: boolean) => void;
  setIsSpecOpen: (open: boolean) => void;
  setIsExportOpen: (open: boolean) => void;
  setExportFormat: (fmt: ExportFormat) => void;
  onUpdateParam: <K extends keyof EnhancementParameters>(key: K, value: EnhancementParameters[K]) => void;
  onApplyPreset: (key: string) => void;
  onResetParams: () => void;
  onFileUpload: (file: File) => void;
  onLoadSample: (sample: VerifiedSample) => void;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleViewportMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  setLoupeState: React.Dispatch<React.SetStateAction<{ visible: boolean; x: number; y: number; normX: number; normY: number }>>;
}

export const DesktopStudio: React.FC<DesktopStudioProps> = ({
  activeImageId,
  originalSrc,
  enhancedSrc,
  uploadInfo,
  telemetry,
  params,
  activePreset,
  viewMode,
  sliderPos,
  zoom,
  loupeEnabled,
  loupeState,
  isProcessing,
  isUploading,
  isBackendHealthy,
  samples,
  presets,
  exportFormat,
  isSamplesOpen,
  isSpecOpen,
  isExportOpen,
  setViewMode,
  setSliderPos,
  setZoom,
  setLoupeEnabled,
  setIsDraggingSlider,
  setIsSamplesOpen,
  setIsSpecOpen,
  setIsExportOpen,
  setExportFormat,
  onUpdateParam,
  onApplyPreset,
  onResetParams,
  onFileUpload,
  onLoadSample,
  viewportRef,
  fileInputRef,
  handleViewportMouseMove,
  setLoupeState
}) => {
  // Waveform SVG spline builder
  const histogramPaths = useMemo(() => {
    const origBins = telemetry?.original_stats?.histogram_256 || uploadInfo?.original_stats?.histogram_256;
    const enhBins = telemetry?.enhanced_stats?.histogram_256;
    if (!origBins) return null;

    const buildSpline = (bins: number[]) => {
      const surfaceMax = Math.max(1, ...bins.slice(8, 252));
      const pts: [number, number][] = [];
      for (let i = 0; i < 256; i += 4) {
        const avg = (bins[i] + bins[i + 1] + bins[i + 2] + bins[i + 3]) / 4;
        const norm = i < 8 ? Math.min(1, avg / (surfaceMax * 4)) : Math.min(1, avg / surfaceMax);
        pts.push([(i / 255) * 512, 68 - norm * 58]);
      }
      let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        const xc = (pts[i - 1][0] + pts[i][0]) / 2;
        const yc = (pts[i - 1][1] + pts[i][1]) / 2;
        d += ` Q ${pts[i - 1][0].toFixed(1)} ${pts[i - 1][1].toFixed(1)}, ${xc.toFixed(1)} ${yc.toFixed(1)}`;
      }
      return { line: d, area: `${d} L 512 70 L 0 70 Z` };
    };

    return {
      orig: buildSpline(origBins),
      enh: enhBins ? buildSpline(enhBins) : null
    };
  }, [telemetry, uploadInfo]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-[#0B0F14] text-[#F4F6F8]">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.tif,.tiff"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])}
      />

      {/* Desktop Header */}
      <header className="relative z-30 pt-3.5 px-6 flex items-center justify-between">
        {/* Brand Emblem */}
        <div className="luxury-glass rounded-full px-4 py-2 flex items-center space-x-3 border border-[#303944]">
          <div className="w-7 h-7 rounded-full bg-[#1C232B] border border-[#D6B66F]/40 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D6B66F] shadow-[0_0_8px_#D6B66F]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold tracking-[0.22em] text-xs text-[#F4F6F8] uppercase">
              LUNARVISION
            </span>
            <span className="font-mono text-[10px] text-[#D6B66F] tracking-widest uppercase font-semibold">
              STUDIO 2.0
            </span>
          </div>
          <div className="h-3.5 w-px bg-[#303944]" />
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-[#D6B66F]'
              }`}
            />
            <span className="text-[#9BA3AF]">
              {params.space_bg_cleanup ? '3-Zone 0.00 DN Space Floor' : 'Unmasked Mode'}
            </span>
          </div>
        </div>

        {/* View Modes Selector & Loupe Toggle */}
        <div className="luxury-glass rounded-full p-1 flex items-center space-x-1 border border-[#303944]">
          {([
            { id: 'split', label: 'Split Curtain', icon: Sliders },
            { id: 'side_by_side', label: 'Side-by-Side', icon: Layers },
            { id: 'enhanced', label: 'Studio Master', icon: Sparkles },
            { id: 'original', label: 'Raw Sensor', icon: Eye }
          ] as const).map((m) => {
            const Icon = m.icon;
            const active = viewMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  active
                    ? 'luxury-pill-active text-[#D6B66F] font-semibold'
                    : 'text-[#9BA3AF] hover:text-[#F4F6F8] hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{m.label}</span>
              </button>
            );
          })}
          <div className="h-4 w-px bg-[#303944] mx-1" />
          <button
            onClick={() => setLoupeEnabled(!loupeEnabled)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center space-x-1.5 border ${
              loupeEnabled
                ? 'text-[#D6B66F] bg-[#D6B66F]/10 border-[#D6B66F]/40'
                : 'text-[#9BA3AF] border-transparent hover:text-[#F4F6F8]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Loupe: {loupeEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Header Action Buttons */}
        <div className="luxury-glass rounded-full p-1.5 flex items-center space-x-2 border border-[#303944]">
          <button
            onClick={() => setIsSamplesOpen(true)}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-[#9BA3AF] hover:text-[#F4F6F8] hover:bg-[#303944]/50 transition-all flex items-center space-x-1.5"
          >
            <Grid className="w-3.5 h-3.5 text-[#D6B66F]" />
            <span className="hidden lg:inline">NASA Targets</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-[#F4F6F8] hover:bg-[#303944]/60 transition-all flex items-center space-x-1.5 border border-[#303944]"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#D6B66F]" />
            <span>{isUploading ? 'Loading...' : 'Upload Image'}</span>
          </button>
          <button
            onClick={() => setIsSpecOpen(true)}
            className="hidden xl:flex px-3 py-1.5 rounded-full text-xs font-mono text-[#9BA3AF] hover:text-[#F4F6F8] hover:bg-[#303944]/50 transition-all items-center space-x-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Optical Spec</span>
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            disabled={!activeImageId}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#D6B66F] text-[#0B0F14] hover:bg-[#E2C889] transition-all shadow-[0_2px_12px_rgba(214,182,111,0.3)] disabled:opacity-40 flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Master</span>
          </button>
        </div>
      </header>

      {/* Main Studio Work Area */}
      <main className="flex-1 flex overflow-hidden relative z-10 px-6 pb-4 pt-3 gap-5">
        {/* Left & Center: Canvas & Waveform */}
        <div className="flex-1 flex flex-col relative rounded-3xl overflow-hidden border border-[#303944] bg-[#070A0E] shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
          {/* Target Info Badge HUD */}
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 pointer-events-none">
            <div className="luxury-glass-subtle rounded-full px-3.5 py-1.5 flex items-center space-x-2.5 text-[11px] font-mono border border-[#303944]">
              <span className="text-[#9BA3AF]">TARGET</span>
              <span className="text-[#F4F6F8] font-medium truncate max-w-xs">
                {uploadInfo?.title || uploadInfo?.filename || 'Awaiting Lunar Input'}
              </span>
              {telemetry && (
                <>
                  <span className="text-[#303944]">|</span>
                  <span className="text-[#D6B66F]">
                    {telemetry.dimensions.width} × {telemetry.dimensions.height} px
                  </span>
                  <span className="text-[#303944]">|</span>
                  <span className="text-emerald-400">{telemetry.elapsed_ms} ms</span>
                </>
              )}
            </div>
            {isProcessing && (
              <div className="luxury-glass rounded-full px-3 py-1 text-[11px] font-mono text-[#D6B66F] border border-[#D6B66F]/40 animate-pulse">
                Computing 32-Bit Float Crater Relief...
              </div>
            )}
          </div>

          {/* Zoom In / Out / Fit HUD */}
          <div className="absolute top-4 right-4 z-20 luxury-glass-subtle rounded-full p-1 flex items-center space-x-1 border border-[#303944]">
            <button
              onClick={() => setZoom((z) => Math.max(1.0, z - 0.25))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#9BA3AF] hover:text-[#F4F6F8] hover:bg-[#303944]/50"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-[#F4F6F8] px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(4.0, z + 0.25))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[#9BA3AF] hover:text-[#F4F6F8] hover:bg-[#303944]/50"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="px-2.5 py-1 rounded-full text-[10px] font-mono text-[#D6B66F] hover:bg-[#303944]/50"
            >
              FIT
            </button>
          </div>

          {/* Interactive Image Viewport */}
          <div
            ref={viewportRef}
            onMouseMove={handleViewportMouseMove}
            onMouseLeave={() => setLoupeState((prev) => ({ ...prev, visible: false }))}
            className="flex-1 relative overflow-hidden flex items-center justify-center cursor-crosshair p-4 bg-black"
          >
            {originalSrc ? (
              viewMode === 'side_by_side' ? (
                <div className="grid grid-cols-2 gap-4 w-full h-full items-center justify-center">
                  <div className="relative h-full flex items-center justify-center rounded-2xl border border-[#303944] bg-black overflow-hidden">
                    <img
                      src={originalSrc}
                      alt="Raw Sensor"
                      className="max-h-[75vh] w-auto max-w-full object-contain select-none pointer-events-none drop-shadow-2xl"
                      style={{ transform: `scale(${zoom})` }}
                    />
                    <span className="absolute bottom-3 left-3 luxury-glass-subtle rounded-full px-3 py-1 text-[10px] font-mono uppercase text-[#9BA3AF] border border-[#303944]">
                      RAW SENSOR INPUT
                    </span>
                  </div>
                  <div className="relative h-full flex items-center justify-center rounded-2xl border border-[#D6B66F]/40 bg-black overflow-hidden">
                    <img
                      src={enhancedSrc || originalSrc}
                      alt="Enhanced Master"
                      className="max-h-[75vh] w-auto max-w-full object-contain select-none pointer-events-none drop-shadow-2xl"
                      style={{ transform: `scale(${zoom})` }}
                    />
                    <span className="absolute bottom-3 right-3 luxury-glass-subtle rounded-full px-3 py-1 text-[10px] font-mono text-[#D6B66F] uppercase border border-[#D6B66F]/40">
                      CRATER-ENHANCED STUDIO MASTER
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="relative w-full h-full flex items-center justify-center transition-transform duration-100"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <img
                    src={viewMode === 'original' ? originalSrc : (enhancedSrc || originalSrc)}
                    alt="Lunar Master"
                    className="max-h-[75vh] w-auto max-w-full object-contain select-none pointer-events-none drop-shadow-2xl"
                  />

                  {viewMode === 'split' && (
                    enhancedSrc && enhancedSrc !== originalSrc ? (
                      <>
                        <div
                          className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
                          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                        >
                          <img
                            src={originalSrc}
                            alt="Raw Sensor"
                            className="max-h-[75vh] w-auto max-w-full object-contain select-none pointer-events-none drop-shadow-2xl"
                          />
                        </div>

                        {/* Split Curtain Line & Handle */}
                        <div
                          onMouseDown={(e) => { e.stopPropagation(); setIsDraggingSlider(true); }}
                          className="absolute top-0 bottom-0 w-0.5 bg-[#D6B66F] z-20 cursor-ew-resize shadow-[0_0_8px_rgba(214,182,111,0.6)]"
                          style={{ left: `${sliderPos}%` }}
                        >
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#303944] border-2 border-[#D6B66F] flex items-center justify-center shadow-[0_0_20px_rgba(214,182,111,0.4)]">
                            <span className="font-mono text-[10px] text-[#D6B66F] font-bold">◀▶</span>
                          </div>
                        </div>
                      </>
                    ) : isProcessing ? (
                      <div className="absolute bottom-16 z-20 pointer-events-none">
                        <div className="luxury-glass px-4 py-1.5 rounded-full text-xs font-mono text-[#D6B66F] flex items-center space-x-2 border border-[#D6B66F]/40 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-[#D6B66F] animate-ping" />
                          <span>Enhancing lunar crater relief...</span>
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )
            ) : (
              <div className="text-center space-y-3">
                <UploadCloud className="w-12 h-12 text-[#9BA3AF] mx-auto" />
                <p className="text-sm text-[#9BA3AF]">Drop a lunar photograph or choose a sample to inspect crater relief</p>
              </div>
            )}

            {/* 3.0x Optical Loupe Inspector */}
            {loupeState.visible && originalSrc && (
              <div
                className="fixed w-48 h-48 rounded-full border-2 border-[#D6B66F] shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_20px_rgba(214,182,111,0.3)] pointer-events-none z-50 overflow-hidden bg-black"
                style={{
                  left: `${loupeState.x - 96}px`,
                  top: `${loupeState.y - 96}px`,
                  backgroundImage: `url(${enhancedSrc || originalSrc})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '300% 300%',
                  backgroundPosition: `${loupeState.normX * 100}% ${loupeState.normY * 100}%`
                }}
              >
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <span className="px-2 py-0.5 rounded-full bg-[#0B0F14]/90 border border-[#303944] font-mono text-[9px] text-[#D6B66F] uppercase tracking-widest">
                    3.0× Optical Loupe
                  </span>
                </div>
              </div>
            )}

            {/* Split Mode Labels */}
            {viewMode === 'split' && originalSrc && (
              <>
                <div className="absolute bottom-4 left-4 z-20 luxury-glass-subtle rounded-full px-3.5 py-1 text-[10px] font-mono tracking-widest uppercase text-[#9BA3AF] border border-[#303944] pointer-events-none">
                  RAW SENSOR INPUT
                </div>
                <div className="absolute bottom-4 right-4 z-20 luxury-glass-subtle rounded-full px-3.5 py-1 text-[10px] font-mono tracking-widest uppercase text-[#D6B66F] border border-[#D6B66F]/40 pointer-events-none">
                  CRATER-ENHANCED (0.00 DN SPACE FLOOR)
                </div>
              </>
            )}
          </div>

          {/* Bottom Radiometric Waveform / Histogram Viewer */}
          <div className="h-32 border-t border-[#303944] bg-[#10161E] px-5 py-3 flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#9BA3AF]">
                  Radiometric Luminance Waveform (256-Bin)
                </span>
                <span className="flex items-center space-x-1.5 text-[10px] font-mono text-[#9BA3AF]">
                  <span className="w-2 h-2 rounded-full bg-[#9BA3AF]" />
                  <span>Raw Input</span>
                </span>
                <span className="flex items-center space-x-1.5 text-[10px] font-mono text-[#D6B66F]">
                  <span className="w-2 h-2 rounded-full bg-[#D6B66F]" />
                  <span>3-Zone Crater Enhanced</span>
                </span>
              </div>
              {telemetry && (
                <div className="flex items-center space-x-5 text-[11px] font-mono">
                  <div>
                    <span className="text-[#9BA3AF]">MODE:</span>
                    <span className="text-emerald-400 ml-1">
                      {telemetry.segmentation_mode === 'isolated_body' ? '3-Zone Lunar Body' : 'Surface Terrain'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9BA3AF]">MEAN LUM:</span>
                    <span className="text-[#F4F6F8] ml-1">
                      {telemetry.original_stats.mean_dn} → {telemetry.enhanced_stats.mean_dn} DN
                    </span>
                  </div>
                  <div>
                    <span className="text-[#9BA3AF]">MICRO-RELIEF BOOST:</span>
                    <span className="text-[#D6B66F] ml-1">
                      {params.crater_clarity.toFixed(2)}×
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 w-full relative mt-1.5 overflow-hidden rounded-xl bg-black/60 border border-[#303944]/60">
              {histogramPaths && (
                <svg viewBox="0 0 512 70" preserveAspectRatio="none" className="w-full h-full block">
                  <defs>
                    <linearGradient id="origGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9BA3AF" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#9BA3AF" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="enhGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D6B66F" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#D6B66F" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path d={histogramPaths.orig.area} fill="url(#origGrad)" />
                  <path d={histogramPaths.orig.line} fill="none" stroke="#9BA3AF" strokeWidth="1.2" />
                  {histogramPaths.enh && (
                    <>
                      <path d={histogramPaths.enh.area} fill="url(#enhGrad)" />
                      <path d={histogramPaths.enh.line} fill="none" stroke="#D6B66F" strokeWidth="1.6" />
                    </>
                  )}
                </svg>
              )}
              <div className="absolute bottom-1 inset-x-3 flex justify-between text-[9px] font-mono text-[#9BA3AF] pointer-events-none">
                <span>0.00 DN (Space Floor)</span>
                <span>64 DN (Terminator)</span>
                <span>128 DN (Maria Basin)</span>
                <span>192 DN (Highlands)</span>
                <span>255 DN (Crater Peaks)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Aside: Scientific Control Panel (30% Moonstone Slate surfaces) */}
        <aside className="w-80 lg:w-96 luxury-glass rounded-3xl flex flex-col h-full overflow-hidden border border-[#303944] shrink-0">
          <div className="px-5 py-4 border-b border-[#303944] flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F4F6F8]">
                Crater & Surface Grading
              </h2>
              <p className="text-[11px] text-[#9BA3AF] mt-0.5">Micro-Relief Band-Pass Radiometry</p>
            </div>
            <button
              onClick={onResetParams}
              className="px-3 py-1 rounded-full text-[11px] font-mono text-[#9BA3AF] hover:text-[#F4F6F8] bg-[#161D27] hover:bg-[#303944] border border-[#303944] transition-all flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Calibrated Profiles */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#D6B66F]">
                  Calibrated Profiles
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(presets).map(([key, p]) => {
                  const active = activePreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => onApplyPreset(key)}
                      className={`p-2.5 rounded-2xl text-left transition-all border ${
                        active
                          ? 'luxury-pill-active border-[#D6B66F] text-[#D6B66F]'
                          : 'bg-[#161D27] hover:bg-[#1E2530] border-[#303944] text-[#F4F6F8]'
                      }`}
                    >
                      <div className="text-xs font-medium truncate">{p.name}</div>
                      <div className="text-[10px] text-[#9BA3AF] mt-0.5 truncate">{p.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3-Zone Space Masking Toggle Card */}
            <div className="p-3.5 rounded-2xl bg-[#161D27] border border-[#303944] flex items-center justify-between">
              <div className="pr-2">
                <div className="text-xs font-medium text-[#F4F6F8]">3-Zone 0.00 DN Masking</div>
                <p className="text-[11px] text-[#9BA3AF] mt-0.5 leading-snug">
                  Locks space background to pure black; isolates crater textures without edge halos.
                </p>
              </div>
              <button
                onClick={() => onUpdateParam('space_bg_cleanup', !(params.space_bg_cleanup ?? true))}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 ${
                  params.space_bg_cleanup ?? true ? 'bg-[#D6B66F]' : 'bg-[#303944]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-[#0B0F14] shadow transform transition-transform ${
                    params.space_bg_cleanup ?? true ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 1. Lunar Crater & Texture Relief */}
            <div className="space-y-3.5 pt-1 border-t border-[#303944]">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#D6B66F]">
                1. Lunar Crater & Texture Relief
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#F4F6F8] font-medium">Crater Clarity (Micro-Relief)</span>
                  <span className="font-mono text-[#D6B66F] font-semibold">{params.crater_clarity.toFixed(2)}×</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={params.crater_clarity}
                  onChange={(e) => onUpdateParam('crater_clarity', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#9BA3AF]">Adaptive CLAHE Contrast</span>
                  <span className="font-mono text-[#D6B66F]">{params.clahe_clip_limit.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="8.0"
                  step="0.1"
                  value={params.clahe_clip_limit}
                  onChange={(e) => onUpdateParam('clahe_clip_limit', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#9BA3AF]">Rim Micro-Sharpening</span>
                  <span className="font-mono text-[#D6B66F]">{params.sharpen_strength.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.05"
                  value={params.sharpen_strength}
                  onChange={(e) => onUpdateParam('sharpen_strength', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>
            </div>

            {/* 2. Surface Tone & Shadows */}
            <div className="space-y-3.5 pt-3 border-t border-[#303944]">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#9BA3AF]">
                2. Surface Tone & Shadows
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#9BA3AF]">Shadow / Crater Floor Lift</span>
                  <span className="font-mono text-[#D6B66F]">{params.shadow_boost}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={params.shadow_boost}
                  onChange={(e) => onUpdateParam('shadow_boost', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#9BA3AF]">Contrast Multiplier</span>
                  <span className="font-mono text-[#D6B66F]">{params.contrast.toFixed(2)}×</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.02"
                  value={params.contrast}
                  onChange={(e) => onUpdateParam('contrast', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#9BA3AF]">Power-Law Gamma (γ)</span>
                  <span className="font-mono text-[#D6B66F]">{params.gamma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.2"
                  step="0.02"
                  value={params.gamma}
                  onChange={(e) => onUpdateParam('gamma', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#9BA3AF]">Edge-Preserving Denoise</span>
                  <span className="font-mono text-[#D6B66F]">{params.denoise_strength}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={params.denoise_strength}
                  onChange={(e) => onUpdateParam('denoise_strength', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>
            </div>

            {/* Single-Band Monochrome View Toggle */}
            <div className="space-y-3 pt-3 border-t border-[#303944]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9BA3AF]">Single-Band Monochrome View</span>
                <button
                  onClick={() => onUpdateParam('monochrome_output', !params.monochrome_output)}
                  className={`px-3 py-1 rounded-full text-[11px] font-mono border transition-all ${
                    params.monochrome_output
                      ? 'bg-[#D6B66F] text-[#0B0F14] font-semibold border-[#D6B66F]'
                      : 'bg-[#161D27] text-[#9BA3AF] border-[#303944] hover:text-[#F4F6F8]'
                  }`}
                >
                  {params.monochrome_output ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Quality Badge */}
          <div className="px-5 py-3 border-t border-[#303944] bg-[#0B0F14]/60 text-[10px] font-mono text-[#9BA3AF] flex items-center justify-between">
            <span>ZERO SYNTHETIC HALLUCINATION</span>
            <span className="text-emerald-400 font-semibold">DETERMINISTIC CV</span>
          </div>
        </aside>
      </main>

      {/* Verified NASA Samples Modal */}
      {isSamplesOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-[#303944]">
            <div className="flex items-center justify-between border-b border-[#303944] pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F4F6F8]">
                Verified NASA / LROC Lunar Targets
              </h3>
              <button onClick={() => setIsSamplesOpen(false)} className="text-[#9BA3AF] hover:text-[#F4F6F8]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onLoadSample(s); setIsSamplesOpen(false); }}
                  className="p-3.5 rounded-2xl bg-[#161D27] hover:bg-[#1E2530] border border-[#303944] text-left transition-all"
                >
                  <div className="text-xs font-semibold text-[#F4F6F8]">{s.title}</div>
                  <div className="text-[11px] text-[#D6B66F] font-mono mt-0.5">{s.target_region || s.target}</div>
                  <p className="text-[11px] text-[#9BA3AF] mt-1 line-clamp-2">{s.description || s.scientific_context}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Optical Spec Modal */}
      {isSpecOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass rounded-3xl max-w-xl w-full p-6 space-y-4 border border-[#303944]">
            <div className="flex items-center justify-between border-b border-[#303944] pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F4F6F8]">
                LunarVision Studio 2.0 — Optical Architecture
              </h3>
              <button onClick={() => setIsSpecOpen(false)} className="text-[#9BA3AF] hover:text-[#F4F6F8]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-[#9BA3AF] leading-relaxed">
              <p>
                <strong className="text-[#F4F6F8]">Multi-Scale Crater Clarity:</strong> Isolates subtle micro-craters, rilles, and ejecta rays using a 3x3 high-pass and 9x9 unsharp band-pass filter, applying non-linear contrast to mid-tone topography.
              </p>
              <p>
                <strong className="text-[#F4F6F8]">3-Zone 0.00 DN Space Masking:</strong> Separates the core lunar surface, the feathered limb/corona, and the cosmic background, locking empty space to 0.00 DN without JPEG block noise or artificial edge ringing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Export Master Modal */}
      {isExportOpen && activeImageId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#303944]">
            <div className="flex items-center justify-between border-b border-[#303944] pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F4F6F8]">
                Export Master Image
              </h3>
              <button onClick={() => setIsExportOpen(false)} className="text-[#9BA3AF] hover:text-[#F4F6F8]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['PNG', 'TIFF', 'JPEG'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`p-3 rounded-2xl border text-center text-xs font-mono transition-all ${
                    exportFormat === fmt
                      ? 'bg-[#303944] border-[#D6B66F] text-[#D6B66F] font-semibold'
                      : 'bg-[#161D27] border-[#303944] text-[#9BA3AF]'
                  }`}
                >
                  <div>{fmt}</div>
                  <div className="text-[10px] text-[#9BA3AF] mt-0.5">
                    {fmt === 'PNG' ? 'Lossless' : fmt === 'TIFF' ? 'Archival' : '4:4:4 Q98'}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={async () => {
                  setIsExportOpen(false);
                  await apiService.downloadImageFile(activeImageId, exportFormat, enhancedSrc);
                }}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-[#D6B66F] text-[#0B0F14] hover:bg-[#E2C889] transition-all shadow-md"
              >
                Download {exportFormat} Master
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

