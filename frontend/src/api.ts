export interface AnalysisResult {
  ai_probability: number;
  label: string;
  confidence: string;
  breakdown: {
    genai: number;
    face_manipulation: number;
    diffusion: {
      gpt: number;
      stable_diffusion: number;
      midjourney: number;
      dalle: number;
      recraft: number;
      qwen: number;
      imagen: number;
      others: number;
    };
    gan: {
      stylegan: number;
      others: number;
    };
  };
  tags: string[];
  metadata: {
    file_size: string;
    file_type: string;
    image_dimensions: string;
    analysis_time_ms: number;
    faces_detected: number;
    forensic_score: number;
    model_ready: boolean;
  };
  explanation: {
    summary: string;
    key_indicators: string[];
    visual_patterns: string[];
  };
}

export async function analyzeImage(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(error.detail || `Server error: ${response.status}`);
  }

  return response.json();
}
