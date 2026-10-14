import React, { useRef } from 'react';
import {
  Moon,
  Upload,
  Compass,
  Download,
  Activity,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  onOpenSamples: () => void;
  onOpenUpload?: () => void;
  onOpenTelemetry: () => void;
  onOpenIntegrity: () => void;
  onOpenDownload: () => void;
  onFileSelected: (file: File) => void;
  isBackendHealthy: boolean;
  sampleCount: number;
  hasActiveImage: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSamples,
  onOpenTelemetry,
  onOpenIntegrity,
  onOpenDownload,
  onFileSelected,
  isBackendHealthy,
  sampleCount,
  hasActiveImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <header className="h-14 bg-obsidian-900 border-b border-obsidian-750 px-4 flex items-center justify-between z-30 select-none">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.tif,.tiff,.bmp,.webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Brand & Mission Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-obsidian-850 border border-observatory-blue/50 flex items-center justify-center text-observatory-cyan shadow-panel">
          <Moon className="w-4 h-4 fill-observatory-cyan/20" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide text-lunar-50 uppercase font-sans">
              LunarVision <span className="text-observatory-cyan">AI</span>
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-obsidian-800 border border-obsidian-700 text-lunar-400 font-mono text-[9px]">
              OBSERVATORY v1.0
            </span>
          </div>
          <div className="text-[10px] text-lunar-400 font-mono hidden md:block">
            Scientific Radiometric Enhancement Engine • Polar PSRs &amp; Impact Craters
          </div>
        </div>
      </div>

      {/* Middle & Right Action Controls */}
      <div className="flex items-center gap-2 text-xs">
        {/* Verified Sample Gallery Button */}
        <button
          type="button"
          onClick={onOpenSamples}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-obsidian-850 hover:bg-obsidian-800 text-lunar-200 border border-obsidian-750 hover:border-observatory-blue/60 transition shadow-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
          title="Browse verified NASA Lunar Reconnaissance Orbiter & Apollo crater observations"
          aria-label="Browse verified NASA Lunar Reconnaissance Orbiter and Apollo crater observations"
        >
          <Compass className="w-3.5 h-3.5 text-observatory-cyan" />
          <span className="font-medium hidden sm:inline">Verified Samples</span>
          <span className="px-1.5 py-0.2 rounded-full bg-obsidian-750 text-observatory-cyan text-[10px] font-mono">
            {sampleCount}
          </span>
        </button>

        {/* Upload Custom Image Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-obsidian-850 hover:bg-obsidian-800 text-lunar-200 border border-obsidian-750 hover:border-observatory-blue/60 transition shadow-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
          title="Upload JPG, PNG, or 16-bit TIFF scientific lunar frame"
          aria-label="Upload JPG, PNG, or 16-bit TIFF scientific lunar frame"
        >
          <Upload className="w-3.5 h-3.5 text-observatory-cyan" />
          <span className="font-medium hidden sm:inline">Upload Image</span>
        </button>

        {/* Scientific Integrity Info Badge */}
        <button
          type="button"
          onClick={onOpenIntegrity}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-obsidian-850 hover:bg-obsidian-800 text-emerald-400 border border-emerald-500/30 transition shadow-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
          title="Review Scientific Integrity Standard: Deterministic CV, Zero Hallucination"
          aria-label="Review Scientific Integrity Standard: Deterministic Classical CV, Zero Hallucination"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-mono text-[10.5px] hidden lg:inline">Classical CV Verified</span>
        </button>

        {/* Telemetry Drawer Button */}
        {hasActiveImage && (
          <button
            type="button"
            onClick={onOpenTelemetry}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-obsidian-850 hover:bg-obsidian-800 text-lunar-300 border border-obsidian-750 transition shadow-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-observatory-cyan"
            title="Inspect processing telemetry and parameters"
            aria-label="Inspect processing telemetry and parameters"
          >
            <Activity className="w-3.5 h-3.5 text-observatory-cyan" />
            <span className="hidden xl:inline">Telemetry</span>
          </button>
        )}

        {/* Export / Download Button */}
        {hasActiveImage && (
          <button
            type="button"
            onClick={onOpenDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-observatory-blue hover:bg-observatory-blue/80 text-white font-medium border border-observatory-cyan/40 transition shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-observatory-cyan"
            title="Download enhanced image and scientific parameter sidecar"
            aria-label="Download enhanced image and scientific parameter sidecar"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}

        {/* Backend Connectivity Status Dot */}
        <div
          className="flex items-center gap-1.5 pl-2 font-mono text-[10px]"
          title={isBackendHealthy ? 'Backend API Connected' : 'Connecting to Image Server...'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendHealthy ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-amber-400 animate-ping'
            }`}
          />
          <span className="hidden 2xl:inline text-lunar-500">
            {isBackendHealthy ? 'SERVER ONLINE' : 'SERVER CONNECTING'}
          </span>
        </div>
      </div>
    </header>
  );
};
