import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Sliders,
  Sparkles,
  Download,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Compass,
  CheckCircle2,
  AlertCircle,
  FileImage,
  ArrowRight,
  Info,
  Maximize2
} from 'lucide-react';
import type {
  EnhancementParameters,
  ProcessingTelemetry,
  UploadResponse,
  VerifiedSample,
  MobileTab,
  ExportFormat
} from '../types';
import { MobileViewport } from './MobileViewport';
import { apiService } from '../services/api';

interface MobileStudioProps {
  activeImageId: string | null;
  originalSrc: string | null;
  enhancedSrc: string | null;
  uploadInfo: UploadResponse | null;
  telemetry: ProcessingTelemetry | null;
  params: EnhancementParameters;
  activePreset: string;
  isProcessing: boolean;
  isUploading: boolean;
  isBackendHealthy: boolean;
  samples: VerifiedSample[];
  presets: Record<string, { name: string; subtitle: string; params: EnhancementParameters }>;
  onUpdateParam: <K extends keyof EnhancementParameters>(key: K, value: EnhancementParameters[K]) => void;
  onApplyPreset: (key: string) => void;
  onResetParams: () => void;
  onFileUpload: (file: File) => void;
  onLoadSample: (sample: VerifiedSample) => void;
}

export const MobileStudio: React.FC<MobileStudioProps> = ({
  activeImageId,
  originalSrc,
  enhancedSrc,
  uploadInfo,
  telemetry,
  params,
  activePreset,
  isProcessing,
  isUploading,
  isBackendHealthy,
  samples,
  presets,
  onUpdateParam,
  onApplyPreset,
  onResetParams,
  onFileUpload,
  onLoadSample
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('workspace');
  const [mobileViewMode, setMobileViewMode] = useState<'split' | 'toggle'>('split');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('PNG');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    if (!activeImageId) return;
    setIsDownloading(true);
    setDownloadSuccess(false);
    try {
      await apiService.downloadImageFile(activeImageId, exportFormat, enhancedSrc);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Mobile export failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0B0F14] text-[#F4F6F8] overflow-hidden select-none font-sans">
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.tif,.tiff"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onFileUpload(e.target.files[0]);
            setActiveTab('workspace');
          }
        }}
      />

      {/* Top Mobile Brand Bar */}
      <header className="h-12 bg-[#0B0F14] border-b border-[#303944] px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center space-x-2">
          {/* Eclipse Moon Brand Emblem */}
          <div className="w-6 h-6 rounded-full bg-[#303944] border border-[#D6B66F]/40 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#D6B66F] shadow-[0_0_6px_#D6B66F]" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-semibold tracking-[0.16em] text-xs text-[#F4F6F8] uppercase">
              LUNARVISION
            </span>
            <span className="font-mono text-[9px] text-[#D6B66F] tracking-wider uppercase font-semibold">
              STUDIO 2.0
            </span>
          </div>
        </div>

        {/* Right Status Badges & Quick Upload Button */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isBackendHealthy ? 'bg-emerald-400' : 'bg-[#D6B66F]'
            }`}
            title={isBackendHealthy ? 'Backend Engine Connected' : 'Standalone Client Engine'}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-full bg-[#303944] border border-[#303944] text-[#F4F6F8] active:bg-[#3D4855] text-[11px] font-medium flex items-center space-x-1.5"
            aria-label="Upload lunar image"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#D6B66F]" />
            <span>{isUploading ? 'Loading...' : 'Upload'}</span>
          </button>
        </div>
      </header>

      {/* Main Tab Screen Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* ================= TAB 1: WORKSPACE ================= */}
        {activeTab === 'workspace' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {originalSrc ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Viewport with Touch Navigation */}
                <div className="flex-1 overflow-hidden relative">
                  <MobileViewport
                    originalSrc={originalSrc}
                    enhancedSrc={enhancedSrc || originalSrc}
                    isProcessing={isProcessing}
                    viewMode={mobileViewMode}
                    onViewModeChange={setMobileViewMode}
                    title={uploadInfo?.title || uploadInfo?.filename}
                    dimensions={uploadInfo?.dimensions}
                  />
                </div>

                {/* Preset Strip directly under viewport for quick switching */}
                <div className="bg-[#10161E] border-t border-[#303944] px-3 py-2 shrink-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#D6B66F]">
                      Active Profile: {presets[activePreset]?.name || 'Custom'}
                    </span>
                    <button
                      onClick={() => setActiveTab('enhance')}
                      className="text-[10px] font-mono text-[#9BA3AF] hover:text-[#F4F6F8] flex items-center space-x-0.5"
                    >
                      <span>All Controls</span>
                      <ArrowRight className="w-2.5 h-2.5 ml-0.5 text-[#D6B66F]" />
                    </button>
                  </div>
                  <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
                    {Object.entries(presets).map(([key, p]) => {
                      const isSelected = activePreset === key;
                      return (
                        <button
                          key={key}
                          onClick={() => onApplyPreset(key)}
                          className={`px-3 py-1.5 rounded-xl text-left whitespace-nowrap shrink-0 border text-xs transition-all ${
                            isSelected
                              ? 'bg-[#303944] text-[#D6B66F] border-[#D6B66F]/50 shadow-sm font-semibold'
                              : 'bg-[#1C232B] text-[#9BA3AF] border-[#303944]/60 active:bg-[#303944]'
                          }`}
                        >
                          <div>{p.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* ================= MOBILE HOME SCREEN (Empty state) ================= */
              <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col justify-between">
                <div className="space-y-6 max-w-sm mx-auto w-full text-center pt-2">
                  {/* Premium Lunar Emblem */}
                  <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-b from-[#303944] to-[#0B0F14] border-2 border-[#D6B66F]/40 p-1 flex items-center justify-center shadow-[0_0_30px_rgba(214,182,111,0.15)]">
                    <div className="w-full h-full rounded-full bg-[#10161E] flex items-center justify-center relative overflow-hidden">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#D6B66F]/20 via-transparent to-white/10" />
                      <Sparkles className="w-8 h-8 text-[#D6B66F] absolute" />
                    </div>
                  </div>

                  <div>
                    <h1 className="text-lg font-semibold text-[#F4F6F8] tracking-wide">
                      LunarVision AI Studio
                    </h1>
                    <p className="text-xs text-[#9BA3AF] mt-1.5 leading-relaxed">
                      Scientific image enhancement for dark craters, permanently shadowed regions (PSRs), and telescopic moon astrophotography.
                    </p>
                  </div>

                  {/* Prominent Upload Button */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3.5 px-4 rounded-2xl bg-[#D6B66F] text-[#0B0F14] font-semibold text-sm flex items-center justify-center space-x-2 shadow-[0_4px_16px_rgba(214,182,111,0.3)] active:scale-[0.98] transition-transform"
                    >
                      <UploadCloud className="w-5 h-5 text-[#0B0F14]" />
                      <span>Upload Lunar Image</span>
                    </button>
                    <p className="text-[11px] text-[#9BA3AF] font-mono">
                      Accepts JPG, PNG, or 16-Bit Scientific TIFF
                    </p>
                  </div>

                  {/* Upload Instructions */}
                  <div className="p-3.5 rounded-2xl bg-[#161D27] border border-[#303944] text-left space-y-1.5 text-xs">
                    <div className="text-[11px] font-mono uppercase text-[#D6B66F] font-semibold flex items-center space-x-1">
                      <Info className="w-3 h-3" />
                      <span>Enhancement Capabilities</span>
                    </div>
                    <ul className="text-[11px] text-[#9BA3AF] space-y-1 list-disc list-inside">
                      <li>32-bit floating point micro-relief bandpass</li>
                      <li>3-Zone 0.00 DN pure cosmic background masking</li>
                      <li>Zero synthetic AI hallucinations — deterministic CV</li>
                    </ul>
                  </div>
                </div>

                {/* Quick Verified Samples Section */}
                <div className="pt-6 max-w-sm mx-auto w-full">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#9BA3AF]">
                      Or Explore Verified NASA Targets
                    </span>
                    <button
                      onClick={() => setActiveTab('targets')}
                      className="text-[10px] font-mono text-[#D6B66F] hover:underline"
                    >
                      View All ({samples.length})
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {samples.slice(0, 2).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onLoadSample(s)}
                        className="p-3 rounded-2xl bg-[#161D27] border border-[#303944] text-left active:border-[#D6B66F] transition-colors"
                      >
                        <div className="text-xs font-medium text-[#F4F6F8] truncate">{s.title}</div>
                        <div className="text-[10px] font-mono text-[#D6B66F] mt-0.5 truncate">
                          {s.target_region || s.mission}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: ENHANCE CONTROLS ================= */}
        {activeTab === 'enhance' && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {/* Header with Quick Reset */}
            <div className="flex items-center justify-between pb-2 border-b border-[#303944]">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F4F6F8]">
                  Enhancement Controls
                </h2>
                <p className="text-[11px] text-[#9BA3AF]">Essential grading & micro-relief</p>
              </div>
              <button
                onClick={onResetParams}
                className="px-3 py-1.5 rounded-full bg-[#1C232B] border border-[#303944] text-[11px] font-mono text-[#9BA3AF] active:text-white flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Presets Row */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#D6B66F] font-semibold">
                Grading Presets
              </span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(presets).map(([key, p]) => {
                  const isSelected = activePreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => onApplyPreset(key)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        isSelected
                          ? 'bg-[#303944] text-[#D6B66F] border-[#D6B66F] shadow-sm'
                          : 'bg-[#161D27] text-[#F4F6F8] border-[#303944]'
                      }`}
                    >
                      <div className="text-xs font-semibold truncate">{p.name}</div>
                      <div className="text-[10px] text-[#9BA3AF] mt-0.5 truncate">{p.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Essential Controls */}
            <div className="space-y-4 pt-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#D6B66F] font-semibold">
                Essential Adjustments
              </span>

              {/* Brightness */}
              <div className="p-3.5 rounded-2xl bg-[#161D27] border border-[#303944] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#F4F6F8] font-medium">Brightness</span>
                  <span className="font-mono text-[#D6B66F] font-semibold">
                    {params.brightness > 0 ? `+${params.brightness}` : params.brightness}
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={params.brightness}
                  onChange={(e) => onUpdateParam('brightness', parseFloat(e.target.value))}
                  className="mobile-touch-slider"
                />
              </div>

              {/* Contrast */}
              <div className="p-3.5 rounded-2xl bg-[#161D27] border border-[#303944] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#F4F6F8] font-medium">Contrast</span>
                  <span className="font-mono text-[#D6B66F] font-semibold">
                    {params.contrast.toFixed(2)}×
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.02"
                  value={params.contrast}
                  onChange={(e) => onUpdateParam('contrast', parseFloat(e.target.value))}
                  className="mobile-touch-slider"
                />
              </div>

              {/* Sharpness */}
              <div className="p-3.5 rounded-2xl bg-[#161D27] border border-[#303944] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#F4F6F8] font-medium">Sharpness</span>
                  <span className="font-mono text-[#D6B66F] font-semibold">
                    {params.sharpen_strength.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.05"
                  value={params.sharpen_strength}
                  onChange={(e) => onUpdateParam('sharpen_strength', parseFloat(e.target.value))}
                  className="mobile-touch-slider"
                />
              </div>

              {/* Noise Reduction */}
              <div className="p-3.5 rounded-2xl bg-[#161D27] border border-[#303944] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#F4F6F8] font-medium">Noise Reduction</span>
                  <span className="font-mono text-[#D6B66F] font-semibold">
                    {params.denoise_strength}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={params.denoise_strength}
                  onChange={(e) => onUpdateParam('denoise_strength', parseFloat(e.target.value))}
                  className="mobile-touch-slider"
                />
              </div>
            </div>

            {/* Collapsible Advanced Settings */}
            <div className="rounded-2xl border border-[#303944] bg-[#161D27] overflow-hidden">
              <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-[#F4F6F8] bg-[#1C232B] border-b border-[#303944]"
              >
                <span className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-[#D6B66F]" />
                  <span>Advanced Radiometric Settings</span>
                </span>
                {isAdvancedOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#9BA3AF]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#9BA3AF]" />
                )}
              </button>

              {isAdvancedOpen && (
                <div className="p-4 space-y-4">
                  {/* Crater Clarity (Micro-Relief) */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#F4F6F8]">Crater Clarity (Micro-Relief)</span>
                      <span className="font-mono text-[#D6B66F] font-semibold">
                        {params.crater_clarity.toFixed(2)}×
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.05"
                      value={params.crater_clarity}
                      onChange={(e) => onUpdateParam('crater_clarity', parseFloat(e.target.value))}
                      className="mobile-touch-slider"
                    />
                  </div>

                  {/* Adaptive CLAHE Clip Limit */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#F4F6F8]">Adaptive CLAHE Clip</span>
                      <span className="font-mono text-[#D6B66F]">
                        {params.clahe_clip_limit.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="8.0"
                      step="0.1"
                      value={params.clahe_clip_limit}
                      onChange={(e) => onUpdateParam('clahe_clip_limit', parseFloat(e.target.value))}
                      className="mobile-touch-slider"
                    />
                  </div>

                  {/* Power-Law Gamma */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#F4F6F8]">Power-Law Gamma (γ)</span>
                      <span className="font-mono text-[#D6B66F]">{params.gamma.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="2.2"
                      step="0.02"
                      value={params.gamma}
                      onChange={(e) => onUpdateParam('gamma', parseFloat(e.target.value))}
                      className="mobile-touch-slider"
                    />
                  </div>

                  {/* Shadow Boost */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#F4F6F8]">Shadow / Crater Floor Lift</span>
                      <span className="font-mono text-[#D6B66F]">{params.shadow_boost}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={params.shadow_boost}
                      onChange={(e) => onUpdateParam('shadow_boost', parseFloat(e.target.value))}
                      className="mobile-touch-slider"
                    />
                  </div>

                  {/* 3-Zone Space Background Cleanup Switch */}
                  <div className="pt-2 border-t border-[#303944] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-[#F4F6F8]">3-Zone 0.00 DN Masking</div>
                      <p className="text-[10px] text-[#9BA3AF]">Pure black space background</p>
                    </div>
                    <button
                      onClick={() => onUpdateParam('space_bg_cleanup', !(params.space_bg_cleanup ?? true))}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center ${
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

                  {/* Monochrome View Switch */}
                  <div className="pt-2 border-t border-[#303944] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-[#F4F6F8]">Single-Band Monochrome</div>
                      <p className="text-[10px] text-[#9BA3AF]">Calibrated albedo view</p>
                    </div>
                    <button
                      onClick={() => onUpdateParam('monochrome_output', !params.monochrome_output)}
                      className={`px-3 py-1 rounded-full text-[10px] font-mono border ${
                        params.monochrome_output
                          ? 'bg-[#D6B66F] text-[#0B0F14] font-semibold border-[#D6B66F]'
                          : 'bg-[#1C232B] text-[#9BA3AF] border-[#303944]'
                      }`}
                    >
                      {params.monochrome_output ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick action to jump back to workspace */}
            <div className="pt-2">
              <button
                onClick={() => setActiveTab('workspace')}
                className="w-full py-3 rounded-2xl bg-[#303944] text-[#F4F6F8] font-medium text-xs flex items-center justify-center space-x-1.5 active:bg-[#3D4855]"
              >
                <Eye className="w-4 h-4 text-[#D6B66F]" />
                <span>Return to Image Workspace</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 3: TARGETS GALLERY ================= */}
        {activeTab === 'targets' && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="border-b border-[#303944] pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F4F6F8]">
                Verified NASA Targets
              </h2>
              <p className="text-[11px] text-[#9BA3AF]">LRO & Apollo scientific lunar catalog</p>
            </div>

            <div className="space-y-2.5">
              {samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onLoadSample(s);
                    setActiveTab('workspace');
                  }}
                  className="w-full p-3.5 rounded-2xl bg-[#161D27] border border-[#303944] text-left active:border-[#D6B66F] transition-all space-y-1 block"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F4F6F8]">{s.title}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#303944] text-[#D6B66F]">
                      {s.mission ? s.mission.split('(')[0] : 'NASA'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#D6B66F]">
                    {s.target_region || s.target}
                  </div>
                  <p className="text-[11px] text-[#9BA3AF] line-clamp-2 leading-relaxed">
                    {s.description || s.scientific_context}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: EXPORT ================= */}
        {activeTab === 'export' && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            <div className="border-b border-[#303944] pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F4F6F8]">
                Export Master Image
              </h2>
              <p className="text-[11px] text-[#9BA3AF]">Preserves full scientific resolution</p>
            </div>

            {/* Target Summary Card */}
            <div className="p-4 rounded-2xl bg-[#161D27] border border-[#303944] space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-black border border-[#303944] overflow-hidden flex items-center justify-center shrink-0">
                  {enhancedSrc || originalSrc ? (
                    <img
                      src={enhancedSrc || originalSrc || ''}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileImage className="w-6 h-6 text-[#9BA3AF]" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-[#F4F6F8] truncate">
                    {uploadInfo?.title || uploadInfo?.filename || 'Current Lunar Target'}
                  </div>
                  <div className="text-[10px] font-mono text-[#D6B66F] mt-0.5">
                    {uploadInfo?.dimensions ? `${uploadInfo.dimensions.width} × ${uploadInfo.dimensions.height} px (${uploadInfo.dimensions.megapixels || 1.0} MP)` : 'Standard Resolution'}
                  </div>
                </div>
              </div>

              {telemetry && (
                <div className="pt-2 border-t border-[#303944]/60 grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-[#1C232B] p-2 rounded-lg">
                    <span className="text-[#9BA3AF] block">DYNAMIC RANGE:</span>
                    <span className="text-[#D6B66F] font-semibold">
                      {telemetry.enhanced_stats.dynamic_range_db} dB
                    </span>
                  </div>
                  <div className="bg-[#1C232B] p-2 rounded-lg">
                    <span className="text-[#9BA3AF] block">PROCESSING TIME:</span>
                    <span className="text-emerald-400 font-semibold">{telemetry.elapsed_ms} ms</span>
                  </div>
                </div>
              )}
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#D6B66F] font-semibold">
                Export Format
              </span>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { fmt: 'PNG', label: 'Lossless', sub: 'Original Master' },
                  { fmt: 'JPEG', label: 'Q98 High', sub: 'Compressed' },
                  { fmt: 'TIFF', label: '16-Bit', sub: 'Archival' }
                ] as const).map(({ fmt, label, sub }) => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      exportFormat === fmt
                        ? 'bg-[#303944] border-[#D6B66F] text-[#D6B66F] shadow-sm font-semibold'
                        : 'bg-[#161D27] border-[#303944] text-[#F4F6F8] active:bg-[#1C232B]'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">{fmt}</div>
                    <div className="text-[10px] text-[#9BA3AF] mt-0.5">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Download Button */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownload}
                disabled={!activeImageId || isDownloading}
                className="w-full py-4 px-4 rounded-2xl bg-[#D6B66F] text-[#0B0F14] font-semibold text-sm flex items-center justify-center space-x-2 shadow-[0_4px_16px_rgba(214,182,111,0.3)] disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                <Download className="w-5 h-5" />
                <span>
                  {isDownloading
                    ? 'Generating Master...'
                    : `Download Enhanced ${exportFormat} Image`}
                </span>
              </button>

              {downloadSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Master image downloaded successfully!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ================= FIXED MOBILE BOTTOM NAVIGATION ================= */}
      <nav className="h-16 bg-[#161D27] border-t border-[#303944] px-2 flex items-center justify-around shrink-0 z-40 pb-safe">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex-1 py-1 flex flex-col items-center justify-center space-y-1 transition-all ${
            activeTab === 'workspace' ? 'text-[#D6B66F]' : 'text-[#9BA3AF] active:text-[#F4F6F8]'
          }`}
          aria-label="Workspace"
        >
          <Eye className={`w-5 h-5 ${activeTab === 'workspace' ? 'stroke-[2.2]' : ''}`} />
          <span className="text-[10px] font-medium tracking-wide">Workspace</span>
        </button>

        <button
          onClick={() => setActiveTab('enhance')}
          className={`flex-1 py-1 flex flex-col items-center justify-center space-y-1 transition-all ${
            activeTab === 'enhance' ? 'text-[#D6B66F]' : 'text-[#9BA3AF] active:text-[#F4F6F8]'
          }`}
          aria-label="Enhance"
        >
          <Sliders className={`w-5 h-5 ${activeTab === 'enhance' ? 'stroke-[2.2]' : ''}`} />
          <span className="text-[10px] font-medium tracking-wide">Enhance</span>
        </button>

        <button
          onClick={() => setActiveTab('targets')}
          className={`flex-1 py-1 flex flex-col items-center justify-center space-y-1 transition-all ${
            activeTab === 'targets' ? 'text-[#D6B66F]' : 'text-[#9BA3AF] active:text-[#F4F6F8]'
          }`}
          aria-label="Targets"
        >
          <Compass className={`w-5 h-5 ${activeTab === 'targets' ? 'stroke-[2.2]' : ''}`} />
          <span className="text-[10px] font-medium tracking-wide">Targets</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-1 flex flex-col items-center justify-center space-y-1 transition-all ${
            activeTab === 'export' ? 'text-[#D6B66F]' : 'text-[#9BA3AF] active:text-[#F4F6F8]'
          }`}
          aria-label="Export"
        >
          <Download className={`w-5 h-5 ${activeTab === 'export' ? 'stroke-[2.2]' : ''}`} />
          <span className="text-[10px] font-medium tracking-wide">Export</span>
        </button>
      </nav>
    </div>
  );
};

