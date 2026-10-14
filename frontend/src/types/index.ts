export interface ImageDimensions {
  width: number;
  height: number;
  channels?: number;
  megapixels?: number;
}

export interface RadiometricStats {
  min_dn: number;
  max_dn: number;
  mean_dn: number;
  std_dev: number;
  median_dn: number;
  shadow_pixel_pct: number;
  highlight_saturated_pct: number;
  dynamic_range_db: number;
  histogram_256: number[];
  total_pixels: number;
}

export interface EnhancementParameters {
  brightness: number;          // -100 to 100
  contrast: number;            // 0.1 to 3.0
  gamma: number;               // 0.2 to 3.0
  clahe_clip_limit: number;    // 0.1 to 10.0
  clahe_grid_size: number;     // 2 to 32
  shadow_boost: number;        // 0 to 100
  denoise_strength: number;    // 0 to 30
  denoise_method: 'bilateral' | 'fast_nl_means' | 'gaussian' | 'none';
  sharpen_strength: number;    // 0 to 2.5
  sharpen_radius: number;      // 0.5 to 5.0
  monochrome_output: boolean;
}

export interface ScientificAssessment {
  methodology: string;
  ai_hallucination_risk: string;
  clipping_warning: boolean;
  warning_message: string | null;
  dynamic_range_improvement_db: number;
}

export interface ProcessingTelemetry {
  elapsed_ms: number;
  dimensions: ImageDimensions;
  parameters_applied: EnhancementParameters;
  original_stats: RadiometricStats;
  enhanced_stats: RadiometricStats;
  scientific_assessment: ScientificAssessment;
}

export interface VerifiedSample {
  id: string;
  title: string;
  target: string;
  mission: string;
  instrument: string;
  nasa_id: string;
  coordinates: string;
  illumination: string;
  scientific_context: string;
  attribution: string;
  remote_url: string;
  local_filename: string;
  available_locally: boolean;
  file_size_bytes: number;
  recommended_preset: Partial<EnhancementParameters>;
}

export interface UploadResponse {
  success: boolean;
  image_id: string;
  filename: string;
  file_size_bytes: number;
  dimensions: ImageDimensions;
  bit_depth: number;
  channels: number;
  is_grayscale: boolean;
  initial_stats: RadiometricStats;
  preview_url: string;
  preview_base64: string;
}

export interface EnhanceResponse {
  success: boolean;
  image_id: string;
  enhanced_base64: string;
  original_base64: string;
  telemetry: ProcessingTelemetry;
}

export type ViewMode = 'split' | 'side_by_side' | 'enhanced_only' | 'original_only';
