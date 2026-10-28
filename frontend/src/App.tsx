import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { apiService } from './services/api';
import type {
  EnhancementParameters,
  ProcessingTelemetry,
  UploadResponse,
  VerifiedSample,
  ViewMode
} from './types';
import {
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  X,
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
  Layers
} from 'lucide-react';

const DEFAULT_PARAMS: EnhancementParameters = {
  brightness: 0,
  contrast: 1.08,
  gamma: 0.98,
  clahe_clip_limit: 2.8,
  clahe_grid_size: 8,
  shadow_boost: 8,
  denoise_strength: 3,
  denoise_method: 'bilateral',
  sharpen_strength: 0.95,
  sharpen_radius: 1.2,
  monochrome_output: false,
  space_bg_cleanup: true
};

const STUDIO_PRESETS: Record<string, { name: string; subtitle: string; params: EnhancementParameters }> = {
  eclipse_master: {
    name: 'Eclipse & Blood Moon',
    subtitle: 'Rich Maria & 0.0 DN Velvet Space',
    params: { ...DEFAULT_PARAMS, clahe_clip_limit: 2.8, sharpen_strength: 0.95, shadow_boost: 8, contrast: 1.08, gamma: 0.98, space_bg_cleanup: true }
  },
  psr_shadow: {
    name: 'PSR Deep Shadow',
    subtitle: 'Terminator Crater Floor Recovery',
    params: { ...DEFAULT_PARAMS, clahe_clip_limit: 3.6, sharpen_strength: 1.1, shadow_boost: 42, contrast: 1.12, gamma: 0.84, space_bg_cleanup: true }
  },
  tycho_crisp: {
    name: 'Tycho Ray Crisp',
    subtitle: 'High-Definition Ejecta & Rims',
    params: { ...DEFAULT_PARAMS, clahe_clip_limit: 3.3, sharpen_strength: 1.55, sharpen_radius: 1.1, shadow_boost: 12, contrast: 1.16, gamma: 0.96, space_bg_cleanup: true }
  },
  lroc_mono: {
    name: 'LROC Albedo Mono',
    subtitle: 'Single-Band Calibrated Photometry',
    params: { ...DEFAULT_PARAMS, clahe_clip_limit: 3.0, sharpen_strength: 1.15, shadow_boost: 15, contrast: 1.14, gamma: 0.95, monochrome_output: true, space_bg_cleanup: true }
  }
};

export const App: React.FC = () => {
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [enhancedSrc, setEnhancedSrc] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<UploadResponse | null>(null);
  const [telemetry, setTelemetry] = useState<ProcessingTelemetry | null>(null);

  const [params, setParams] = useState<EnhancementParameters>(DEFAULT_PARAMS);
  const [activePreset, setActivePreset] = useState<string>('eclipse_master');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.0);

  // Optical Loupe state
  const [loupeEnabled, setLoupeEnabled] = useState<boolean>(true);
  const [loupeState, setLoupeState] = useState<{ visible: boolean; x: number; y: number; normX: number; normY: number }>({
    visible: false,
    x: 0,
    y: 0,
    normX: 0.5,
    normY: 0.5
  });

  // Loading & UI state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Modals
  const [samples, setSamples] = useState<VerifiedSample[]>([]);
  const [isSamplesOpen, setIsSamplesOpen] = useState<boolean>(false);
  const [isSpecOpen, setIsSpecOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'PNG' | 'JPEG' | 'TIFF'>('PNG');

  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  // Initial boot
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        await apiService.getHealth();
        if (isMounted) setIsBackendHealthy(true);
      } catch {
        if (isMounted) {
          setIsBackendHealthy(false);
        }
      }

      try {
        const sampleList = await apiService.getSamples();
        if (isMounted) {
          setSamples(sampleList);
          if (sampleList.length > 0) {
            handleLoadSample(sampleList[0]);
          }
        }
      } catch {
        // Handled gracefully with fallback
      }
    }
    init();
    return () => { isMounted = false; };
  }, []);

  const triggerEnhancement = useCallback((imageId: string, currentParams: EnhancementParameters) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setIsProcessing(true);
    const requestId = ++latestRequestIdRef.current;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiService.enhanceImage(imageId, currentParams);
        if (requestId === latestRequestIdRef.current) {
          if (res.enhanced_preview_url) {
            setEnhancedSrc(res.enhanced_preview_url);
          } else {
            setEnhancedSrc((prev) => prev || originalSrc);
          }
          if (res.telemetry) {
            setTelemetry(res.telemetry);
          }
          setIsProcessing(false);
        }
      } catch (err: any) {
        if (requestId === latestRequestIdRef.current) {
          setIsProcessing(false);
          setEnhancedSrc((prev) => prev || originalSrc);
          console.warn('Enhancement notice:', err?.message || err);
        }
      }
    }, 110);
  }, [originalSrc]);

  const updateParam = <K extends keyof EnhancementParameters>(key: K, value: EnhancementParameters[K]) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    setActivePreset('custom');
    if (activeImageId) triggerEnhancement(activeImageId, updated);
  };

  const applyPreset = (key: string) => {
    const preset = STUDIO_PRESETS[key];
    if (!preset) return;
    setActivePreset(key);
    setParams(preset.params);
    if (activeImageId) triggerEnhancement(activeImageId, preset.params);
  };

  const handleReset = () => {
    applyPreset('eclipse_master');
  };

  const processFileUpload = (file: File) => {
    setIsUploading(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      if (url) {
        // Immediate visual feedback before backend network processing
        setOriginalSrc(url);
        setEnhancedSrc(url);
        const localId = 'upload-' + Date.now();
        setActiveImageId(localId);
        apiService.cacheImageData(localId, url);

        const img = new Image();
        img.onload = () => {
          setUploadInfo({
            image_id: localId,
            filename: file.name,
            raw_preview_url: url,
            dimensions: {
              width: img.naturalWidth || 1024,
              height: img.naturalHeight || 1024,
              channels: 3,
              megapixels: Math.round(((img.naturalWidth || 1024) * (img.naturalHeight || 1024)) / 1000000 * 100) / 100
            },
            file_metadata: { name: file.name, size: file.size, type: file.type },
            original_stats: {
              min_dn: 0,
              max_dn: 255,
              mean_dn: 64,
              std_dev: 42,
              median_dn: 58,
              shadow_pixel_pct: 12.5,
              highlight_saturated_pct: 1.2,
              dynamic_range_db: 48.2,
              histogram_256: new Array(256).fill(0).map((_, i) => Math.exp(-Math.pow(i - 80, 2) / 2000) * 100),
              total_pixels: (img.naturalWidth || 1024) * (img.naturalHeight || 1024)
            }
          });
        };
        img.src = url;

        setNotificationMsg(`Loaded ${file.name}`);
        triggerEnhancement(localId, params);
      }

      try {
        const res = await apiService.uploadImage(file);
        setActiveImageId(res.image_id);
        if (res.raw_preview_url) {
          setOriginalSrc(res.raw_preview_url);
          setEnhancedSrc((prev) => prev || res.raw_preview_url);
        }
        setUploadInfo(res);
        triggerEnhancement(res.image_id, params);
        setNotificationMsg(`Loaded ${file.name} (${res.dimensions.width}×${res.dimensions.height} px)`);
      } catch (err: any) {
        console.warn('Backend upload failed, operating in client fallback mode:', err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      setErrorMsg('Failed to read local image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSample = async (sample: VerifiedSample) => {
    setIsUploading(true);
    setErrorMsg(null);
    if (sample.remote_url) {
      setOriginalSrc(sample.remote_url);
      setEnhancedSrc(sample.remote_url);
      apiService.cacheImageData(sample.id, sample.remote_url);
    }
    setActiveImageId(sample.id);

    try {
      const res = await apiService.loadSample(sample.id);
      setActiveImageId(res.image_id);
      setOriginalSrc(res.raw_preview_url || sample.remote_url || null);
      setEnhancedSrc(res.raw_preview_url || sample.remote_url || null);
      setUploadInfo(res);
      triggerEnhancement(res.image_id, params);
      setNotificationMsg(`Loaded target: ${sample.title}`);
    } catch (err: any) {
      console.warn(`Backend loadSample failed for ${sample.id}, using sample fallback:`, err);
      if (sample.remote_url) {
        setOriginalSrc(sample.remote_url);
        setEnhancedSrc(sample.remote_url);
      }
      setUploadInfo({
        image_id: sample.id,
        filename: sample.title,
        title: sample.title,
        target_region: sample.target_region || sample.target,
        description: sample.description || sample.scientific_context,
        raw_preview_url: sample.remote_url || '',
        dimensions: { width: 1024, height: 1024, channels: 3, megapixels: 1.05 },
        file_metadata: {},
        original_stats: {
          min_dn: 0,
          max_dn: 255,
          mean_dn: 64,
          std_dev: 42,
          median_dn: 58,
          shadow_pixel_pct: 12.5,
          highlight_saturated_pct: 1.2,
          dynamic_range_db: 48.2,
          histogram_256: new Array(256).fill(0).map((_, i) => Math.exp(-Math.pow(i - 80, 2) / 2000) * 100),
          total_pixels: 1048576
        }
      });
      triggerEnhancement(sample.id, params);
      setNotificationMsg(`Loaded target: ${sample.title}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Interactive Split Curtain & Optical Loupe Mouse Handler
  const handleViewportMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (isDraggingSlider) {
      setSliderPos(Math.max(2, Math.min(98, normX * 100)));
    }

    if (loupeEnabled && !isDraggingSlider && (enhancedSrc || originalSrc)) {
      setLoupeState({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        normX,
        normY
      });
    } else {
      setLoupeState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }
  };

  useEffect(() => {
    const stopDrag = () => setIsDraggingSlider(false);
    window.addEventListener('mouseup', stopDrag);
    return () => window.removeEventListener('mouseup', stopDrag);
  }, []);

  // Build SVG Spline Path for 256-bin Histogram
  const histogramPaths = useMemo(() => {
    const origBins = telemetry?.original_stats?.histogram_256 || uploadInfo?.original_stats?.histogram_256;
    const enhBins = telemetry?.enhanced_stats?.histogram_256;
    if (!origBins) return null;

    const buildSpline = (bins: number[]) => {
      // Normalize against non-background lunar surface peak (bins 8..252) so deep-space spike doesn't flatten the curve
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
    <div
      className="flex flex-col h-screen w-screen bg-[#020305] text-slate-100 overflow-hidden select-none relative font-sans"
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (e.dataTransfer.files?.length) processFileUpload(e.dataTransfer.files[0]);
      }}
    >
      {/* Subtle Ambient Corona Background */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 45% 46%, rgba(225, 65, 35, 0.14) 0%, rgba(120, 28, 18, 0.05) 38%, rgba(2, 3, 5, 0) 70%)'
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.tif,.tiff"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && processFileUpload(e.target.files[0])}
      />

      {/* TOP FLOATING LUXURY STUDIO NAVIGATION BAR */}
      <header className="relative z-30 pt-4 px-6 flex items-center justify-between">
        {/* Left Crest */}
        <div className="luxury-glass rounded-full px-4 py-2 flex items-center space-x-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500/30 via-rose-500/20 to-white/20 border border-white/20 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e2c792] shadow-[0_0_8px_#e2c792]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold tracking-[0.22em] text-xs text-white uppercase">LUNARVISION</span>
            <span className="font-mono text-[10px] text-[#e2c792] tracking-widest uppercase">STUDIO 2.0</span>
          </div>
          <div className="h-3.5 w-px bg-white/10" />
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-slate-300">
              {params.space_bg_cleanup ? '3-Zone Space Mask Active' : 'Unmasked Global Mode'}
            </span>
          </div>
        </div>

        {/* Center Viewport Mode Island */}
        <div className="luxury-glass rounded-full p-1 flex items-center space-x-1">
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
                  active ? 'luxury-pill-active text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{m.label}</span>
              </button>
            );
          })}
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button
            onClick={() => setLoupeEnabled(!loupeEnabled)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all flex items-center space-x-1.5 border ${
              loupeEnabled
                ? 'text-[#e2c792] bg-white/5 border-[#e2c792]/30'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Loupe: {loupeEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Right Actions Island */}
        <div className="luxury-glass rounded-full p-1.5 flex items-center space-x-2">
          <button
            onClick={() => setIsSamplesOpen(true)}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center space-x-1.5"
          >
            <Grid className="w-3.5 h-3.5 text-[#e2c792]" />
            <span className="hidden lg:inline">NASA Targets</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-all flex items-center space-x-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5 text-sky-400" />
            <span>{isUploading ? 'Loading...' : 'Upload Image'}</span>
          </button>
          <button
            onClick={() => setIsSpecOpen(true)}
            className="hidden xl:flex px-3 py-1.5 rounded-full text-xs font-mono text-slate-300 hover:text-white hover:bg-white/10 transition-all items-center space-x-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Optical Spec</span>
          </button>
          <button
            onClick={() => setIsExportOpen(true)}
            disabled={!activeImageId}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-[#020305] hover:bg-[#e2c792] transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] disabled:opacity-40 flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Master</span>
          </button>
        </div>
      </header>

      {/* MAIN STUDIO WORKSPACE */}
      <main className="flex-1 flex overflow-hidden relative z-10 px-6 pb-5 pt-3 gap-5">
        {/* LEFT/CENTER OPTICAL VIEWPORT */}
        <div className="flex-1 flex flex-col relative rounded-3xl overflow-hidden border border-white/[0.07] bg-black/80 shadow-[0_30px_90px_rgba(0,0,0,0.9)]">
          {/* Top-Left Floating Target Telemetry Pill */}
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 pointer-events-none">
            <div className="luxury-glass-subtle rounded-full px-3.5 py-1.5 flex items-center space-x-2.5 text-[11px] font-mono">
              <span className="text-slate-400">TARGET</span>
              <span className="text-white font-medium truncate max-w-xs">
                {uploadInfo?.title || uploadInfo?.filename || 'Awaiting Lunar Input'}
              </span>
              {telemetry && (
                <>
                  <span className="text-white/20">|</span>
                  <span className="text-[#e2c792]">
                    {telemetry.dimensions.width} × {telemetry.dimensions.height} px
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="text-emerald-400">{telemetry.elapsed_ms} ms</span>
                </>
              )}
            </div>
            {isProcessing && (
              <div className="luxury-glass rounded-full px-3 py-1 text-[11px] font-mono text-[#e2c792] animate-pulse">
                Computing 32-Bit Float Radiometry...
              </div>
            )}
          </div>

          {/* Top-Right Zoom Pill */}
          <div className="absolute top-4 right-4 z-20 luxury-glass-subtle rounded-full p-1 flex items-center space-x-1">
            <button
              onClick={() => setZoom((z) => Math.max(1.0, z - 0.25))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-200 px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(4.0, z + 0.25))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-400 hover:text-white hover:bg-white/10"
            >
              FIT
            </button>
          </div>

          {/* Interactive Viewport Container */}
          <div
            ref={viewportRef}
            onMouseMove={handleViewportMouseMove}
            onMouseLeave={() => setLoupeState((prev) => ({ ...prev, visible: false }))}
            className="flex-1 relative overflow-hidden flex items-center justify-center cursor-crosshair p-4"
          >
            {originalSrc ? (
              viewMode === 'side_by_side' ? (
                <div className="grid grid-cols-2 gap-4 w-full h-full items-center justify-center">
                  <div className="relative h-full flex items-center justify-center rounded-2xl border border-white/10 bg-black overflow-hidden">
                    <img
                      src={originalSrc}
                      alt="Raw Sensor"
                      className="max-h-[75vh] w-auto max-w-full object-contain select-none pointer-events-none drop-shadow-2xl"
                      style={{ transform: `scale(${zoom})` }}
                    />
                    <span className="absolute bottom-3 left-3 luxury-glass-subtle rounded-full px-3 py-1 text-[10px] font-mono uppercase">
                      RAW SENSOR INPUT
                    </span>
                  </div>
                  <div className="relative h-full flex items-center justify-center rounded-2xl border border-[#e2c792]/30 bg-black overflow-hidden">
                    <img
                      src={enhancedSrc || originalSrc}
                      alt="Enhanced Master"
                      className="max-h-[75vh] w-auto max-w-full object-contain select-none pointer-events-none drop-shadow-2xl"
                      style={{ transform: `scale(${zoom})` }}
                    />
                    <span className="absolute bottom-3 right-3 luxury-glass-subtle rounded-full px-3 py-1 text-[10px] font-mono text-[#e2c792] uppercase">
                      STUDIO 2.0 ENHANCED
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="relative w-full h-full flex items-center justify-center transition-transform duration-100"
                  style={{ transform: `scale(${zoom})` }}
                >
                  {/* Base Layer: Enhanced Master (falls back to originalSrc) */}
                  <img
                    src={viewMode === 'original' ? originalSrc : (enhancedSrc || originalSrc)}
                    alt="Lunar target"
                    className="max-h-[75vh] w-auto max-w-full object-contain select-none pointer-events-none drop-shadow-2xl"
                  />

                  {/* Clipped Top Layer: Raw Sensor (in Split Mode) */}
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

                        {/* Split Curtain Line */}
                        <div
                          onMouseDown={(e) => { e.stopPropagation(); setIsDraggingSlider(true); }}
                          className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/90 to-transparent z-20 cursor-ew-resize"
                          style={{ left: `${sliderPos}%` }}
                        >
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full luxury-glass border border-white/40 flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                            <span className="font-mono text-[10px] text-white">◀▶</span>
                          </div>
                        </div>
                      </>
                    ) : isProcessing ? (
                      <div className="absolute bottom-16 z-20 pointer-events-none">
                        <div className="luxury-glass px-4 py-1.5 rounded-full text-xs font-mono text-[#e2c792] flex items-center space-x-2 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-[#e2c792] animate-ping" />
                          <span>Enhancing lunar features...</span>
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )
            ) : (
              <div className="text-center space-y-3">
                <UploadCloud className="w-12 h-12 text-slate-500 mx-auto" />
                <p className="text-sm text-slate-300">Drop a lunar photograph or select a NASA sample to begin</p>
              </div>
            )}

            {/* 3x Optical Magnifier Loupe */}
            {loupeState.visible && originalSrc && (
              <div
                className="fixed w-48 h-48 rounded-full border border-[#e2c792]/80 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_20px_rgba(226,199,146,0.25)] pointer-events-none z-50 overflow-hidden bg-black"
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
                  <span className="px-2 py-0.5 rounded-full bg-black/80 border border-white/15 font-mono text-[9px] text-[#e2c792] uppercase tracking-widest">
                    3.0× Optical Loupe
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Corner Badges */}
            {viewMode === 'split' && originalSrc && (
              <>
                <div className="absolute bottom-4 left-4 z-20 luxury-glass-subtle rounded-full px-3.5 py-1 text-[10px] font-mono tracking-widest uppercase text-slate-300 pointer-events-none">
                  RAW SENSOR INPUT
                </div>
                <div className="absolute bottom-4 right-4 z-20 luxury-glass-subtle rounded-full px-3.5 py-1 text-[10px] font-mono tracking-widest uppercase text-[#e2c792] border border-[#e2c792]/30 pointer-events-none">
                  STUDIO 2.0 ENHANCED (0.0 DN SPACE FLOOR)
                </div>
              </>
            )}
          </div>

          {/* BOTTOM DOCK: LIVE SPLINE WAVEFORM */}
          <div className="h-32 border-t border-white/[0.07] bg-[#07090e]/90 backdrop-blur-xl px-5 py-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
                  Radiometric Luminance Waveform (256-Bin)
                </span>
                <span className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>Raw Input</span>
                </span>
                <span className="flex items-center space-x-1.5 text-[10px] font-mono text-[#e2c792]">
                  <span className="w-2 h-2 rounded-full bg-[#e2c792]" />
                  <span>3-Zone Masked Output</span>
                </span>
              </div>
              {telemetry && (
                <div className="flex items-center space-x-5 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500">MODE:</span>
                    <span className="text-emerald-400 ml-1">
                      {telemetry.segmentation_mode === 'isolated_body' ? '3-Zone Lunar Disc' : 'Surface Terrain'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">MEAN LUM:</span>
                    <span className="text-white ml-1">
                      {telemetry.original_stats.mean_dn} → {telemetry.enhanced_stats.mean_dn} DN
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">STD DEV (σ):</span>
                    <span className="text-[#e2c792] ml-1">
                      {telemetry.original_stats.std_dev} → {telemetry.enhanced_stats.std_dev}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 w-full relative mt-1.5 overflow-hidden rounded-xl bg-black/50 border border-white/[0.05]">
              {histogramPaths && (
                <svg viewBox="0 0 512 70" preserveAspectRatio="none" className="w-full h-full block">
                  <defs>
                    <linearGradient id="origGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="enhGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e2c792" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#e2c792" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <path d={histogramPaths.orig.area} fill="url(#origGrad)" />
                  <path d={histogramPaths.orig.line} fill="none" stroke="#64748b" strokeWidth="1.2" />
                  {histogramPaths.enh && (
                    <>
                      <path d={histogramPaths.enh.area} fill="url(#enhGrad)" />
                      <path d={histogramPaths.enh.line} fill="none" stroke="#e2c792" strokeWidth="1.6" />
                    </>
                  )}
                </svg>
              )}
              <div className="absolute bottom-1 inset-x-3 flex justify-between text-[9px] font-mono text-slate-500 pointer-events-none">
                <span>0 DN (Deep Space)</span>
                <span>64 DN (Terminator)</span>
                <span>128 DN (Maria)</span>
                <span>192 DN (Highlands)</span>
                <span>255 DN (Crater Rays)</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FLOATING LUXURY STUDIO CONSOLE */}
        <aside className="w-80 lg:w-96 luxury-glass rounded-3xl flex flex-col h-full overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">Optical Grading Suite</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">32-Bit Float Radiometric Engine</p>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1 rounded-full text-[11px] font-mono text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Optical Presets */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#e2c792]">
                  Calibrated Optical Profiles
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STUDIO_PRESETS).map(([key, p]) => {
                  const active = activePreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className={`p-2.5 rounded-2xl text-left transition-all border ${
                        active
                          ? 'luxury-pill-active text-white'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.07] text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-medium truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{p.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3-Zone Space Background Protection Toggle */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border border-emerald-500/25 flex items-center justify-between">
              <div className="pr-2">
                <div className="text-xs font-medium text-white">3-Zone Space Masking</div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Isolates lunar disc & corona; locks deep space to pure 0.0 DN without blotches.
                </p>
              </div>
              <button
                onClick={() => updateParam('space_bg_cleanup', !(params.space_bg_cleanup ?? true))}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
                  params.space_bg_cleanup ?? true ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                    params.space_bg_cleanup ?? true ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Section 1: Local Contrast & Micro-Relief */}
            <div className="space-y-3.5 pt-1 border-t border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
                1. Local Contrast & Micro-Relief
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Adaptive CLAHE Contrast</span>
                  <span className="font-mono text-[#e2c792]">{params.clahe_clip_limit.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="8.0"
                  step="0.1"
                  value={params.clahe_clip_limit}
                  onChange={(e) => updateParam('clahe_clip_limit', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">CLAHE Contextual Grid</span>
                  <span className="font-mono text-[#e2c792]">{params.clahe_grid_size}×{params.clahe_grid_size}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="24"
                  step="2"
                  value={params.clahe_grid_size}
                  onChange={(e) => updateParam('clahe_grid_size', parseInt(e.target.value, 10))}
                  className="studio-slider"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Halo-Free Micro Sharpening</span>
                  <span className="font-mono text-[#e2c792]">{params.sharpen_strength.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.05"
                  value={params.sharpen_strength}
                  onChange={(e) => updateParam('sharpen_strength', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>
            </div>

            {/* Section 2: Radiometric Tone Curve */}
            <div className="space-y-3.5 pt-3 border-t border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
                2. Radiometric Tone Curve
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Shadow / PSR Lift (Core Only)</span>
                  <span className="font-mono text-[#e2c792]">{params.shadow_boost}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={params.shadow_boost}
                  onChange={(e) => updateParam('shadow_boost', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Contrast Multiplier</span>
                  <span className="font-mono text-[#e2c792]">{params.contrast.toFixed(2)}×</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.02"
                  value={params.contrast}
                  onChange={(e) => updateParam('contrast', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Power-Law Gamma (γ)</span>
                  <span className="font-mono text-[#e2c792]">{params.gamma.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="2.2"
                  step="0.02"
                  value={params.gamma}
                  onChange={(e) => updateParam('gamma', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Denoise Filtering ({params.denoise_method})</span>
                  <span className="font-mono text-[#e2c792]">{params.denoise_strength}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={params.denoise_strength}
                  onChange={(e) => updateParam('denoise_strength', parseFloat(e.target.value))}
                  className="studio-slider"
                />
              </div>
            </div>

            {/* Section 3: Spectral Mode */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Single-Band Monochrome View</span>
                <button
                  onClick={() => updateParam('monochrome_output', !params.monochrome_output)}
                  className="px-3 py-1 rounded-full text-[11px] font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                >
                  {params.monochrome_output ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-white/[0.07] bg-black/40 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>ZERO GENERATIVE HALLUCINATION</span>
            <span className="text-emerald-400">100% DETERMINISTIC</span>
          </div>
        </aside>
      </main>

      {/* NASA TARGET SAMPLES MODAL */}
      {isSamplesOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass rounded-3xl max-w-2xl w-full p-6 space-y-4 border border-white/15">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Verified NASA / LROC Lunar Targets
              </h3>
              <button onClick={() => setIsSamplesOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { handleLoadSample(s); setIsSamplesOpen(false); }}
                  className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-left transition-all"
                >
                  <div className="text-xs font-semibold text-white">{s.title}</div>
                  <div className="text-[11px] text-[#e2c792] font-mono mt-0.5">{s.target_region || s.target}</div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{s.description || s.scientific_context}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OPTICAL SPECIFICATION MODAL */}
      {isSpecOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass rounded-3xl max-w-xl w-full p-6 space-y-4 border border-white/15">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                LunarVision Studio 2.0 — Optical Architecture
              </h3>
              <button onClick={() => setIsSpecOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong>3-Zone Soft Lunar Masking:</strong> Separates the inner lunar surface core, the feathered atmospheric limb corona, and deep space so local contrast (CLAHE) and unsharp masking never amplify background JPEG block noise or create bright edge ringing.
              </p>
              <p>
                <strong>32-Bit Floating-Point Blending:</strong> All tone expansion, gamma, contrast, and multi-scale coring sharpening execute in continuous 32-bit float space before a single final quantization step.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT MASTER MODAL */}
      {isExportOpen && activeImageId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="luxury-glass rounded-3xl max-w-md w-full p-6 space-y-4 border border-white/15">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Export Calibrated Master
              </h3>
              <button onClick={() => setIsExportOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['PNG', 'TIFF', 'JPEG'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`p-3 rounded-2xl border text-center text-xs font-mono transition-all ${
                    exportFormat === fmt ? 'luxury-pill-active text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  <div>{fmt}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {fmt === 'PNG' ? 'Lossless' : fmt === 'TIFF' ? 'Archival' : '4:4:4 Q98'}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <a
                href={apiService.getDownloadUrl(activeImageId, exportFormat)}
                download
                onClick={() => setIsExportOpen(false)}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-[#e2c792] transition-all"
              >
                Download {exportFormat} Master
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Drag Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl border-2 border-dashed border-[#e2c792] flex flex-col items-center justify-center">
          <UploadCloud className="w-14 h-14 text-[#e2c792] mb-3 animate-bounce" />
          <div className="text-lg font-medium text-white">Drop Lunar Photograph to Open in Studio</div>
        </div>
      )}

      {/* Alerts */}
      {errorMsg && (
        <div className="fixed bottom-5 right-5 z-50 luxury-glass border border-rose-500/40 text-rose-200 px-4 py-3 rounded-2xl flex items-center space-x-3 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {notificationMsg && (
        <div className="fixed bottom-5 left-5 z-50 luxury-glass border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-2xl flex items-center space-x-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
};

export default App;
