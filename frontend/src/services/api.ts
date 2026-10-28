import type {
  EnhancementParameters,
  EnhanceResponse,
  UploadResponse,
  VerifiedSample,
  TelemetryResponse
} from '../types';

const RAW_ENV_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE_URL = RAW_ENV_URL
  ? (RAW_ENV_URL.endsWith('/api') ? RAW_ENV_URL : `${RAW_ENV_URL}/api`)
  : '/api';

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      detail = errJson.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const apiService = {
  getHealth: async () => {
    return requestJson<Record<string, any>>(`${API_BASE_URL}/health`);
  },

  getSamples: async (): Promise<VerifiedSample[]> => {
    return requestJson<VerifiedSample[]>(`${API_BASE_URL}/samples`);
  },

  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return requestJson<UploadResponse>(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
  },

  loadSample: async (sampleId: string): Promise<UploadResponse> => {
    return requestJson<UploadResponse>(`${API_BASE_URL}/load-sample/${sampleId}`, {
      method: 'POST',
    });
  },

  enhanceImage: async (
    imageId: string,
    params: EnhancementParameters
  ): Promise<EnhanceResponse> => {
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
    formData.append('monochrome_output', params.monochrome_output.toString());
    formData.append('space_bg_cleanup', (params.space_bg_cleanup ?? true).toString());

    return requestJson<EnhanceResponse>(`${API_BASE_URL}/enhance`, {
      method: 'POST',
      body: formData,
    });
  },

  getDownloadUrl: (imageId: string, format: string = 'PNG'): string => {
    return `${API_BASE_URL}/download/${imageId}?format=${format}`;
  },

  getTelemetry: async (imageId: string): Promise<TelemetryResponse> => {
    return requestJson<TelemetryResponse>(`${API_BASE_URL}/image/${imageId}/telemetry`);
  }
};
