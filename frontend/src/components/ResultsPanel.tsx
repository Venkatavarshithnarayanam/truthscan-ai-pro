import React from 'react';
import type { AnalysisResult } from '../api';
import ProgressBar from './ProgressBar';

interface ResultsPanelProps {
  result: AnalysisResult;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ result }) => {
  const aiPct = Math.round(result.ai_probability * 100);

  const getScoreBadgeClass = () => {
    if (aiPct >= 70) return 'high';
    if (aiPct >= 40) return 'medium';
    return 'low';
  };

  const getBarColor = (value: number): 'red' | 'blue' | 'green' | 'gray' => {
    if (value >= 50) return 'red';
    if (value >= 20) return 'blue';
    return 'gray';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header: Label + Big Score */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{result.label}</h2>
          <p className="text-sm text-gray-400 mt-1">
            Confidence: <span className="font-semibold text-gray-600">{result.confidence}</span>
          </p>
        </div>
        <div className={`score-badge ${getScoreBadgeClass()} text-4xl w-24 h-24 rounded-2xl shadow-lg`}>
          {aiPct}%
        </div>
      </div>

      {/* Primary Bars: GenAI + Face Manipulation */}
      <div className="space-y-3">
        <ProgressBar
          label="GenAI"
          value={result.breakdown.genai}
          color={getBarColor(result.breakdown.genai)}
          tooltip="Probability that image was created by an AI model"
        />
        <ProgressBar
          label="Face manipulation"
          value={result.breakdown.face_manipulation}
          color={getBarColor(result.breakdown.face_manipulation)}
          tooltip="Probability that facial features have been manipulated"
        />
      </div>

      {/* Diffusion + GAN side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diffusion Breakdown */}
        <div className="animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Diffusion</h3>
            <span className="text-xs text-gray-400 cursor-help" title="Attribution to diffusion-based AI models">?</span>
          </div>
          <div className="space-y-2.5">
            <ProgressBar label="GPT" value={result.breakdown.diffusion.gpt} color="red" size="sm" />
            <ProgressBar label="Other" value={result.breakdown.diffusion.others} color="gray" size="sm" />
            <ProgressBar label="Stable Diffusion" value={result.breakdown.diffusion.stable_diffusion} color="gray" size="sm" />
            <ProgressBar label="Recraft" value={result.breakdown.diffusion.recraft} color="gray" size="sm" />
            <ProgressBar label="Qwen" value={result.breakdown.diffusion.qwen} color="gray" size="sm" />
            <ProgressBar label="Midjourney" value={result.breakdown.diffusion.midjourney} color="gray" size="sm" />
            <ProgressBar label="Imagen / Nano Banana" value={result.breakdown.diffusion.imagen} color="gray" size="sm" />
            <ProgressBar label="Dall-E" value={result.breakdown.diffusion.dalle} color="gray" size="sm" />
          </div>
        </div>

        {/* GAN + Other */}
        <div className="animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">GAN</h3>
            <span className="text-xs text-gray-400 cursor-help" title="Attribution to GAN-based AI models">?</span>
          </div>
          <div className="space-y-2.5 mb-6">
            <ProgressBar label="StyleGAN" value={result.breakdown.gan.stylegan} color="blue" size="sm" />
            <ProgressBar label="Others" value={result.breakdown.gan.others} color="gray" size="sm" />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Other</h3>
            <span className="text-xs text-gray-400 cursor-help" title="Other manipulation indicators">?</span>
          </div>
          <div className="space-y-2.5">
            <ProgressBar
              label="Face manipulation"
              value={result.breakdown.face_manipulation}
              color={result.breakdown.face_manipulation >= 50 ? 'red' : 'gray'}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      {result.tags.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Detected Tags</h3>
          <div className="flex flex-wrap gap-2">
            {result.tags.map((tag, i) => (
              <span key={i} className="tag-pill">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Detailed Reasoning</h3>
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{result.explanation.summary}</p>

          {result.explanation.key_indicators.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Key Indicators</h4>
              <ul className="space-y-1.5">
                {result.explanation.key_indicators.map((indicator, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-blue-500 mt-0.5 shrink-0">●</span>
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.explanation.visual_patterns.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Visual Patterns</h4>
              <ul className="space-y-1.5">
                {result.explanation.visual_patterns.map((pattern, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-purple-500 mt-0.5 shrink-0">◆</span>
                    {pattern}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Metadata Footer */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 pt-2 border-t border-gray-100">
        <span>File: {result.metadata.file_type}</span>
        <span>Size: {result.metadata.file_size}</span>
        <span>Dimensions: {result.metadata.image_dimensions}</span>
        <span>Faces: {result.metadata.faces_detected}</span>
        <span>Analysis: {result.metadata.analysis_time_ms}ms</span>
        <span>Forensic: {(result.metadata.forensic_score * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};

export default ResultsPanel;
