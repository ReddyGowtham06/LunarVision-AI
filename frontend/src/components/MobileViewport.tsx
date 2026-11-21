import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Eye,
  Sliders,
  Layers,
  Check
} from 'lucide-react';
import type { ViewMode } from '../types';

interface MobileViewportProps {
  originalSrc: string;
  enhancedSrc: string;
  isProcessing: boolean;
  viewMode: 'split' | 'toggle';
  onViewModeChange?: (mode: 'split' | 'toggle') => void;
  title?: string;
  dimensions?: { width: number; height: number };
}

export const MobileViewport: React.FC<MobileViewportProps> = ({
  originalSrc,
  enhancedSrc,
  isProcessing,
  viewMode,
  onViewModeChange,
  title,
  dimensions
}) => {
  // Navigation & Zoom state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHoldingOriginal, setIsHoldingOriginal] = useState<boolean>(false);
  const [activeToggleView, setActiveToggleView] = useState<'enhanced' | 'original'>('enhanced');

  // Split slider state (0 to 100)
  const [sliderPos, setSliderPos] = useState<number>(50);

  // Touch tracking refs
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{
    dist: number;
    zoom: number;
    panX: number;
    panY: number;
    touchX: number;
    touchY: number;
    isSplitDrag: boolean;
  }>({
    dist: 0,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    touchX: 0,
    touchY: 0,
    isSplitDrag: false
  });

  const lastTapRef = useRef<number>(0);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setSliderPos(50);
  }, [originalSrc]);

  // Touch event handlers for pinch zoom & touch pan
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Pinch zoom start
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartRef.current = {
        dist,
        zoom,
        panX: pan.x,
        panY: pan.y,
        touchX: (t1.clientX + t2.clientX) / 2,
        touchY: (t1.clientY + t2.clientY) / 2,
        isSplitDrag: false
      };
    } else if (e.touches.length === 1) {
      const t = e.touches[0];

      // Double-tap detection
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Toggle between 1x and 2.5x
        if (zoom > 1.2) {
          setZoom(1.0);
          setPan({ x: 0, y: 0 });
        } else {
          setZoom(2.2);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      // Check if touching split slider divider in split mode
      if (viewMode === 'split' && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const touchXPercent = ((t.clientX - rect.left) / rect.width) * 100;
        // If touch is near the slider divider line (within 12%)
        if (Math.abs(touchXPercent - sliderPos) < 14) {
          touchStartRef.current.isSplitDrag = true;
          setSliderPos(Math.max(5, Math.min(95, touchXPercent)));
          return;
        }
      }

      touchStartRef.current = {
        dist: 0,
        zoom,
        panX: pan.x,
        panY: pan.y,
        touchX: t.clientX,
        touchY: t.clientY,
        isSplitDrag: false
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // Handle pinch zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const startDist = touchStartRef.current.dist;

      if (startDist > 0) {
        const scale = currentDist / startDist;
        const newZoom = Math.max(1.0, Math.min(4.5, touchStartRef.current.zoom * scale));
        setZoom(newZoom);
        if (newZoom === 1.0) {
          setPan({ x: 0, y: 0 });
        }
      }
    } else if (e.touches.length === 1) {
      const t = e.touches[0];

      if (touchStartRef.current.isSplitDrag && containerRef.current) {
        // Dragging the split comparison line
        const rect = containerRef.current.getBoundingClientRect();
        const touchXPercent = ((t.clientX - rect.left) / rect.width) * 100;
        setSliderPos(Math.max(5, Math.min(95, touchXPercent)));
      } else if (zoom > 1.05) {
        // Pan image when zoomed in
        const deltaX = t.clientX - touchStartRef.current.touchX;
        const deltaY = t.clientY - touchStartRef.current.touchY;
        const maxPanX = (zoom - 1) * 150;
        const maxPanY = (zoom - 1) * 150;

        setPan({
          x: Math.max(-maxPanX, Math.min(maxPanX, touchStartRef.current.panX + deltaX)),
          y: Math.max(-maxPanY, Math.min(maxPanY, touchStartRef.current.panY + deltaY))
        });
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current.isSplitDrag = false;
    touchStartRef.current.dist = 0;
  };

  // Helper for quick zoom step
  const handleZoomStep = (delta: number) => {
    setZoom((prev) => {
      const next = Math.max(1.0, Math.min(4.0, prev + delta));
      if (next === 1.0) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleFitReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Display source resolution & aspect
  const currentView = isHoldingOriginal
    ? originalSrc
    : activeToggleView === 'original'
    ? originalSrc
    : (enhancedSrc || originalSrc);

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* Viewport Top HUD */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0B0F14] border-b border-[#303944]/60 text-xs z-10">
        <div className="flex items-center space-x-2 truncate">
          <span className="w-2 h-2 rounded-full bg-[#D6B66F] shadow-[0_0_6px_#D6B66F]" />
          <span className="font-mono text-[11px] text-[#F4F6F8] truncate max-w-[170px]">
            {title || 'Lunar Observation'}
          </span>
          {dimensions && (
            <span className="text-[10px] font-mono text-[#9BA3AF] hidden xs:inline">
              {dimensions.width}×{dimensions.height}
            </span>
          )}
        </div>

        {/* Zoom Controls HUD */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleZoomStep(-0.5)}
            className="w-7 h-7 rounded-lg bg-[#303944]/60 text-[#9BA3AF] active:text-white active:bg-[#303944] flex items-center justify-center border border-[#303944]"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-[#D6B66F] px-1 min-w-[36px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoomStep(0.5)}
            className="w-7 h-7 rounded-lg bg-[#303944]/60 text-[#9BA3AF] active:text-white active:bg-[#303944] flex items-center justify-center border border-[#303944]"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoom > 1.05 && (
            <button
              onClick={handleFitReset}
              className="px-2 py-1 rounded-lg bg-[#303944] text-[#D6B66F] text-[10px] font-mono font-medium border border-[#D6B66F]/40 active:scale-95"
            >
              FIT
            </button>
          )}
        </div>
      </div>

      {/* Main Touch Canvas Area */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 relative overflow-hidden bg-black flex items-center justify-center touch-pan-zoom"
        style={{ minHeight: '260px' }}
      >
        {/* Processing Indicator Overlay */}
        {isProcessing && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="luxury-glass px-3 py-1 rounded-full text-[11px] font-mono text-[#D6B66F] flex items-center space-x-2 border border-[#D6B66F]/40 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#D6B66F] animate-ping" />
              <span>Computing 32-bit Micro-Relief...</span>
            </div>
          </div>
        )}

        {/* Image Rendering: Split Mode vs Single Toggle Mode */}
        {viewMode === 'split' ? (
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: zoom === 1.0 ? 'transform 0.15s ease' : 'none'
            }}
          >
            {/* Enhanced Image (Underneath) */}
            <img
              src={enhancedSrc || originalSrc}
              alt="Enhanced Lunar"
              className="max-h-full max-w-full w-auto h-auto object-contain select-none pointer-events-none drop-shadow-2xl"
              style={{ maxHeight: '100%', maxWidth: '100%' }}
              draggable={false}
            />

            {/* Original Image (Clipped overlay) */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img
                src={originalSrc}
                alt="Raw Lunar"
                className="max-h-full max-w-full w-auto h-auto object-contain select-none pointer-events-none drop-shadow-2xl"
                style={{ maxHeight: '100%', maxWidth: '100%' }}
                draggable={false}
              />
            </div>

            {/* Split Slider Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#D6B66F] z-20 pointer-events-none shadow-[0_0_8px_rgba(214,182,111,0.8)]"
              style={{ left: `${sliderPos}%` }}
            >
              {/* Touch Handle Pill */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#303944] border-2 border-[#D6B66F] flex items-center justify-center shadow-lg pointer-events-auto active:scale-110 transition-transform"
                onTouchStart={(e) => {
                  e.stopPropagation();
                  touchStartRef.current.isSplitDrag = true;
                }}
              >
                <span className="font-mono text-[9px] text-[#D6B66F] font-bold">◀▶</span>
              </div>
            </div>
          </div>
        ) : (
          /* Single Image View with Hold or Toggle */
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: zoom === 1.0 ? 'transform 0.15s ease' : 'none'
            }}
          >
            <img
              src={currentView}
              alt="Lunar Observation"
              className="max-h-full max-w-full w-auto h-auto object-contain select-none pointer-events-none drop-shadow-2xl"
              style={{ maxHeight: '100%', maxWidth: '100%' }}
              draggable={false}
            />
          </div>
        )}

        {/* Labels Overlay */}
        {viewMode === 'split' ? (
          <>
            <div className="absolute bottom-2 left-2 z-20 pointer-events-none">
              <span className="px-2 py-0.5 rounded bg-[#0B0F14]/80 border border-[#303944] text-[9px] font-mono text-[#9BA3AF] uppercase">
                Raw Input
              </span>
            </div>
            <div className="absolute bottom-2 right-2 z-20 pointer-events-none">
              <span className="px-2 py-0.5 rounded bg-[#0B0F14]/80 border border-[#D6B66F]/40 text-[9px] font-mono text-[#D6B66F] uppercase">
                32-Bit Master
              </span>
            </div>
          </>
        ) : (
          <div className="absolute bottom-2 right-2 z-20 pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-full bg-[#0B0F14]/85 border border-[#303944] text-[10px] font-mono text-[#D6B66F] uppercase">
              {activeToggleView === 'enhanced' ? 'Crater Enhanced' : 'Raw Sensor'}
            </span>
          </div>
        )}

        {/* Double-tap instruction hint (subtle, disappears when zoomed) */}
        {zoom === 1.0 && (
          <div className="absolute top-2 right-2 pointer-events-none opacity-40 text-[9px] font-mono text-[#9BA3AF]">
            Pinch / Double-tap zoom
          </div>
        )}
      </div>

      {/* Viewport Bottom Comparison Bar (Mobile-friendly toggle & Hold button) */}
      <div className="bg-[#10161E] border-t border-[#303944] px-3 py-2 flex items-center justify-between gap-2 z-10">
        {/* Toggle Mode: Split vs Full */}
        <div className="flex items-center space-x-1 bg-[#0B0F14] p-0.5 rounded-lg border border-[#303944]">
          <button
            onClick={() => onModeSelect('split')}
            className={`px-2.5 py-1.5 rounded text-[11px] font-medium flex items-center space-x-1 transition-all ${
              viewMode === 'split'
                ? 'bg-[#303944] text-[#D6B66F] border border-[#D6B66F]/30 shadow-sm'
                : 'text-[#9BA3AF] active:text-white'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Split</span>
          </button>
          <button
            onClick={() => onModeSelect('toggle')}
            className={`px-2.5 py-1.5 rounded text-[11px] font-medium flex items-center space-x-1 transition-all ${
              viewMode === 'toggle'
                ? 'bg-[#303944] text-[#D6B66F] border border-[#D6B66F]/30 shadow-sm'
                : 'text-[#9BA3AF] active:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Toggle</span>
          </button>
        </div>

        {/* When in Toggle Mode: Original / Enhanced switch & Hold to Compare */}
        {viewMode === 'toggle' ? (
          <div className="flex items-center space-x-1.5">
            <div className="flex bg-[#0B0F14] rounded-lg p-0.5 border border-[#303944]">
              <button
                onClick={() => setActiveToggleView('original')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${
                  activeToggleView === 'original'
                    ? 'bg-[#303944] text-[#F4F6F8] font-semibold'
                    : 'text-[#9BA3AF]'
                }`}
              >
                Raw
              </button>
              <button
                onClick={() => setActiveToggleView('enhanced')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${
                  activeToggleView === 'enhanced'
                    ? 'bg-[#D6B66F] text-[#0B0F14] font-semibold'
                    : 'text-[#9BA3AF]'
                }`}
              >
                Enhanced
              </button>
            </div>

            {/* Quick Hold to Compare button */}
            <button
              onMouseDown={() => setIsHoldingOriginal(true)}
              onMouseUp={() => setIsHoldingOriginal(false)}
              onTouchStart={() => setIsHoldingOriginal(true)}
              onTouchEnd={() => setIsHoldingOriginal(false)}
              className="px-2.5 py-1 rounded-lg bg-[#303944]/80 active:bg-[#303944] text-[#9BA3AF] active:text-white border border-[#303944] text-[10px] font-mono"
            >
              Hold Raw
            </button>
          </div>
        ) : (
          /* Split slider indicator */
          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-[#9BA3AF]">
            <span>Split:</span>
            <span className="text-[#D6B66F] font-semibold">{Math.round(sliderPos)}%</span>
            <button
              onClick={() => setSliderPos(50)}
              className="ml-1 px-1.5 py-0.5 rounded bg-[#303944] text-[10px] text-[#F4F6F8] hover:text-[#D6B66F]"
            >
              50/50
            </button>
          </div>
        )}
      </div>
    </div>
  );

  function onModeSelect(mode: 'split' | 'toggle') {
    if (onViewModeChange) onViewModeChange(mode);
  }
};
