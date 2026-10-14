import React, { useState, useRef } from 'react';
import { BarChart3, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import type { RadiometricStats } from '../types';

interface HistogramViewerProps {
  originalStats: RadiometricStats | null;
  enhancedStats: RadiometricStats | null;
}

interface MetricDefinition {
  name: string;
  unit: string;
  definition: string;
  significance: string;
}

const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
  dynamic_range: {
    name: 'Dynamic Range',
    unit: 'dB (Decibels)',
    definition: 'Radiometric span between darkest and brightest signal, normalized by standard deviation: 20 · log10((Max - Min + 1) / σ).',
    significance: 'Higher values reflect broader tonal separation between shadow floor and sunlit crater rim without banding.'
  },
  mean_radiance: {
    name: 'Mean Radiance',
    unit: 'DN (Digital Number, 0–255)',
    definition: 'Arithmetic mean of detector pixel values across the entire raster: Σ(DN) / N.',
    significance: 'Quantifies overall scene irradiance. In cold polar craters, raw mean radiance is typically under 25 DN.'
  },
  rms_contrast: {
    name: 'RMS Contrast (Std Dev)',
    unit: 'DN (Standard Deviation)',
    definition: 'Standard deviation of pixel intensities across all detector elements: sqrt(Σ(DN - μ)² / N).',
    significance: 'Measures spatial brightness variability; higher standard deviation reveals pronounced terrain relief.'
  },
  deep_shadow: {
    name: 'Deep Shadow (<15 DN)',
    unit: '% (Percentage of Total Pixels)',
    definition: 'Fraction of pixels situated near the sensor dark-current noise floor with Digital Number < 15.',
    significance: 'Quantifies how much of the frame remains obscured in deep shadow or permanently shadowed regions (PSRs).'
  },
  rim_saturation: {
    name: 'Rim Saturation (>240 DN)',
    unit: '% (Percentage of Total Pixels)',
    definition: 'Fraction of pixels approaching detector full-well saturation with Digital Number > 240.',
    significance: 'Alerts researchers when sunlit crater rims are blown out, which causes loss of fine topological crest features.'
  }
};

export const HistogramViewer: React.FC<HistogramViewerProps> = ({
  originalStats,
  enhancedStats
}) => {
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  if (!originalStats || !enhancedStats) {
    return (
      <div className="p-3 bg-obsidian-900 border-t border-obsidian-750 text-xs text-lunar-400 text-center font-mono select-none">
        Awaiting radiometric telemetry from image sensor...
      </div>
    );
  }

  const origBins = originalStats.histogram_256 || [];
  const enhBins = enhancedStats.histogram_256 || [];

  const svgWidth = 360;
  const svgHeight = 72;

  const buildPath = (bins: number[]): string => {
    if (bins.length === 0) return '';
    return bins
      .map((val, idx) => {
        const x = (idx / 255) * svgWidth;
        const y = svgHeight - (val / 100) * (svgHeight - 4);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const origPath = buildPath(origBins);
  const enhPath = buildPath(enhBins);

  const drDelta = (enhancedStats.dynamic_range_db - originalStats.dynamic_range_db).toFixed(1);
  const isDrPositive = parseFloat(drDelta) >= 0;

  // Handle mouse move across histogram to inspect specific bin
  const handleMouseMoveSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const binIndex = Math.min(255, Math.floor(relX * 256));
    setHoveredBin(binIndex);
  };

  const handleMouseLeaveSvg = () => {
    setHoveredBin(null);
  };

  return (
    <section
      aria-label="Radiometric Histogram and Photometric Telemetry"
      className="bg-obsidian-900 border-t border-obsidian-750 p-2.5 sm:p-3 select-none text-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Left: Dual 256-Bin Histogram Visualization */}
        <div className="flex-1 w-full lg:max-w-lg">
          <div className="flex items-center justify-between text-[10.5px] font-mono text-lunar-400 mb-1">
            <span className="flex items-center gap-1.5 text-lunar-200 font-semibold uppercase tracking-wider text-[10px]">
              <BarChart3 className="w-3.5 h-3.5 text-observatory-cyan" />
              Radiometric Intensity Histogram
              <span className="text-[9px] text-lunar-400 font-normal lowercase">(256 raw bins)</span>
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-lunar-400">
                <span className="w-2.5 h-0.5 bg-lunar-500 inline-block"></span>
                Raw Original
              </span>
              <span className="flex items-center gap-1 text-observatory-cyan font-medium">
                <span className="w-2.5 h-0.5 bg-observatory-cyan inline-block"></span>
                Enhanced Processed
              </span>
            </div>
          </div>

          {/* SVG Graph Container */}
          <div
            ref={svgContainerRef}
            className="relative h-20 bg-obsidian-950 rounded-md border border-obsidian-750 p-1 flex flex-col justify-between"
          >
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-15 overflow-visible cursor-crosshair"
              preserveAspectRatio="none"
              onMouseMove={handleMouseMoveSvg}
              onMouseLeave={handleMouseLeaveSvg}
              role="img"
              aria-label="256-bin intensity distribution curve comparison"
            >
              {/* Horizontal Gridlines */}
              <line x1="0" y1="18" x2={svgWidth} y2="18" stroke="#1c2433" strokeDasharray="2 2" />
              <line x1="0" y1="36" x2={svgWidth} y2="36" stroke="#1c2433" strokeDasharray="2 2" />
              <line x1="0" y1="54" x2={svgWidth} y2="54" stroke="#1c2433" strokeDasharray="2 2" />

              {/* Vertical Reference Lines at 64, 128, 192 DN */}
              <line x1={svgWidth * 0.25} y1="0" x2={svgWidth * 0.25} y2={svgHeight} stroke="#172030" strokeDasharray="2 2" />
              <line x1={svgWidth * 0.50} y1="0" x2={svgWidth * 0.50} y2={svgHeight} stroke="#263145" strokeDasharray="2 2" />
              <line x1={svgWidth * 0.75} y1="0" x2={svgWidth * 0.75} y2={svgHeight} stroke="#172030" strokeDasharray="2 2" />

              {/* Original Raw Curve */}
              <path
                d={origPath}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.2"
                strokeOpacity="0.85"
              />

              {/* Enhanced Processed Curve */}
              <path
                d={enhPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.6"
              />

              {/* Inspection cursor line on hover */}
              {hoveredBin !== null && (
                <line
                  x1={(hoveredBin / 255) * svgWidth}
                  y1="0"
                  x2={(hoveredBin / 255) * svgWidth}
                  y2={svgHeight}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="1 1"
                />
              )}
            </svg>

            {/* Hovered Bin Inspection Readout */}
            {hoveredBin !== null ? (
              <div className="flex justify-between items-center text-[8.5px] font-mono text-observatory-cyan bg-obsidian-900/90 px-1.5 py-0.2 rounded border border-obsidian-750">
                <span>DN: <strong>{hoveredBin}</strong></span>
                <span>Original: <strong>{(origBins[hoveredBin] || 0).toFixed(1)}%</strong></span>
                <span>Enhanced: <strong>{(enhBins[hoveredBin] || 0).toFixed(1)}%</strong></span>
              </div>
            ) : (
              <div className="flex justify-between text-[8px] font-mono text-lunar-500 px-0.5">
                <span>0 DN (Deep Shadow)</span>
                <span>64 DN</span>
                <span>128 DN (Midtone)</span>
                <span>192 DN</span>
                <span>255 DN (Rim Highlight)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actual Photometric Telemetry Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 w-full lg:w-auto text-[10.5px] font-mono">
          {/* Metric 1: Dynamic Range */}
          <div className="p-2 bg-obsidian-850 rounded-lg border border-obsidian-750 flex flex-col justify-between relative group">
            <div className="flex items-center justify-between text-[9.5px] text-lunar-400">
              <span className="truncate">Dynamic Range</span>
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'dynamic_range' ? null : 'dynamic_range')}
                aria-label="Info about Dynamic Range"
                className="text-lunar-500 hover:text-observatory-cyan focus:outline-none"
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lunar-100 font-bold text-xs">
                {enhancedStats.dynamic_range_db} <span className="text-[9px] font-normal text-lunar-400">dB</span>
              </span>
              <span className={`text-[9px] ${isDrPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                ({isDrPositive ? `+${drDelta}` : drDelta})
              </span>
            </div>
            {/* Tooltip */}
            {activeTooltip === 'dynamic_range' && (
              <div className="absolute z-50 bottom-full mb-1 left-0 w-56 p-2 bg-obsidian-950 border border-observatory-cyan/40 rounded shadow-xl text-[9.5px] text-lunar-200 font-sans">
                <div className="font-semibold text-white mb-0.5">{METRIC_DEFINITIONS.dynamic_range.name} ({METRIC_DEFINITIONS.dynamic_range.unit})</div>
                <p className="text-lunar-400 mb-1">{METRIC_DEFINITIONS.dynamic_range.definition}</p>
                <p className="text-emerald-300">{METRIC_DEFINITIONS.dynamic_range.significance}</p>
              </div>
            )}
          </div>

          {/* Metric 2: Mean Radiance */}
          <div className="p-2 bg-obsidian-850 rounded-lg border border-obsidian-750 flex flex-col justify-between relative group">
            <div className="flex items-center justify-between text-[9.5px] text-lunar-400">
              <span className="truncate">Mean Radiance</span>
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'mean_radiance' ? null : 'mean_radiance')}
                aria-label="Info about Mean Radiance"
                className="text-lunar-500 hover:text-observatory-cyan focus:outline-none"
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lunar-100 font-bold text-xs">
                {enhancedStats.mean_dn} <span className="text-[9px] font-normal text-lunar-400">DN</span>
              </span>
              <span className="text-lunar-500 text-[9px]">/ raw {originalStats.mean_dn}</span>
            </div>
            {/* Tooltip */}
            {activeTooltip === 'mean_radiance' && (
              <div className="absolute z-50 bottom-full mb-1 left-0 w-56 p-2 bg-obsidian-950 border border-observatory-cyan/40 rounded shadow-xl text-[9.5px] text-lunar-200 font-sans">
                <div className="font-semibold text-white mb-0.5">{METRIC_DEFINITIONS.mean_radiance.name} ({METRIC_DEFINITIONS.mean_radiance.unit})</div>
                <p className="text-lunar-400 mb-1">{METRIC_DEFINITIONS.mean_radiance.definition}</p>
                <p className="text-sky-300">{METRIC_DEFINITIONS.mean_radiance.significance}</p>
              </div>
            )}
          </div>

          {/* Metric 3: RMS Contrast / Std Dev */}
          <div className="p-2 bg-obsidian-850 rounded-lg border border-obsidian-750 flex flex-col justify-between relative group">
            <div className="flex items-center justify-between text-[9.5px] text-lunar-400">
              <span className="truncate">RMS Contrast (σ)</span>
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'rms_contrast' ? null : 'rms_contrast')}
                aria-label="Info about RMS Contrast"
                className="text-lunar-500 hover:text-observatory-cyan focus:outline-none"
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lunar-100 font-bold text-xs">
                {enhancedStats.std_dev} <span className="text-[9px] font-normal text-lunar-400">DN</span>
              </span>
              <span className="text-lunar-500 text-[9px]">/ raw {originalStats.std_dev}</span>
            </div>
            {/* Tooltip */}
            {activeTooltip === 'rms_contrast' && (
              <div className="absolute z-50 bottom-full mb-1 left-0 w-56 p-2 bg-obsidian-950 border border-observatory-cyan/40 rounded shadow-xl text-[9.5px] text-lunar-200 font-sans">
                <div className="font-semibold text-white mb-0.5">{METRIC_DEFINITIONS.rms_contrast.name} ({METRIC_DEFINITIONS.rms_contrast.unit})</div>
                <p className="text-lunar-400 mb-1">{METRIC_DEFINITIONS.rms_contrast.definition}</p>
                <p className="text-sky-300">{METRIC_DEFINITIONS.rms_contrast.significance}</p>
              </div>
            )}
          </div>

          {/* Metric 4: Deep Shadow (<15 DN) */}
          <div className="p-2 bg-obsidian-850 rounded-lg border border-obsidian-750 flex flex-col justify-between relative group">
            <div className="flex items-center justify-between text-[9.5px] text-lunar-400">
              <span className="truncate">Deep Shadow (&lt;15 DN)</span>
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'deep_shadow' ? null : 'deep_shadow')}
                aria-label="Info about Deep Shadow Metric"
                className="text-lunar-500 hover:text-observatory-cyan focus:outline-none"
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-observatory-cyan font-bold text-xs">
                {enhancedStats.shadow_pixel_pct}%
              </span>
              <span className="text-lunar-500 text-[9px]">/ raw {originalStats.shadow_pixel_pct}%</span>
            </div>
            {/* Tooltip */}
            {activeTooltip === 'deep_shadow' && (
              <div className="absolute z-50 bottom-full mb-1 left-0 w-56 p-2 bg-obsidian-950 border border-observatory-cyan/40 rounded shadow-xl text-[9.5px] text-lunar-200 font-sans">
                <div className="font-semibold text-white mb-0.5">{METRIC_DEFINITIONS.deep_shadow.name} ({METRIC_DEFINITIONS.deep_shadow.unit})</div>
                <p className="text-lunar-400 mb-1">{METRIC_DEFINITIONS.deep_shadow.definition}</p>
                <p className="text-emerald-300">{METRIC_DEFINITIONS.deep_shadow.significance}</p>
              </div>
            )}
          </div>

          {/* Metric 5: Rim Saturation (>240 DN) */}
          <div className="p-2 bg-obsidian-850 rounded-lg border border-obsidian-750 flex flex-col justify-between relative group">
            <div className="flex items-center justify-between text-[9.5px] text-lunar-400">
              <span className="truncate">Rim Saturation</span>
              <button
                type="button"
                onClick={() => setActiveTooltip(activeTooltip === 'rim_saturation' ? null : 'rim_saturation')}
                aria-label="Info about Rim Saturation Metric"
                className="text-lunar-500 hover:text-observatory-cyan focus:outline-none"
              >
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`font-bold text-xs ${
                  enhancedStats.highlight_saturated_pct > 8.0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {enhancedStats.highlight_saturated_pct}%
              </span>
              {enhancedStats.highlight_saturated_pct > 8.0 && (
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              )}
            </div>
            {/* Tooltip */}
            {activeTooltip === 'rim_saturation' && (
              <div className="absolute z-50 bottom-full mb-1 right-0 w-56 p-2 bg-obsidian-950 border border-observatory-cyan/40 rounded shadow-xl text-[9.5px] text-lunar-200 font-sans">
                <div className="font-semibold text-white mb-0.5">{METRIC_DEFINITIONS.rim_saturation.name} ({METRIC_DEFINITIONS.rim_saturation.unit})</div>
                <p className="text-lunar-400 mb-1">{METRIC_DEFINITIONS.rim_saturation.definition}</p>
                <p className="text-amber-300">{METRIC_DEFINITIONS.rim_saturation.significance}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
