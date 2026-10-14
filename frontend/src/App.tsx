import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ComparisonSlider } from './components/ComparisonSlider';
import { ControlPanel } from './components/ControlPanel';
import { HistogramViewer } from './components/HistogramViewer';
import { SampleGalleryModal } from './components/SampleGalleryModal';
import { ScientificIntegrityModal } from './components/ScientificIntegrityModal';
import { DownloadModal } from './components/DownloadModal';
import { MetadataDrawer } from './components/MetadataDrawer';
import { apiService } from './services/api';
import type {
  EnhancementParameters,
  ProcessingTelemetry,
  UploadResponse,
  VerifiedSample,
  ViewMode
} from './types';
import { UploadCloud, AlertCircle, CheckCircle2, X } from 'lucide-react';

const DEFAULT_PARAMS: EnhancementParameters = {
  brightness: 0,
  contrast: 1.0,
  gamma: 1.0,
  clahe_clip_limit: 2.5,
  clahe_grid_size: 8,
  shadow_boost: 0,
  denoise_strength: 0,
  denoise_method: 'bilateral',
  sharpen_strength: 0,
  sharpen_radius: 1.0,
  monochrome_output: false
};

export const App: React.FC = () => {
  // Session & Images state
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [enhancedSrc, setEnhancedSrc] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<UploadResponse | null>(null);
  const [telemetry, setTelemetry] = useState<ProcessingTelemetry | null>(null);

  // Parameter State
  const [params, setParams] = useState<EnhancementParameters>(DEFAULT_PARAMS);
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  // UI & Loading States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Samples State
  const [samples, setSamples] = useState<VerifiedSample[]>([]);
  const [selectedSample, setSelectedSample] = useState<VerifiedSample | null>(null);

  // Modals
  const [isSamplesModalOpen, setIsSamplesModalOpen] = useState<boolean>(false);
  const [isIntegrityModalOpen, setIsIntegrityModalOpen] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [isTelemetryDrawerOpen, setIsTelemetryDrawerOpen] = useState<boolean>(false);

  // Drag and drop overlay
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Debounce & Request sequence tracking refs
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestIdRef = useRef<number>(0);

  // 1. Initial boot: health check, fetch samples catalog, and load first sample
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        await apiService.getHealth();
        if (isMounted) setIsBackendHealthy(true);

        const fetchedSamples = await apiService.getSamples();
        if (isMounted) {
          setSamples(fetchedSamples);
          if (fetchedSamples.length > 0) {
            // Load the premier NASA sample on launch
            const premier = fetchedSamples[0];
            loadSample(premier);
          }
        }
      } catch (err: any) {
        console.warn('Backend connection notice:', err);
        if (isMounted) {
          setIsBackendHealthy(false);
          setErrorMsg('Backend connection pending. Please ensure the Python FastAPI service is running on port 8000.');
        }
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load verified sample into workbench
  const loadSample = async (sample: VerifiedSample) => {
    setSelectedSample(sample);
    setActiveImageId(sample.id);
    setIsProcessing(true);
    setErrorMsg(null);

    // Apply sample's recommended preset parameters
    const presetParams: EnhancementParameters = {
      ...DEFAULT_PARAMS,
      ...(sample.recommended_preset || {})
    };
    setParams(presetParams);

    try {
      const res = await apiService.enhanceImage(sample.id, presetParams);
      setOriginalSrc(res.original_base64);
      setEnhancedSrc(res.enhanced_base64);
      setTelemetry(res.telemetry);
      setUploadInfo({
        success: true,
        image_id: sample.id,
        filename: sample.local_filename,
        file_size_bytes: sample.file_size_bytes,
        dimensions: res.telemetry.dimensions,
        bit_depth: 8,
        channels: res.telemetry.dimensions.channels || 1,
        is_grayscale: res.telemetry.dimensions.channels === 1,
        initial_stats: res.telemetry.original_stats,
        preview_url: `/api/samples/${sample.id}/image`,
        preview_base64: res.original_base64
      });
      setNotificationMsg(`Loaded verified observation: ${sample.title}`);
      setTimeout(() => setNotificationMsg(null), 3500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Failed to load sample: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Upload custom file
  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    setIsProcessing(true);
    setErrorMsg(null);
    setSelectedSample(null);

    try {
      const uploadRes = await apiService.uploadImage(file);
      setUploadInfo(uploadRes);
      setActiveImageId(uploadRes.image_id);
      setOriginalSrc(uploadRes.preview_base64);

      // Start with flat default parameters
      const initialParams = { ...DEFAULT_PARAMS };
      setParams(initialParams);

      const enhanceRes = await apiService.enhanceImage(uploadRes.image_id, initialParams);
      setEnhancedSrc(enhanceRes.enhanced_base64);
      setTelemetry(enhanceRes.telemetry);

      setNotificationMsg(`Uploaded: ${file.name} (${uploadRes.dimensions.width}×${uploadRes.dimensions.height}px, ${uploadRes.bit_depth}-bit)`);
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Image upload failed. Supported formats: JPG, PNG, TIFF (8/16-bit).');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  // 4. Trigger enhancement with debounce and race condition protection
  const triggerEnhance = useCallback(
    (newParams: EnhancementParameters) => {
      if (!activeImageId) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setIsProcessing(true);
      const requestId = ++latestRequestIdRef.current;

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await apiService.enhanceImage(activeImageId, newParams);
          // If a newer request was dispatched while this was in flight, discard this older response
          if (requestId !== latestRequestIdRef.current) return;

          // Update only the enhanced image; keep originalSrc completely unchanged
          setEnhancedSrc(res.enhanced_base64);
          setTelemetry(res.telemetry);
          setErrorMsg(null);
        } catch (err: any) {
          if (requestId !== latestRequestIdRef.current) return;
          console.error(err);
          setErrorMsg(`Enhancement failed: ${err.message}`);
        } finally {
          if (requestId === latestRequestIdRef.current) {
            setIsProcessing(false);
          }
        }
      }, 120); // 120ms debounce for responsive interactive slider feedback
    },
    [activeImageId]
  );

  const handleParamsChange = (newParams: EnhancementParameters) => {
    setParams(newParams);
    triggerEnhance(newParams);
  };

  // Reset to calibrated default parameters
  const handleResetParams = () => {
    setParams(DEFAULT_PARAMS);
    triggerEnhance(DEFAULT_PARAMS);
    setNotificationMsg('Reset parameters to calibrated default');
    setTimeout(() => setNotificationMsg(null), 2500);
  };

  // Reset to 100% raw identity pass-through
  const handleResetOriginal = () => {
    const rawParams: EnhancementParameters = {
      brightness: 0,
      contrast: 1.0,
      gamma: 1.0,
      clahe_clip_limit: 0.1,
      clahe_grid_size: 8,
      shadow_boost: 0,
      denoise_strength: 0,
      denoise_method: 'bilateral',
      sharpen_strength: 0,
      sharpen_radius: 1.0,
      monochrome_output: false
    };
    setParams(rawParams);
    triggerEnhance(rawParams);
    setNotificationMsg('Reset to 100% Raw Unprocessed Sensor State');
    setTimeout(() => setNotificationMsg(null), 2500);
  };

  // Apply a preset
  const handleApplyPreset = (preset: Partial<EnhancementParameters>) => {
    const merged = { ...params, ...preset };
    setParams(merged);
    triggerEnhance(merged);
  };

  // Export handlers
  const handleExportImage = async (format: 'PNG' | 'JPEG' | 'TIFF', prefix: string) => {
    if (!activeImageId) return;
    await apiService.exportImage(activeImageId, format, prefix);
    setNotificationMsg(`Exported enhanced image (${format})`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleExportJson = () => {
    if (!telemetry || !activeImageId) return;
    apiService.downloadTelemetryJson(telemetry, activeImageId);
    setNotificationMsg('Exported JSON scientific telemetry sidecar');
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden bg-obsidian-950 text-lunar-200"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-obsidian-950/90 border-2 border-dashed border-observatory-cyan flex flex-col items-center justify-center p-8 backdrop-blur-sm pointer-events-none">
          <UploadCloud className="w-16 h-16 text-observatory-cyan animate-bounce mb-4" />
          <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-2">
            Drop Lunar Image to Analyze
          </h2>
          <p className="text-xs text-lunar-300 font-mono">
            Supported: JPG, PNG, and 8-bit / 16-bit TIFF scientific rasters
          </p>
        </div>
      )}

      {/* Header Navigation */}
      <Navbar
        onOpenSamples={() => setIsSamplesModalOpen(true)}
        onOpenUpload={() => {}}
        onOpenTelemetry={() => setIsTelemetryDrawerOpen(true)}
        onOpenIntegrity={() => setIsIntegrityModalOpen(true)}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
        onFileSelected={handleUploadFile}
        isBackendHealthy={isBackendHealthy}
        sampleCount={samples.length}
        hasActiveImage={!!activeImageId}
      />

      {/* Toast Notification Banner */}
      {notificationMsg && (
        <div className="bg-observatory-blue/90 border-b border-observatory-cyan text-white text-xs px-4 py-2 flex items-center justify-between font-mono animate-fadeIn z-20">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-observatory-cyan" />
            {notificationMsg}
          </span>
          <button
            type="button"
            onClick={() => setNotificationMsg(null)}
            className="hover:opacity-80 p-0.5 focus:outline-none"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMsg && (
        <div className="bg-red-950/80 border-b border-red-500/50 text-red-200 text-xs px-4 py-2 flex items-center justify-between font-mono z-20">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {errorMsg}
          </span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="hover:opacity-80 p-0.5 focus:outline-none"
            aria-label="Close error message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Central Observatory Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Main Center Image Viewport */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          <ComparisonSlider
            originalSrc={originalSrc}
            enhancedSrc={enhancedSrc}
            isProcessing={isProcessing || isUploading}
            dimensions={telemetry?.dimensions || uploadInfo?.dimensions}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            missionLabel={selectedSample ? `${selectedSample.nasa_id} • ${selectedSample.target}` : uploadInfo?.filename}
          />

          {/* Bottom Dual Histogram & Radiometric Telemetry Bar */}
          <HistogramViewer
            originalStats={telemetry?.original_stats || uploadInfo?.initial_stats || null}
            enhancedStats={telemetry?.enhanced_stats || null}
          />
        </main>

        {/* Right Scientific Control Sidebar */}
        <ControlPanel
          params={params}
          onChange={handleParamsChange}
          onResetParams={handleResetParams}
          onResetOriginal={handleResetOriginal}
          onApplyPreset={handleApplyPreset}
          telemetry={telemetry}
          isProcessing={isProcessing}
        />
      </div>

      {/* Verified Samples Modal */}
      <SampleGalleryModal
        isOpen={isSamplesModalOpen}
        onClose={() => setIsSamplesModalOpen(false)}
        samples={samples}
        selectedSampleId={activeImageId}
        onSelectSample={loadSample}
      />

      {/* Scientific Integrity Standards Modal */}
      <ScientificIntegrityModal
        isOpen={isIntegrityModalOpen}
        onClose={() => setIsIntegrityModalOpen(false)}
      />

      {/* Export / Download Modal */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        imageId={activeImageId}
        dimensions={telemetry?.dimensions || uploadInfo?.dimensions}
        telemetry={telemetry}
        onExportImage={handleExportImage}
        onExportJson={handleExportJson}
      />

      {/* Scientific Telemetry & Metadata Drawer */}
      <MetadataDrawer
        isOpen={isTelemetryDrawerOpen}
        onClose={() => setIsTelemetryDrawerOpen(false)}
        telemetry={telemetry}
        uploadInfo={uploadInfo}
        onDownloadTelemetry={handleExportJson}
      />
    </div>
  );
};

export default App;
