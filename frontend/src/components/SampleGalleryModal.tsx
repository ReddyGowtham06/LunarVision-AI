import React from 'react';
import { X, Check, Compass, Sparkles, MapPin, Sun } from 'lucide-react';
import type { VerifiedSample } from '../types';

interface SampleGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  samples: VerifiedSample[];
  selectedSampleId: string | null;
  onSelectSample: (sample: VerifiedSample) => void;
}

export const SampleGalleryModal: React.FC<SampleGalleryModalProps> = ({
  isOpen,
  onClose,
  samples,
  selectedSampleId,
  onSelectSample
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none">
      <div
        className="bg-obsidian-900 border border-obsidian-750 w-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden text-lunar-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sample-modal-title"
      >
        {/* Modal Header */}
        <div className="p-4 bg-obsidian-850 border-b border-obsidian-750 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-observatory-cyan" />
            <div>
              <h2 id="sample-modal-title" className="text-sm font-semibold text-lunar-100 uppercase tracking-wider">
                Verified Lunar Observations Catalog
              </h2>
              <p className="text-[11px] text-lunar-400">
                PDS-calibrated orbital imagery with known coordinates, solar elevation, and deep terrain shadows
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-lunar-400 hover:text-white rounded hover:bg-obsidian-750 transition focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Cards Grid */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {samples.map((sample) => {
              const isSelected = selectedSampleId === sample.id;
              const previewUrl = `/api/samples/${sample.id}/image`;

              return (
                <div
                  key={sample.id}
                  className={`flex flex-col bg-obsidian-850 rounded-lg border transition-all overflow-hidden ${
                    isSelected
                      ? 'border-observatory-cyan ring-1 ring-observatory-cyan/50 shadow-panel-hover'
                      : 'border-obsidian-750 hover:border-lunar-600'
                  }`}
                >
                  {/* Thumbnail Banner */}
                  <div className="relative h-44 bg-obsidian-950 overflow-hidden group">
                    <img
                      src={previewUrl}
                      alt={sample.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900 via-transparent to-transparent opacity-80" />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-obsidian-900/80 backdrop-blur-sm border border-obsidian-750 rounded text-[10px] font-mono text-observatory-cyan">
                      {sample.nasa_id}
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-white drop-shadow truncate">
                        {sample.target}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Content */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between text-xs space-y-3">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lunar-100 text-xs leading-snug">
                        {sample.title}
                      </h3>

                      <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono text-lunar-400">
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-observatory-cyan shrink-0" />
                          <span className="truncate">{sample.coordinates}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <Sun className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{sample.mission}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-lunar-300 line-clamp-3 leading-relaxed">
                        {sample.scientific_context}
                      </p>
                    </div>

                    {/* Attribution & Select CTA */}
                    <div className="pt-2 border-t border-obsidian-750 flex items-center justify-between gap-2">
                      <span className="text-[9.5px] text-lunar-500 font-mono truncate max-w-[55%]">
                        {sample.attribution}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectSample(sample);
                          onClose();
                        }}
                        aria-label={`Select and enhance ${sample.title}`}
                        className={`px-3 py-1.5 rounded text-[11px] font-medium flex items-center gap-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan ${
                          isSelected
                            ? 'bg-observatory-blue text-white shadow'
                            : 'bg-obsidian-750 hover:bg-observatory-blue/80 text-lunar-200 hover:text-white'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Currently Active</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-observatory-cyan" />
                            <span>Inspect &amp; Enhance</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="p-3 bg-obsidian-850 border-t border-obsidian-750 text-[10.5px] text-lunar-400 flex items-center justify-between">
          <span>Source: NASA Planetary Data System (PDS) &amp; Lunar Reconnaissance Orbiter Camera (LROC) Archive.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-obsidian-750 hover:bg-obsidian-700 text-lunar-200 rounded transition focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
