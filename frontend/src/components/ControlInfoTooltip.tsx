import React, { useState, useRef, useEffect } from 'react';
import { Info, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ControlInfoTooltipProps {
  title: string;
  description: string;
  onIncrease: string;
  onDecrease: string;
  downside: string;
  unit?: string;
  className?: string;
}

export const ControlInfoTooltip: React.FC<ControlInfoTooltipProps> = ({
  title,
  description,
  onIncrease,
  onDecrease,
  downside,
  unit,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onFocus={() => setIsOpen(true)}
        aria-label={`Learn more about ${title}`}
        aria-expanded={isOpen}
        className="p-0.5 text-lunar-400 hover:text-observatory-cyan focus:text-observatory-cyan rounded transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-1.5 w-68 sm:w-72 p-3 bg-obsidian-950/95 border border-observatory-cyan/40 rounded-lg shadow-2xl backdrop-blur-md text-lunar-200 text-[10.5px] leading-relaxed font-sans animate-fadeIn"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-obsidian-800">
            <span className="font-semibold text-white tracking-wide text-[11px] flex items-center gap-1">
              {title}
            </span>
            {unit && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-obsidian-850 text-observatory-cyan border border-obsidian-750">
                Unit: {unit}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-lunar-300 mb-2 leading-tight">
            {description}
          </p>

          {/* Directional Effects */}
          <div className="space-y-1 mb-2 bg-obsidian-900/80 p-1.5 rounded border border-obsidian-800 text-[10px]">
            <div className="flex items-start gap-1 text-emerald-300">
              <ArrowUpRight className="w-3 h-3 shrink-0 mt-0.5" />
              <span><strong className="text-emerald-200">Increasing:</strong> {onIncrease}</span>
            </div>
            <div className="flex items-start gap-1 text-sky-300">
              <ArrowDownRight className="w-3 h-3 shrink-0 mt-0.5" />
              <span><strong className="text-sky-200">Decreasing:</strong> {onDecrease}</span>
            </div>
          </div>

          {/* Potential Downside / Artifact */}
          <div className="flex items-start gap-1.5 p-1.5 bg-amber-950/30 border border-amber-600/30 rounded text-amber-200 text-[9.5px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300">Potential Artifact / Risk:</span> {downside}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
