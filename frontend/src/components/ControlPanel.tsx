import React, { useState } from 'react';
import {
  RotateCcw,
  Sliders,
  ShieldAlert,
  Activity,
  Wand2,
  SlidersHorizontal,
  Sparkles,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { EnhancementParameters, ProcessingTelemetry } from '../types';
import { ControlInfoTooltip } from './ControlInfoTooltip';

interface ControlPanelProps {
  params: EnhancementParameters;
  onChange: (params: EnhancementParameters) => void;
  onResetParams: () => void;
  onResetOriginal: () => void;
  onApplyPreset: (preset: Partial<EnhancementParameters>) => void;
  telemetry: ProcessingTelemetry | null;
  isProcessing: boolean;
}

export const PRESETS: {
  id: string;
  name: string;
  badge: string;
  description: string;
  params: Partial<EnhancementParameters>;
}[] = [
  {
    id: 'psr_shadow_recovery',
    name: 'Polar PSR Shadow Recovery',
    badge: 'PSRs & Ice Coldtraps',
    description: 'High shadow boost and CLAHE tuned for cold polar depressions (Hermite, Cabeus).',
    params: {
      brightness: 12,
      contrast: 1.35,
      gamma: 0.55,
      clahe_clip_limit: 3.8,
      clahe_grid_size: 8,
      shadow_boost: 65,
      denoise_strength: 12,
      denoise_method: 'bilateral',
      sharpen_strength: 0.8,
      sharpen_radius: 1.2
    }
  },
  {
    id: 'crater_rim_contrast',
    name: 'Crater Terraces & Rims',
    badge: 'Fault Scarps & Rims',
    description: 'Crisp unsharp masking and moderate CLAHE for impact melt and fault scarps (Tycho, Copernicus).',
    params: {
      brightness: 4,
      contrast: 1.25,
      gamma: 0.72,
      clahe_clip_limit: 2.8,
      clahe_grid_size: 8,
      shadow_boost: 40,
      denoise_strength: 8,
      denoise_method: 'bilateral',
      sharpen_strength: 1.1,
      sharpen_radius: 1.0
    }
  },
  {
    id: 'micro_crater_texture',
    name: 'Micro-Texture Detail',
    badge: 'Boulders & Regolith',
    description: 'Fine grid CLAHE with high spatial sharpening for boulder fields and regolith grain.',
    params: {
      brightness: 0,
      contrast: 1.2,
      gamma: 0.8,
      clahe_clip_limit: 3.2,
      clahe_grid_size: 16,
      shadow_boost: 30,
      denoise_strength: 6,
      denoise_method: 'bilateral',
      sharpen_strength: 1.4,
      sharpen_radius: 0.8
    }
  },
  {
    id: 'subtle_denoise',
    name: 'Scientific Film Denoise',
    badge: 'Apollo & Orbital Film',
    description: 'Edge-preserving smoothing for Apollo film scans and noisy high-gain orbital frames.',
    params: {
      brightness: 5,
      contrast: 1.1,
      gamma: 0.7,
      clahe_clip_limit: 2.2,
      clahe_grid_size: 8,
      shadow_boost: 35,
      denoise_strength: 18,
      denoise_method: 'bilateral',
      sharpen_strength: 0.5,
      sharpen_radius: 1.2
    }
  }
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onChange,
  onResetParams,
  onResetOriginal,
  onApplyPreset,
  telemetry,
  isProcessing
}) => {
  const [controlMode, setControlMode] = useState<'beginner' | 'advanced'>('beginner');
  const [lastAppliedPresetId, setLastAppliedPresetId] = useState<string | null>('psr_shadow_recovery');

  const update = <K extends keyof EnhancementParameters>(key: K, value: EnhancementParameters[K]) => {
    onChange({
      ...params,
      [key]: value
    });
  };

  // Check if current parameters match any preset
  const matchedPreset = PRESETS.find((preset) => {
    return Object.entries(preset.params).every(([k, v]) => {
      const currentVal = params[k as keyof EnhancementParameters];
      if (typeof v === 'number' && typeof currentVal === 'number') {
        return Math.abs(currentVal - v) < 0.01;
      }
      return currentVal === v;
    });
  });

  const activePresetId = matchedPreset ? matchedPreset.id : 'custom';

  const handleApplyPresetWithTracking = (preset: typeof PRESETS[0]) => {
    setLastAppliedPresetId(preset.id);
    onApplyPreset(preset.params);
  };

  const clipping = telemetry?.scientific_assessment.clipping_warning;
  const warningMsg = telemetry?.scientific_assessment.warning_message;

  return (
    <aside
      aria-label="Scientific Radiometric Control Panel"
      className="w-full lg:w-80 xl:w-96 bg-obsidian-900 border-l border-obsidian-750 flex flex-col h-full overflow-y-auto text-xs select-none"
    >
      {/* Panel Sticky Header */}
      <div className="p-3.5 border-b border-obsidian-750 flex items-center justify-between bg-obsidian-850 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-observatory-cyan" />
          <span className="font-semibold tracking-wider uppercase text-lunar-100 text-[11px]">
            Scientific Controls
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onResetOriginal}
            title="Reset to 100% Raw Unprocessed State"
            aria-label="Reset to Raw Unprocessed Image"
            className="flex items-center gap-1 px-2 py-1 bg-obsidian-800 hover:bg-obsidian-750 text-lunar-300 hover:text-white rounded border border-obsidian-700 transition text-[10px] focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
          >
            <span>Raw</span>
          </button>
          <button
            type="button"
            onClick={onResetParams}
            title="Reset parameters to calibrated default"
            aria-label="Reset parameters to default calibrated settings"
            className="flex items-center gap-1 px-2 py-1 bg-obsidian-800 hover:bg-obsidian-750 text-lunar-300 hover:text-white rounded border border-obsidian-700 transition text-[10px] focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="p-3.5 space-y-4">
        {/* Beginner vs Advanced Mode Selector */}
        <div
          role="radiogroup"
          aria-label="Control Mode Selection"
          className="grid grid-cols-2 p-1 bg-obsidian-950 rounded-lg border border-obsidian-750 gap-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={controlMode === 'beginner'}
            onClick={() => setControlMode('beginner')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md font-medium text-xs transition ${
              controlMode === 'beginner'
                ? 'bg-observatory-blue text-white shadow-sm'
                : 'text-lunar-400 hover:text-lunar-200 hover:bg-obsidian-850'
            } focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan`}
          >
            <Sparkles className="w-3.5 h-3.5 text-observatory-cyan" />
            <span>Beginner</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={controlMode === 'advanced'}
            onClick={() => setControlMode('advanced')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md font-medium text-xs transition ${
              controlMode === 'advanced'
                ? 'bg-observatory-blue text-white shadow-sm'
                : 'text-lunar-400 hover:text-lunar-200 hover:bg-obsidian-850'
            } focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-observatory-cyan" />
            <span>Advanced</span>
          </button>
        </div>

        {/* Scientific Presets Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-semibold tracking-wider uppercase text-lunar-400 flex items-center gap-1">
              <Wand2 className="w-3 h-3 text-observatory-cyan" />
              Scientific Presets
            </label>
            <span
              className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border ${
                activePresetId !== 'custom'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-obsidian-800 border-obsidian-700 text-lunar-400'
              }`}
            >
              {activePresetId !== 'custom'
                ? `Active: ${matchedPreset?.name}`
                : 'Custom Settings'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPresetWithTracking(preset)}
                  aria-pressed={isActive}
                  className={`text-left p-2 rounded border transition group relative ${
                    isActive
                      ? 'bg-observatory-blue/25 border-observatory-cyan text-white shadow-sm'
                      : 'bg-obsidian-850 hover:bg-obsidian-800 border-obsidian-750 hover:border-observatory-blue/50 text-lunar-200'
                  } focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-mono text-observatory-cyan truncate">
                      {preset.badge}
                    </span>
                    {isActive && (
                      <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <div className="font-medium text-[11px] group-hover:text-observatory-cyan truncate">
                    {preset.name}
                  </div>
                  <div className="text-[9.5px] text-lunar-400 truncate mt-0.5">
                    {preset.description}
                  </div>
                </button>
              );
            })}
          </div>

          {activePresetId === 'custom' && lastAppliedPresetId && (
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-lunar-400 px-1">
              <span>Slider values modified from preset</span>
              <button
                type="button"
                onClick={() => {
                  const p = PRESETS.find((item) => item.id === lastAppliedPresetId);
                  if (p) handleApplyPresetWithTracking(p);
                }}
                className="text-observatory-cyan hover:underline font-mono"
              >
                Re-apply preset
              </button>
            </div>
          )}
        </div>

        {/* Warning Banner if clipping detected */}
        {clipping && warningMsg && (
          <div
            role="alert"
            className="p-2.5 bg-amber-950/40 border border-amber-600/40 rounded flex items-start gap-2 text-amber-200 animate-fadeIn"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-tight">
              <span className="font-semibold block mb-0.5">Photometric Alert:</span>
              {warningMsg}
            </div>
          </div>
        )}

        {/* MODE A: BEGINNER CONTROLS */}
        {controlMode === 'beginner' && (
          <div className="space-y-3.5 bg-obsidian-850 p-3.5 rounded-lg border border-obsidian-750 animate-fadeIn">
            <div className="font-semibold text-lunar-300 uppercase tracking-wider text-[10px] flex justify-between items-center pb-2 border-b border-obsidian-800">
              <span className="flex items-center gap-1.5 text-observatory-cyan">
                <Sparkles className="w-3 h-3" />
                Beginner Radiometric Sliders
              </span>
              <span className="text-lunar-400 font-mono text-[9px]">Simplified 4-Factor Model</span>
            </div>

            {/* 1. Brightness */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-lunar-200 font-medium">Brightness</span>
                  <ControlInfoTooltip
                    title="Brightness Offset"
                    unit="DN"
                    description="Uniformly shifts the intensity of the entire image up or down by adding or subtracting digital numbers across all pixels."
                    onIncrease="Brightens the entire scene uniformly so dim terrain becomes lighter."
                    onDecrease="Darkens the whole image to reduce glare on sunlit highlands."
                    downside="Over-brightening turns empty dark space into murky gray and can wash out contrast without uncovering new details."
                  />
                </div>
                <span className="font-mono text-observatory-cyan">
                  {params.brightness > 0 ? `+${params.brightness}` : params.brightness} DN
                </span>
              </div>
              <input
                id="beginner-brightness"
                type="range"
                min="-60"
                max="60"
                step="1"
                aria-label="Brightness Offset"
                aria-valuemin={-60}
                aria-valuemax={60}
                aria-valuenow={params.brightness}
                aria-valuetext={`${params.brightness} digital numbers`}
                value={params.brightness}
                onChange={(e) => update('brightness', parseInt(e.target.value))}
                className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
              />
              <div className="flex justify-between text-[9px] text-lunar-500 font-mono">
                <span>-60 DN (Darker)</span>
                <span>0 DN (Neutral)</span>
                <span>+60 DN (Lighter)</span>
              </div>
            </div>

            {/* 2. Shadow Recovery */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-lunar-200 font-medium">Shadow Recovery</span>
                  <ControlInfoTooltip
                    title="Shadow Recovery (PSR Boost & Gamma Lift)"
                    unit="%"
                    description="Selectively expands dark digital numbers (<40 DN) inside permanently shadowed crater floors illuminated only by faint secondary reflection and Earthshine."
                    onIncrease="Lifts dark crater interiors so faint terrain features become visible."
                    onDecrease="Maintains high-contrast shadows in their raw, unprocessed state."
                    downside="High settings amplify sensor read noise, thermal grain, and compression artifacts in areas where very few genuine photons were captured."
                  />
                </div>
                <span className="font-mono text-observatory-cyan">{params.shadow_boost}%</span>
              </div>
              <input
                id="beginner-shadow-recovery"
                type="range"
                min="0"
                max="100"
                step="1"
                aria-label="Shadow Recovery"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={params.shadow_boost}
                aria-valuetext={`${params.shadow_boost} percent shadow boost`}
                value={params.shadow_boost}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  // Harmonize shadow_boost and gamma in beginner mode
                  const harmonizedGamma = Math.max(0.4, Number((1.0 - (val / 100) * 0.45).toFixed(2)));
                  onChange({
                    ...params,
                    shadow_boost: val,
                    gamma: harmonizedGamma
                  });
                }}
                className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
              />
              <div className="flex justify-between text-[9px] text-lunar-500 font-mono">
                <span>0% (Raw Shadows)</span>
                <span>50% (Balanced)</span>
                <span>100% (Maximum Lift)</span>
              </div>
            </div>

            {/* 3. Noise Reduction */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-lunar-200 font-medium">Noise Reduction</span>
                  <ControlInfoTooltip
                    title="Noise Reduction (Bilateral Smoothing)"
                    unit="σ"
                    description="Applies edge-preserving spatial filtering to suppress detector read noise and speckle while keeping crater rims crisp."
                    onIncrease="Smooths grainy detector noise in dark crater floors for a cleaner image."
                    onDecrease="Preserves raw sensor pixels and full unsoftened texture."
                    downside="Excessive noise reduction smudges subtle regolith grain and can erase tiny impact craters."
                  />
                </div>
                <span className="font-mono text-observatory-cyan">{params.denoise_strength.toFixed(0)}</span>
              </div>
              <input
                id="beginner-noise-reduction"
                type="range"
                min="0"
                max="25"
                step="1"
                aria-label="Noise Reduction Filter Strength"
                aria-valuemin={0}
                aria-valuemax={25}
                aria-valuenow={params.denoise_strength}
                aria-valuetext={`Noise reduction level ${params.denoise_strength}`}
                value={params.denoise_strength}
                onChange={(e) => update('denoise_strength', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
              />
              <div className="flex justify-between text-[9px] text-lunar-500 font-mono">
                <span>0 (Off)</span>
                <span>12 (Moderate)</span>
                <span>25 (Strong)</span>
              </div>
            </div>

            {/* 4. Detail */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-lunar-200 font-medium">Detail</span>
                  <ControlInfoTooltip
                    title="Detail (Acutance & Sharpening)"
                    unit="Factor"
                    description="Enhances fine geological boundaries, crater rims, central peaks, and boulder structures."
                    onIncrease="Makes topographical boundaries and crater edges stand out crisply."
                    onDecrease="Leaves edges soft and natural without sharpening halos."
                    downside="Over-sharpening introduces unnatural white ringing outlines along crater edges and amplifies high-frequency noise."
                  />
                </div>
                <span className="font-mono text-observatory-cyan">{params.sharpen_strength.toFixed(2)}x</span>
              </div>
              <input
                id="beginner-detail"
                type="range"
                min="0"
                max="2.0"
                step="0.05"
                aria-label="Detail Acutance Factor"
                aria-valuemin={0}
                aria-valuemax={2.0}
                aria-valuenow={params.sharpen_strength}
                aria-valuetext={`Detail multiplier ${params.sharpen_strength}`}
                value={params.sharpen_strength}
                onChange={(e) => update('sharpen_strength', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
              />
              <div className="flex justify-between text-[9px] text-lunar-500 font-mono">
                <span>0.00 (Smooth)</span>
                <span>1.00 (Standard)</span>
                <span>2.00 (Crisp)</span>
              </div>
            </div>
          </div>
        )}

        {/* MODE B: ADVANCED SCIENTIFIC CONTROLS */}
        {controlMode === 'advanced' && (
          <div className="space-y-4 animate-fadeIn">
            {/* SECTION 1: Tone & Photometry */}
            <div className="space-y-3 bg-obsidian-850 p-3 rounded-lg border border-obsidian-750">
              <div className="font-semibold text-lunar-300 uppercase tracking-wider text-[10px] flex justify-between items-center pb-1.5 border-b border-obsidian-800">
                <span>Tone &amp; Photometry</span>
                <span className="text-lunar-400 font-mono text-[9px]">Linear &amp; Power-Law</span>
              </div>

              {/* Gamma Correction */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lunar-300 font-medium">Gamma (γ)</span>
                    <ControlInfoTooltip
                      title="Power-Law Gamma (γ)"
                      unit="γ"
                      description="Non-linear power-law transform mapping input Digital Numbers via I_out = I_in^(1/γ)."
                      onIncrease="Values > 1.0 darken midtones and preserve highlight contrast on sunlit crater rims."
                      onDecrease="Values < 1.0 strongly expand faint shadows and dark crater floors."
                      downside="Values below 0.35 can cause tonal posterization and wash out midtone contrast."
                    />
                  </div>
                  <span className="font-mono text-observatory-cyan">{params.gamma.toFixed(2)}</span>
                </div>
                <input
                  id="adv-gamma"
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  aria-label="Gamma Correction Factor"
                  aria-valuemin={0.2}
                  aria-valuemax={2.5}
                  aria-valuenow={params.gamma}
                  aria-valuetext={`Gamma ${params.gamma.toFixed(2)}`}
                  value={params.gamma}
                  onChange={(e) => update('gamma', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
                />
                <div className="flex justify-between text-[9px] text-lunar-400 font-mono">
                  <span>0.20 (Boost Shadows)</span>
                  <span>1.00 (Linear)</span>
                  <span>2.50 (Compress)</span>
                </div>
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lunar-300 font-medium">Contrast Scale</span>
                    <ControlInfoTooltip
                      title="Contrast Multiplier"
                      unit="x"
                      description="Scales radiometric divergence away from the median 128 DN midtone level."
                      onIncrease="Increases tonal separation between illuminated walls and dark floors."
                      onDecrease="Flattens image dynamics toward neutral mid-gray."
                      downside="Aggressive contrast causes severe highlight blowout (DN=255) and shadow clipping (DN=0)."
                    />
                  </div>
                  <span className="font-mono text-observatory-cyan">{params.contrast.toFixed(2)}x</span>
                </div>
                <input
                  id="adv-contrast"
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.05"
                  aria-label="Contrast Scale"
                  aria-valuemin={0.2}
                  aria-valuemax={2.5}
                  aria-valuenow={params.contrast}
                  aria-valuetext={`Contrast multiplier ${params.contrast.toFixed(2)}`}
                  value={params.contrast}
                  onChange={(e) => update('contrast', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
                />
              </div>

              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lunar-300 font-medium">Brightness Offset</span>
                    <ControlInfoTooltip
                      title="Brightness Offset"
                      unit="DN"
                      description="Direct integer offset applied uniformly to all detector pixels across the array."
                      onIncrease="Lightens the overall scene uniformly."
                      onDecrease="Darkens the scene to suppress excessive glare."
                      downside="Does not recover lost dynamic range; lifting deep space produces gray background fog."
                    />
                  </div>
                  <span className="font-mono text-observatory-cyan">
                    {params.brightness > 0 ? `+${params.brightness}` : params.brightness} DN
                  </span>
                </div>
                <input
                  id="adv-brightness"
                  type="range"
                  min="-60"
                  max="60"
                  step="1"
                  aria-label="Brightness Offset"
                  aria-valuemin={-60}
                  aria-valuemax={60}
                  aria-valuenow={params.brightness}
                  aria-valuetext={`Brightness offset ${params.brightness} DN`}
                  value={params.brightness}
                  onChange={(e) => update('brightness', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
                />
              </div>
            </div>

            {/* SECTION 2: Shadow / PSR Boost */}
            <div className="space-y-2.5 bg-obsidian-850 p-3 rounded-lg border border-obsidian-750">
              <div className="font-semibold text-lunar-300 uppercase tracking-wider text-[10px] flex justify-between items-center pb-1 border-b border-obsidian-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-observatory-cyan inline-block"></span>
                  Polar PSR / Shadow Boost
                  <ControlInfoTooltip
                    title="Polar PSR Non-linear Curve Lift"
                    unit="%"
                    description="A custom non-linear tone transfer function specifically parameterized for permanently shadowed lunar craters (DN < 40), leaving sunlit crater rims unclipped."
                    onIncrease="Dramatically illuminates cold dark crater floors where secondary scattered photons reside."
                    onDecrease="Keeps shadows in their authentic astronomical state."
                    downside="Amplifies camera sensor read noise and quantization steps in regions with near-zero photon counts."
                  />
                </span>
                <span className="text-observatory-cyan font-mono text-[10px]">{params.shadow_boost}%</span>
              </div>
              <p className="text-[10px] text-lunar-400 leading-tight">
                Non-linear curve lift formulated for deep crater interiors ($DN &lt; 40$) without saturating sunlit rims.
              </p>
              <input
                id="adv-shadow-boost"
                type="range"
                min="0"
                max="100"
                step="1"
                aria-label="Polar PSR Shadow Boost Percentage"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={params.shadow_boost}
                aria-valuetext={`${params.shadow_boost} percent shadow boost`}
                value={params.shadow_boost}
                onChange={(e) => update('shadow_boost', parseInt(e.target.value))}
                className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
              />
            </div>

            {/* SECTION 3: CLAHE (Contrast Limited Adaptive Histogram Equalization) */}
            <div className="space-y-3 bg-obsidian-850 p-3 rounded-lg border border-obsidian-750">
              <div className="font-semibold text-lunar-300 uppercase tracking-wider text-[10px] flex justify-between items-center pb-1.5 border-b border-obsidian-800">
                <span>Adaptive Equalization (CLAHE)</span>
                <span className="text-lunar-400 font-mono text-[9px]">Local Histogram</span>
              </div>

              {/* Clip Limit */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lunar-300 font-medium">Clip Limit (Slope Threshold)</span>
                    <ControlInfoTooltip
                      title="CLAHE Clip Limit"
                      unit="Ratio"
                      description="Prevents histogram over-amplification by clipping cumulative histogram slope in local tiles before redistribution."
                      onIncrease="Boosts local micro-contrast on terrace benches and crater walls."
                      onDecrease="Applies subtle, artifact-free local equalization."
                      downside="High clip limits (>4.0) over-amplify noise in smooth lunar maria and produce noticeable edge halos."
                    />
                  </div>
                  <span className="font-mono text-observatory-cyan">{params.clahe_clip_limit.toFixed(1)}</span>
                </div>
                <input
                  id="adv-clahe-clip"
                  type="range"
                  min="0.1"
                  max="8.0"
                  step="0.1"
                  aria-label="CLAHE Clip Limit"
                  aria-valuemin={0.1}
                  aria-valuemax={8.0}
                  aria-valuenow={params.clahe_clip_limit}
                  aria-valuetext={`CLAHE clip limit ${params.clahe_clip_limit.toFixed(1)}`}
                  value={params.clahe_clip_limit}
                  onChange={(e) => update('clahe_clip_limit', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
                />
                <div className="flex justify-between text-[9px] text-lunar-400 font-mono">
                  <span>0.1 (Subtle)</span>
                  <span>2.5 (Standard)</span>
                  <span>8.0 (Maximum)</span>
                </div>
              </div>

              {/* Grid Size */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lunar-300 font-medium">Tile Grid Matrix</span>
                    <ControlInfoTooltip
                      title="CLAHE Tile Grid Dimensions"
                      unit="Tiles"
                      description="Partitions the image raster into an N×N grid of local contextual tiles for independent histogram equalization."
                      onIncrease="Finer grid (16×16, 24×24) reveals localized micro-craters, boulders, and ejecta blankets."
                      onDecrease="Coarser grid (4×4, 8×8) preserves broad regional lighting gradients."
                      downside="Extremely fine grids can cause checkerboard boundary artifacts on low-gradient slopes."
                    />
                  </div>
                  <span className="font-mono text-observatory-cyan">
                    {params.clahe_grid_size} × {params.clahe_grid_size}
                  </span>
                </div>
                <input
                  id="adv-clahe-grid"
                  type="range"
                  min="2"
                  max="24"
                  step="2"
                  aria-label="CLAHE Tile Grid Matrix Size"
                  aria-valuemin={2}
                  aria-valuemax={24}
                  aria-valuenow={params.clahe_grid_size}
                  aria-valuetext={`CLAHE grid size ${params.clahe_grid_size} by ${params.clahe_grid_size}`}
                  value={params.clahe_grid_size}
                  onChange={(e) => update('clahe_grid_size', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
                />
              </div>
            </div>

            {/* SECTION 4: Noise Suppression & Edge Preservation */}
            <div className="space-y-3 bg-obsidian-850 p-3 rounded-lg border border-obsidian-750">
              <div className="font-semibold text-lunar-300 uppercase tracking-wider text-[10px] flex justify-between items-center pb-1.5 border-b border-obsidian-800">
                <span className="flex items-center gap-1.5">
                  <span>Denoising Filter</span>
                  <ControlInfoTooltip
                    title="Denoising Algorithm & Filter Strength"
                    unit="σ"
                    description="Mathematical spatial filtering to eliminate sensor read noise, fixed pattern noise, and thermal dark current."
                    onIncrease="Subdues grain and speckle in dark crater floors."
                    onDecrease="Maintains raw detector pixel sharpness."
                    downside="Strong smoothing removes genuine sub-kilometer geological regolith texture and micro-impacts."
                  />
                </span>
                <span className="text-lunar-400 font-mono text-[9px]">Edge-Preserving</span>
              </div>

              {/* Denoise Method Selection */}
              <div className="grid grid-cols-3 gap-1" role="group" aria-label="Denoising Method">
                {(['bilateral', 'fast_nl_means', 'gaussian'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => update('denoise_method', method)}
                    aria-pressed={params.denoise_method === method}
                    className={`py-1 px-1.5 rounded text-[10px] text-center border font-mono transition ${
                      params.denoise_method === method
                        ? 'bg-observatory-blue/30 border-observatory-cyan text-observatory-cyan'
                        : 'bg-obsidian-800 border-obsidian-750 text-lunar-400 hover:text-lunar-200'
                    } focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan`}
                  >
                    {method === 'bilateral' ? 'Bilateral' : method === 'fast_nl_means' ? 'NL-Means' : 'Gaussian'}
                  </button>
                ))}
              </div>

              {/* Denoise Strength */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-lunar-300 font-medium">Filter Strength (σ)</span>
                  <span className="font-mono text-observatory-cyan">{params.denoise_strength.toFixed(0)}</span>
                </div>
                <input
                  id="adv-denoise-strength"
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  aria-label="Denoise Filter Strength"
                  aria-valuemin={0}
                  aria-valuemax={25}
                  aria-valuenow={params.denoise_strength}
                  aria-valuetext={`Denoise strength ${params.denoise_strength}`}
                  value={params.denoise_strength}
                  onChange={(e) => update('denoise_strength', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
                />
              </div>
            </div>

            {/* SECTION 5: Sharpening (Unsharp Mask) */}
            <div className="space-y-3 bg-obsidian-850 p-3 rounded-lg border border-obsidian-750">
              <div className="font-semibold text-lunar-300 uppercase tracking-wider text-[10px] flex justify-between items-center pb-1.5 border-b border-obsidian-800">
                <span className="flex items-center gap-1.5">
                  <span>Controlled Sharpening</span>
                  <ControlInfoTooltip
                    title="Unsharp Mask Sharpening"
                    unit="Factor"
                    description="High-frequency acutance enhancement that accentuates crater edges and scarp shadows by subtracting a blurred Gaussian mask."
                    onIncrease="Enhances ridge definition and ejecta blanket boundary lines."
                    onDecrease="Produces soft, natural topographic transitions."
                    downside="High amount or small radius creates prominent ringing halos around high-contrast crater boundaries."
                  />
                </span>
                <span className="text-lunar-400 font-mono text-[9px]">Unsharp Mask</span>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-lunar-300 font-medium">Acutance Amount</span>
                  <span className="font-mono text-observatory-cyan">{params.sharpen_strength.toFixed(2)}</span>
                </div>
                <input
                  id="adv-sharpen-strength"
                  type="range"
                  min="0"
                  max="2.0"
                  step="0.05"
                  aria-label="Sharpening Acutance Amount"
                  aria-valuemin={0}
                  aria-valuemax={2.0}
                  aria-valuenow={params.sharpen_strength}
                  aria-valuetext={`Sharpen strength ${params.sharpen_strength.toFixed(2)}`}
                  value={params.sharpen_strength}
                  onChange={(e) => update('sharpen_strength', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
                />
              </div>

              {/* Radius */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-lunar-300 font-medium">Filter Radius</span>
                  <span className="font-mono text-observatory-cyan">{params.sharpen_radius.toFixed(1)} px</span>
                </div>
                <input
                  id="adv-sharpen-radius"
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  aria-label="Sharpening Filter Radius"
                  aria-valuemin={0.5}
                  aria-valuemax={4.0}
                  aria-valuenow={params.sharpen_radius}
                  aria-valuetext={`Sharpen radius ${params.sharpen_radius.toFixed(1)} pixels`}
                  value={params.sharpen_radius}
                  onChange={(e) => update('sharpen_radius', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-obsidian-750 rounded-lg appearance-none cursor-pointer accent-observatory-cyan focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
                />
              </div>
            </div>

            {/* SECTION 6: Scientific Monochrome */}
            <div className="p-3 bg-obsidian-850 rounded-lg border border-obsidian-750 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-lunar-200 text-[11px]">Scientific Monochrome</span>
                  <ControlInfoTooltip
                    title="Monochrome Output"
                    description="Standardizes output as single-band optical reflectance, eliminating false color artifacts from consumer Bayer filters."
                    onIncrease="Pure physical optical reflectance."
                    onDecrease="Retains 3-channel CIE LAB color coordinates."
                    downside="Discards subtle multi-spectral mineral coloration."
                  />
                </div>
                <div className="text-[9.5px] text-lunar-400">Single-band reflectance representation</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={params.monochrome_output}
                aria-label="Toggle Scientific Monochrome"
                onClick={() => update('monochrome_output', !params.monochrome_output)}
                className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan ${
                  params.monochrome_output ? 'bg-observatory-blue' : 'bg-obsidian-750'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    params.monochrome_output ? 'left-4.5 translate-x-1' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* SECTION 7: Scientific Transparency & Planetary Geological Provenance */}
        <div className="p-3 bg-obsidian-950/90 rounded-lg border border-obsidian-750/80 space-y-2 text-[10px] text-lunar-300">
          <div className="flex items-center gap-1.5 text-observatory-cyan font-semibold uppercase tracking-wider text-[9.5px]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Scientific Transparency Notice</span>
          </div>
          <p className="leading-relaxed text-lunar-300 text-[9.5px]">
            This engine applies strictly <strong className="text-white">deterministic classical computer vision</strong> (OpenCV/NumPy). Zero synthetic pixels, textures, or craters are fabricated by generative AI models.
          </p>
          <div className="p-2 bg-amber-950/20 border border-amber-600/30 rounded text-amber-200 text-[9px] leading-tight">
            <strong>Planetary Research Caution:</strong> Enhanced visibility does <em>NOT</em> prove that genuine hidden geological terrain details have been authentically recovered. High enhancement gains near the noise floor ($DN &lt; 15$) can amplify sensor read noise, fixed pattern noise (FPN), and optical scatter. Always verify faint features against multi-observation temporal datasets.
          </div>
        </div>

        {/* Processing Latency HUD */}
        {telemetry && (
          <div className="p-2 bg-obsidian-850 border border-obsidian-750 rounded-md flex items-center justify-between font-mono text-[10px] text-lunar-400">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400" />
              Pipeline Execution Time
            </span>
            <span className="text-emerald-400 font-semibold">{telemetry.elapsed_ms} ms</span>
          </div>
        )}
      </div>
    </aside>
  );
};
