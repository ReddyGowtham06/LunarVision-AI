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
  brightness: number;
  contrast: number;
  gamma: number;
  clahe_clip_limit: number;
  clahe_grid_size: number;
  shadow_boost: number;
  denoise_strength: number;
  denoise_method: 'bilateral' | 'fast_nl_means' | 'gaussian' | 'none';
  sharpen_strength: number;
  sharpen_radius: number;
  crater_clarity: number;
  monochrome_output: boolean;
  space_bg_cleanup?: boolean;
  suppress_background_artifacts?: boolean;
  background_smoothing?: number;
}

export interface ScientificAssessment {
  methodology: string;
  ai_hallucination_risk: string;
  clipping_warning: boolean;
  warning_message: string | null;
  dynamic_range_improvement_db: number;
  background_suppression_active?: boolean;
}

export interface ProcessingTelemetry {
  elapsed_ms: number;
  dimensions: ImageDimensions;
  parameters_applied: EnhancementParameters;
  segmentation_mode?: string;
  lunar_segmentation?: any;
  original_stats: RadiometricStats;
  enhanced_stats: RadiometricStats;
  scientific_assessment: ScientificAssessment;
}

export interface VerifiedSample {
  id: string;
  title: string;
  target_region?: string;
  target?: string;
  description?: string;
  mission?: string;
  instrument?: string;
  nasa_id?: string;
  coordinates?: string;
  illumination?: string;
  scientific_context?: string;
  attribution?: string;
  remote_url?: string;
  local_filename?: string;
  available_locally?: boolean;
  file_size_bytes?: number;
  recommended_preset?: Partial<EnhancementParameters>;
}

export interface UploadResponse {
  image_id: string;
  filename: string;
  title?: string;
  target_region?: string;
  description?: string;
  raw_preview_url: string;
  dimensions: ImageDimensions;
  file_metadata: Record<string, any>;
  original_stats: RadiometricStats;
  initial_stats?: RadiometricStats;
  bit_depth?: number;
  channels?: number;
}

export interface EnhanceResponse {
  image_id: string;
  enhanced_preview_url: string;
  telemetry: ProcessingTelemetry;
}

export interface TelemetryResponse {
  image_id: string;
  metadata: Record<string, any>;
  latest_telemetry: ProcessingTelemetry | null;
}

export type ViewMode = 'split' | 'side_by_side' | 'enhanced' | 'original' | 'enhanced_only' | 'original_only';
