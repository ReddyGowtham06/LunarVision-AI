import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Move,
  Columns,
  Split,
  Eye,
  Crosshair,
  Compass
} from 'lucide-react';
import type { ViewMode, ImageDimensions } from '../types';

interface ComparisonSliderProps {
  originalSrc: string | null;
  enhancedSrc: string | null;
  isProcessing: boolean;
  dimensions?: ImageDimensions;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  missionLabel?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalSrc,
  enhancedSrc,
  isProcessing,
  dimensions,
  viewMode,
  onViewModeChange,
  missionLabel
}) => {
  // Comparison split position (0 to 100%)
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Inspector coordinates
  const [cursorCoord, setCursorCoord] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.3, 8.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.3, 0.4));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const handleOneToOne = () => {
    setZoom(2.0);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => {
      const nextZoom = prev * zoomFactor;
      return Math.min(Math.max(nextZoom, 0.4), 8.0);
    });
  }, []);

  // Slider dragging logic
  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  // Pointer event handlers for slider
  const handlePointerDownSlider = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingSlider(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveSlider = (e: React.PointerEvent) => {
    if (isDraggingSlider) {
      handleSliderMove(e.clientX);
    }
  };

  const handlePointerUpSlider = () => {
    setIsDraggingSlider(false);
  };

  // Canvas Pan Handlers
  const handleMouseDownContainer = (e: React.MouseEvent) => {
    if (e.button === 0 && !isDraggingSlider) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMoveContainer = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }

    // Update pixel coordinate inspector
    if (containerRef.current && dimensions) {
      const rect = containerRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom + rect.width / 2;
      const relY = (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom + rect.height / 2;
      
      const normX = Math.round((relX / rect.width) * dimensions.width);
      const normY = Math.round((relY / rect.height) * dimensions.height);

      if (normX >= 0 && normX <= dimensions.width && normY >= 0 && normY <= dimensions.height) {
        setCursorCoord({ x: normX, y: normY });
      } else {
        setCursorCoord(null);
      }
    }
  };

  const handleMouseUpContainer = () => {
    setIsPanning(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === '0') handleResetView();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-' || e.key === '_') handleZoomOut();
      if (e.key === '1') onViewModeChange('split');
      if (e.key === '2') onViewModeChange('side_by_side');
      if (e.key === '3') onViewModeChange('enhanced_only');
      if (e.key === '4') onViewModeChange('original_only');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onViewModeChange]);

  if (!originalSrc) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-obsidian-950 observatory-grid select-none">
        <div className="text-center text-lunar-400 max-w-md p-8 border border-obsidian-750 bg-obsidian-900/80 rounded-lg shadow-panel">
          <Compass className="w-12 h-12 mx-auto text-observatory-cyan mb-4 animate-pulse" />
          <h3 className="text-base font-semibold text-lunar-100 uppercase tracking-wider mb-2">
            No Lunar Image Loaded
          </h3>
          <p className="text-xs text-lunar-400 mb-6 leading-relaxed">
            Select a verified NASA Lunar Reconnaissance Orbiter (LRO) crater sample or upload your own 8-bit/16-bit lunar imagery above to begin radiometric enhancement.
          </p>
        </div>
      </div>
    );
  }

  const effectiveEnhancedSrc = enhancedSrc || originalSrc;

  return (
    <div className="flex-1 flex flex-col h-full bg-obsidian-950 relative overflow-hidden select-none">
      {/* Top Viewport Navigation Bar */}
      <div className="h-10 bg-obsidian-900/90 border-b border-obsidian-750 px-4 flex items-center justify-between text-xs z-20 backdrop-blur-sm">
        {/* Left: View Mode Controls */}
        <div
          role="tablist"
          aria-label="Viewport Comparison Modes"
          className="flex items-center gap-1 bg-obsidian-850 p-0.5 rounded-md border border-obsidian-750"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'split'}
            onClick={() => onViewModeChange('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition text-[11px] ${
              viewMode === 'split'
                ? 'bg-observatory-blue/30 text-observatory-cyan border border-observatory-cyan/40 font-medium'
                : 'text-lunar-400 hover:text-lunar-200'
            } focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan`}
            title="Interactive Split Comparison Slider (Key: 1)"
          >
            <Split className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split Slider</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'side_by_side'}
            onClick={() => onViewModeChange('side_by_side')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition text-[11px] ${
              viewMode === 'side_by_side'
                ? 'bg-observatory-blue/30 text-observatory-cyan border border-observatory-cyan/40 font-medium'
                : 'text-lunar-400 hover:text-lunar-200'
            } focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan`}
            title="Dual Panel Side-by-Side View (Key: 2)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Side-by-Side</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'enhanced_only'}
            onClick={() => onViewModeChange('enhanced_only')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition text-[11px] ${
              viewMode === 'enhanced_only'
                ? 'bg-observatory-blue/30 text-observatory-cyan border border-observatory-cyan/40 font-medium'
                : 'text-lunar-400 hover:text-lunar-200'
            } focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan`}
            title="Full Enhanced View (Key: 3)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enhanced Only</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'original_only'}
            onClick={() => onViewModeChange('original_only')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition text-[11px] ${
              viewMode === 'original_only'
                ? 'bg-observatory-blue/30 text-observatory-cyan border border-observatory-cyan/40 font-medium'
                : 'text-lunar-400 hover:text-lunar-200'
            } focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan`}
            title="Raw Original View (Key: 4)"
          >
            <span className="hidden sm:inline">Raw Original</span>
            <span className="sm:hidden">Raw</span>
          </button>
        </div>

        {/* Center: Mission / Target Tag */}
        {missionLabel && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-obsidian-800 border border-obsidian-750 text-lunar-300 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>{missionLabel}</span>
          </div>
        )}

        {/* Right: Zoom & Inspection Toolbar */}
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-obsidian-850 p-0.5 rounded border border-obsidian-750 font-mono text-[11px]">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 hover:bg-obsidian-800 text-lunar-300 hover:text-white rounded transition focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
              title="Zoom Out (-)"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-lunar-200 min-w-12 text-center text-[10.5px]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 hover:bg-obsidian-800 text-lunar-300 hover:text-white rounded transition focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleOneToOne}
            className="px-2 py-1 bg-obsidian-850 hover:bg-obsidian-800 text-lunar-300 hover:text-white rounded border border-obsidian-750 text-[10.5px] font-mono transition focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
            title="1:1 Pixel Native View"
            aria-label="1:1 Pixel Native View"
          >
            1:1
          </button>

          <button
            type="button"
            onClick={handleResetView}
            className="p-1 bg-obsidian-850 hover:bg-obsidian-800 text-lunar-300 hover:text-white rounded border border-obsidian-750 transition focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
            title="Fit to Screen (Key: 0)"
            aria-label="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Observatory Display Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownContainer}
        onMouseMove={handleMouseMoveContainer}
        onMouseUp={handleMouseUpContainer}
        className={`flex-1 relative overflow-hidden flex items-center justify-center observatory-grid cursor-${
          isPanning ? 'grabbing' : 'crosshair'
        }`}
      >
        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute top-4 left-4 z-40 flex items-center gap-2 px-3 py-1.5 bg-obsidian-900/90 border border-observatory-cyan/50 text-observatory-cyan rounded-md shadow-lg backdrop-blur-md font-mono text-[11px] animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Computing Radiometric Transform...</span>
          </div>
        )}

        {/* View Mode 1: Split Comparison Slider */}
        {viewMode === 'split' && (
          <div
            className="relative transition-transform duration-75 ease-out select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Enhanced Image (Background Layer) */}
            <img
              ref={imageRef}
              src={effectiveEnhancedSrc}
              alt="Enhanced Lunar Surface"
              className="max-h-[75vh] max-w-[85vw] object-contain shadow-2xl rounded border border-obsidian-750 pointer-events-none"
              draggable={false}
            />

            {/* Original Image (Foreground Clipped Layer) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none rounded"
              style={{
                clipPath: `polygon(0% 0%, ${sliderPosition}% 0%, ${sliderPosition}% 100%, 0% 100%)`
              }}
            >
              <img
                src={originalSrc}
                alt="Original Raw Lunar Surface"
                className="max-h-[75vh] max-w-[85vw] object-contain pointer-events-none"
                draggable={false}
              />
            </div>

            {/* Draggable Divider Handle Line */}
            <div
              className="absolute top-0 bottom-0 z-30 cursor-ew-resize group"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              onPointerDown={handlePointerDownSlider}
              onPointerMove={handlePointerMoveSlider}
              onPointerUp={handlePointerUpSlider}
            >
              {/* Vertical Glowing Line */}
              <div className="w-0.5 h-full bg-observatory-cyan/80 shadow-[0_0_8px_rgba(56,189,248,0.8)] group-hover:bg-white transition-colors" />

              {/* Central Divider Handle Knob with keyboard accessibility */}
              <div
                tabIndex={0}
                role="slider"
                aria-label="Split comparison divider position"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(sliderPosition)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSliderPosition((prev) => Math.max(0, prev - 5));
                  } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSliderPosition((prev) => Math.min(100, prev + 5));
                  } else if (e.key === 'Home') {
                    e.preventDefault();
                    setSliderPosition(0);
                  } else if (e.key === 'End') {
                    e.preventDefault();
                    setSliderPosition(100);
                  }
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-obsidian-900/95 border border-observatory-cyan flex items-center justify-center shadow-slider-handle group-hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Move className="w-3.5 h-3.5 text-observatory-cyan" />
              </div>
            </div>

            {/* Left Label: Original */}
            <div
              className="absolute bottom-3 left-3 z-20 px-2.5 py-1 bg-obsidian-900/90 border border-obsidian-750 text-lunar-300 rounded font-mono text-[9.5px] backdrop-blur-sm pointer-events-none"
            >
              RAW ORIGINAL (CALIBRATED SENSOR RASTER)
            </div>

            {/* Right Label: Enhanced */}
            <div
              className="absolute bottom-3 right-3 z-20 px-2.5 py-1 bg-obsidian-900/90 border border-observatory-cyan/40 text-observatory-cyan rounded font-mono text-[9.5px] backdrop-blur-sm pointer-events-none"
            >
              ENHANCED (DETERMINISTIC CV PIPELINE)
            </div>
          </div>
        )}

        {/* View Mode 2: Side-by-Side Dual Panels */}
        {viewMode === 'side_by_side' && (
          <div
            className="flex flex-col md:flex-row gap-4 p-4 items-center justify-center transition-transform duration-75 select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            {/* Original Card */}
            <div className="relative border border-obsidian-750 rounded bg-obsidian-900 overflow-hidden shadow-panel">
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-obsidian-900/90 border border-obsidian-750 text-lunar-300 font-mono text-[9px] rounded">
                RAW UNPROCESSED SENSOR RASTER
              </div>
              <img
                src={originalSrc}
                alt="Raw Original Lunar Surface"
                className="max-h-[65vh] max-w-[40vw] object-contain pointer-events-none"
                draggable={false}
              />
            </div>

            {/* Enhanced Card */}
            <div className="relative border border-observatory-blue/40 rounded bg-obsidian-900 overflow-hidden shadow-panel">
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-obsidian-900/90 border border-observatory-cyan/50 text-observatory-cyan font-mono text-[9px] rounded">
                ENHANCED (DETERMINISTIC CV)
              </div>
              <img
                src={effectiveEnhancedSrc}
                alt="Enhanced Lunar Surface"
                className="max-h-[65vh] max-w-[40vw] object-contain pointer-events-none"
                draggable={false}
              />
            </div>
          </div>
        )}

        {/* View Mode 3: Enhanced Only */}
        {viewMode === 'enhanced_only' && (
          <div
            className="relative transition-transform duration-75 select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-obsidian-900/90 border border-observatory-cyan/40 text-observatory-cyan font-mono text-[9.5px] rounded">
              ENHANCED (DETERMINISTIC CV PIPELINE)
            </div>
            <img
              src={effectiveEnhancedSrc}
              alt="Enhanced Lunar Surface"
              className="max-h-[75vh] max-w-[85vw] object-contain rounded border border-obsidian-750 shadow-2xl pointer-events-none"
              draggable={false}
            />
          </div>
        )}

        {/* View Mode 4: Original Only */}
        {viewMode === 'original_only' && (
          <div
            className="relative transition-transform duration-75 select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-obsidian-900/90 border border-obsidian-750 text-lunar-300 font-mono text-[9.5px] rounded">
              RAW ORIGINAL (UNPROCESSED SENSOR RASTER)
            </div>
            <img
              src={originalSrc}
              alt="Raw Lunar Surface"
              className="max-h-[75vh] max-w-[85vw] object-contain rounded border border-obsidian-750 shadow-2xl pointer-events-none"
              draggable={false}
            />
          </div>
        )}

        {/* Inspector Coordinates HUD (Bottom-Left) */}
        {cursorCoord && dimensions && (
          <div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 bg-obsidian-900/90 border border-obsidian-750 text-lunar-300 rounded font-mono text-[10px] flex items-center gap-3 shadow backdrop-blur-sm pointer-events-none">
            <span className="flex items-center gap-1 text-observatory-cyan">
              <Crosshair className="w-3 h-3" />
              <span>X: {cursorCoord.x} px</span>
            </span>
            <span className="text-observatory-cyan">Y: {cursorCoord.y} px</span>
            <span className="text-lunar-400">Dim: {dimensions.width}×{dimensions.height}</span>
          </div>
        )}

        {/* Pan Helper Hint (Bottom-Right) */}
        <div className="absolute bottom-3 right-3 z-20 text-[9px] text-lunar-400 font-mono pointer-events-none hidden sm:block bg-obsidian-950/80 px-2 py-0.5 rounded border border-obsidian-800">
          Scroll to Zoom • Drag to Pan • Key 0 to Reset • Keys 1-4 for Views
        </div>
      </div>
    </div>
  );
};
