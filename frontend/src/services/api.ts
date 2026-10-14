import type {
  EnhancementParameters,
  EnhanceResponse,
  UploadResponse,
  VerifiedSample,
  ProcessingTelemetry
} from '../types';

const envApiUrl = import.meta.env.VITE_API_URL;
const API_BASE = envApiUrl
  ? (envApiUrl.replace(/\/+$/, '').endsWith('/api') ? envApiUrl.replace(/\/+$/, '') : `${envApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

export const apiService = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  async getSamples(): Promise<VerifiedSample[]> {
    const res = await fetch(`${API_BASE}/samples`);
    if (!res.ok) throw new Error(`Failed to fetch samples catalog: ${res.statusText}`);
    const data = await res.json();
    return data.samples;
  },

  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed with status ${res.status}`);
    }

    return res.json();
  },

  async enhanceImage(
    imageId: string,
    params: EnhancementParameters
  ): Promise<EnhanceResponse> {
    const formData = new FormData();
    formData.append('image_id', imageId);
    formData.append('brightness', params.brightness.toString());
    formData.append('contrast', params.contrast.toString());
    formData.append('gamma', params.gamma.toString());
    formData.append('clahe_clip_limit', params.clahe_clip_limit.toString());
    formData.append('clahe_grid_size', params.clahe_grid_size.toString());
    formData.append('shadow_boost', params.shadow_boost.toString());
    formData.append('denoise_strength', params.denoise_strength.toString());
    formData.append('denoise_method', params.denoise_method);
    formData.append('sharpen_strength', params.sharpen_strength.toString());
    formData.append('sharpen_radius', params.sharpen_radius.toString());
    formData.append('monochrome_output', params.monochrome_output ? 'true' : 'false');

    const res = await fetch(`${API_BASE}/enhance`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Enhancement processing error: ${res.status}`);
    }

    return res.json();
  },

  async exportImage(
    imageId: string,
    format: 'PNG' | 'JPEG' | 'TIFF',
    filenamePrefix: string = 'lunarvision_enhanced'
  ): Promise<void> {
    const formData = new FormData();
    formData.append('image_id', imageId);
    formData.append('export_format', format);
    formData.append('filename_prefix', filenamePrefix);

    const res = await fetch(`${API_BASE}/export`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Export failed with status: ${res.status}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // File extension
    const ext = format === 'JPEG' ? 'jpg' : format === 'TIFF' ? 'tif' : 'png';
    link.download = `${filenamePrefix}_${imageId}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  downloadTelemetryJson(telemetry: ProcessingTelemetry, imageId: string): void {
    const jsonStr = JSON.stringify(telemetry, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lunarvision_telemetry_${imageId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
