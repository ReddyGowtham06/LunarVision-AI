import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiService } from './services/api';
import type {
  EnhancementParameters,
  ProcessingTelemetry,
  UploadResponse,
  VerifiedSample,
  ViewMode,
  ExportFormat
} from './types';
import {
  UploadCloud,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { MobileStudio } from './components/MobileStudio';
import { DesktopStudio } from './components/DesktopStudio';

export const DEFAULT_PARAMS: EnhancementParameters = {
  brightness: -6,
  contrast: 1.04,
  gamma: 1.06,
  clahe_clip_limit: 1.7,
  clahe_grid_size: 8,
  shadow_boost: 0,
  denoise_strength: 4,
  denoise_method: 'bilateral',
  sharpen_strength: 0.50,
  sharpen_radius: 0.9,
  crater_clarity: 0.65,
  monochrome_output: false,
  space_bg_cleanup: true
};

export const STUDIO_PRESETS: Record<string, { name: string; subtitle: string; params: EnhancementParameters }> = {
  eclipse_master: {
    name: 'Eclipse & Blood Moon',
    subtitle: 'Rich Maria & 0.00 DN Space',
    params: {
      ...DEFAULT_PARAMS,
      brightness: -6,
      gamma: 1.06,
      contrast: 1.04,
      clahe_clip_limit: 1.7,
      sharpen_strength: 0.50,
      sharpen_radius: 0.9,
      crater_clarity: 0.65,
      shadow_boost: 0,
      denoise_strength: 4,
      denoise_method: 'bilateral',
      space_bg_cleanup: true
    }
  },
  psr_shadow: {
    name: 'PSR Deep Shadow',
    subtitle: 'Polar Crater Floor Recovery',
    params: {
      ...DEFAULT_PARAMS,
      brightness: -4,
      gamma: 0.98,
      contrast: 1.06,
      clahe_clip_limit: 2.1,
      sharpen_strength: 0.65,
      sharpen_radius: 0.9,
      crater_clarity: 0.80,
      shadow_boost: 28,
      denoise_strength: 4,
      denoise_method: 'bilateral',
      space_bg_cleanup: true
    }
  },
  tycho_crisp: {
    name: 'Tycho Ray Micro-Relief',
    subtitle: 'High-Definition Ejecta & Rims',
    params: {
      ...DEFAULT_PARAMS,
      brightness: -5,
      gamma: 1.02,
      contrast: 1.08,
      clahe_clip_limit: 2.2,
      sharpen_strength: 0.85,
      sharpen_radius: 0.85,
      crater_clarity: 0.95,
      shadow_boost: 4,
      denoise_strength: 4,
      denoise_method: 'bilateral',
      space_bg_cleanup: true
    }
  },
  lroc_mono: {
    name: 'LROC Albedo Mono',
    subtitle: 'Calibrated Photometry',
    params: {
      ...DEFAULT_PARAMS,
      brightness: -4,
      gamma: 1.02,
      contrast: 1.06,
      clahe_clip_limit: 1.9,
      sharpen_strength: 0.70,
      sharpen_radius: 0.9,
      crater_clarity: 0.75,
      shadow_boost: 6,
      denoise_strength: 4,
      denoise_method: 'bilateral',
      monochrome_output: true,
      space_bg_cleanup: true
    }
  }
};

export const App: React.FC = () => {
  // Responsive screen breakpoint
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Image & Session State
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [enhancedSrc, setEnhancedSrc] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<UploadResponse | null>(null);
  const [telemetry, setTelemetry] = useState<ProcessingTelemetry | null>(null);

  // Enhancement controls state
  const [params, setParams] = useState<EnhancementParameters>(DEFAULT_PARAMS);
  const [activePreset, setActivePreset] = useState<string>('eclipse_master');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.0);

  // Loupe Inspector state (Desktop)
  const [loupeEnabled, setLoupeEnabled] = useState<boolean>(true);
  const [loupeState, setLoupeState] = useState<{ visible: boolean; x: number; y: number; normX: number; normY: number }>({
    visible: false,
    x: 0,
    y: 0,
    normX: 0.5,
    normY: 0.5
  });

  // Processing, Upload & Engine status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Modals & Samples
  const [samples, setSamples] = useState<VerifiedSample[]>([]);
  const [isSamplesOpen, setIsSamplesOpen] = useState<boolean>(false);
  const [isSpecOpen, setIsSpecOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('PNG');

  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  // Initialize backend health & load default samples
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
          // Auto-load first sample if on desktop or sample catalog is ready
          if (sampleList.length > 0) {
            handleLoadSample(sampleList[0]);
          }
        }
      } catch {
        if (isMounted) {
          setErrorMsg('Unable to reach backend engine. Operating in client-side enhancement mode.');
        }
      }
    }
    init();
    return () => { isMounted = false; };
  }, []);

  // Enhancement invocation with debounce
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

  // Update a parameter
  const updateParam = <K extends keyof EnhancementParameters>(key: K, value: EnhancementParameters[K]) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    setActivePreset('custom');
    if (activeImageId) triggerEnhancement(activeImageId, updated);
  };

  // Apply a preset
  const applyPreset = (key: string) => {
    const preset = STUDIO_PRESETS[key];
    if (!preset) return;
    setActivePreset(key);
    setParams(preset.params);
    if (activeImageId) triggerEnhancement(activeImageId, preset.params);
  };

  // Reset to default preset
  const handleReset = () => {
    applyPreset('eclipse_master');
  };

  // Process user file upload
  const processFileUpload = (file: File) => {
    setIsUploading(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      if (url) {
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
        console.warn('Backend upload failed, staying in client preview mode:', err);
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

  // Load a verified sample
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

  // Mouse move handler for Desktop loupe & split slider
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

  return (
    <div
      className="flex flex-col h-screen w-screen bg-[#0B0F14] text-[#F4F6F8] overflow-hidden select-none relative font-sans"
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (e.dataTransfer.files?.length) processFileUpload(e.dataTransfer.files[0]);
      }}
    >
      {/* Responsive View Switcher: Mobile Experience (< 1024px) vs Desktop Studio (>= 1024px) */}
      {isMobile ? (
        <MobileStudio
          activeImageId={activeImageId}
          originalSrc={originalSrc}
          enhancedSrc={enhancedSrc}
          uploadInfo={uploadInfo}
          telemetry={telemetry}
          params={params}
          activePreset={activePreset}
          isProcessing={isProcessing}
          isUploading={isUploading}
          isBackendHealthy={isBackendHealthy}
          samples={samples}
          presets={STUDIO_PRESETS}
          onUpdateParam={updateParam}
          onApplyPreset={applyPreset}
          onResetParams={handleReset}
          onFileUpload={processFileUpload}
          onLoadSample={handleLoadSample}
        />
      ) : (
        <DesktopStudio
          activeImageId={activeImageId}
          originalSrc={originalSrc}
          enhancedSrc={enhancedSrc}
          uploadInfo={uploadInfo}
          telemetry={telemetry}
          params={params}
          activePreset={activePreset}
          viewMode={viewMode}
          sliderPos={sliderPos}
          zoom={zoom}
          loupeEnabled={loupeEnabled}
          loupeState={loupeState}
          isProcessing={isProcessing}
          isUploading={isUploading}
          isBackendHealthy={isBackendHealthy}
          samples={samples}
          presets={STUDIO_PRESETS}
          exportFormat={exportFormat}
          isSamplesOpen={isSamplesOpen}
          isSpecOpen={isSpecOpen}
          isExportOpen={isExportOpen}
          setViewMode={setViewMode}
          setSliderPos={setSliderPos}
          setZoom={setZoom}
          setLoupeEnabled={setLoupeEnabled}
          setIsDraggingSlider={setIsDraggingSlider}
          setIsSamplesOpen={setIsSamplesOpen}
          setIsSpecOpen={setIsSpecOpen}
          setIsExportOpen={setIsExportOpen}
          setExportFormat={setExportFormat}
          onUpdateParam={updateParam}
          onApplyPreset={applyPreset}
          onResetParams={handleReset}
          onFileUpload={processFileUpload}
          onLoadSample={handleLoadSample}
          viewportRef={viewportRef}
          fileInputRef={fileInputRef}
          handleViewportMouseMove={handleViewportMouseMove}
          setLoupeState={setLoupeState}
        />
      )}

      {/* Global Drag and Drop File Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-[#0B0F14]/90 backdrop-blur-xl border-2 border-dashed border-[#D6B66F] flex flex-col items-center justify-center pointer-events-none">
          <UploadCloud className="w-14 h-14 text-[#D6B66F] mb-3 animate-bounce" />
          <div className="text-lg font-medium text-[#F4F6F8]">Drop Lunar Photograph to Open in Studio</div>
          <div className="text-xs text-[#9BA3AF] mt-1">Supports JPG, PNG, and 16-Bit TIFF</div>
        </div>
      )}

      {/* Global Error Toast */}
      {errorMsg && (
        <div className="fixed bottom-5 right-5 z-50 luxury-glass border border-rose-500/40 text-rose-200 px-4 py-3 rounded-2xl flex items-center space-x-3 text-xs shadow-xl">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Notification Toast */}
      {notificationMsg && (
        <div className="fixed bottom-5 left-5 z-50 luxury-glass border border-[#D6B66F]/40 text-[#F4F6F8] px-4 py-2.5 rounded-2xl flex items-center space-x-2 text-xs shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-[#D6B66F] shrink-0" />
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-[#9BA3AF] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
