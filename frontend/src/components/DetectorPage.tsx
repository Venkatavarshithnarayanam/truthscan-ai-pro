import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, AlertCircle, ScanLine, Download, Share2,
  Clock, CheckCircle2, History
} from 'lucide-react';
import ImageUpload from './ImageUpload';
import ResultsPanel from './ResultsPanel';
import type { AnalysisResult } from '../api';
import { analyzeImage } from '../api';

interface HistoryItem {
  file: File;
  preview: string;
  result: AnalysisResult;
  scannedAt: Date;
}

function generateReport(result: AnalysisResult, fileName: string): string {
  const score = Math.round(result.ai_probability * 100);
  return [
    '═══════════════════════════════════════════════',
    '       TRUTHSCAN AI PRO — ANALYSIS REPORT      ',
    '═══════════════════════════════════════════════',
    '',
    `File:          ${fileName}`,
    `Date:          ${new Date().toLocaleString()}`,
    `Verdict:       ${result.label}`,
    `AI Probability: ${score}%`,
    `Confidence:    ${result.confidence}`,
    `Analysis Time: ${result.metadata.analysis_time_ms}ms`,
    `Dimensions:    ${result.metadata.image_dimensions}`,
    `File Type:     ${result.metadata.file_type}`,
    `File Size:     ${result.metadata.file_size}`,
    `Faces:         ${result.metadata.faces_detected}`,
    '',
    '─── Core Scores ───────────────────────────────',
    `GenAI Score:   ${result.breakdown.genai}%`,
    `Face Manip:    ${result.breakdown.face_manipulation}%`,
    `Forensic:      ${Math.round(result.metadata.forensic_score * 100)}%`,
    '',
    '─── Model Attribution ─────────────────────────',
    `GPT/DALL·E:    ${result.breakdown.diffusion.gpt}%`,
    `MidJourney:    ${result.breakdown.diffusion.midjourney}%`,
    `Stable Diff:   ${result.breakdown.diffusion.stable_diffusion}%`,
    `StyleGAN:      ${result.breakdown.gan.stylegan}%`,
    '',
    '─── Explanation ───────────────────────────────',
    result.explanation.summary,
    '',
    '─── Key Indicators ────────────────────────────',
    ...result.explanation.key_indicators.map(i => `  • ${i}`),
    '',
    '─── Visual Patterns ───────────────────────────',
    ...result.explanation.visual_patterns.map(p => `  • ${p}`),
    '',
    '─── Tags ──────────────────────────────────────',
    result.tags.join(', '),
    '',
    '═══════════════════════════════════════════════',
    '  Powered by TruthScan AI Pro — truthscan.ai   ',
    '═══════════════════════════════════════════════',
  ].join('\n');
}

const DetectorPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [shared, setShared] = useState(false);

  const handleFileSelected = useCallback(async (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);
    setIsAnalyzing(true);
    setShared(false);

    // Build preview
    const reader = new FileReader();
    let previewUrl = '';
    reader.onload = e => { previewUrl = e.target?.result as string; setImagePreview(previewUrl); };
    reader.readAsDataURL(file);

    try {
      const analysisResult = await analyzeImage(file);
      setResult(analysisResult);

      setHistory(prev => {
        if (prev.some(h => h.file.name === file.name && h.file.size === file.size)) return prev;
        return [{ file, preview: previewUrl, result: analysisResult, scannedAt: new Date() }, ...prev].slice(0, 8);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setShared(false);
  }, []);

  const handleDownload = useCallback(() => {
    if (!result || !selectedFile) return;
    const text = generateReport(result, selectedFile.name);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truthscan-report-${selectedFile.name.replace(/\.[^.]+$/, '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, selectedFile]);

  const handleShare = useCallback(() => {
    if (!result) return;
    const score = Math.round(result.ai_probability * 100);
    const text = `TruthScan AI Pro Analysis: ${result.label} — ${score}% AI probability. Confidence: ${result.confidence}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  }, [result]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-8 lg:p-10 min-h-0 flex-1">

      {/* ═══ MAIN ANALYSIS AREA ═══ */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">

          {/* Landing upload state */}
          {!selectedFile && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">AI Image Detector</h1>
                <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
                  Upload any image to run forensic AI detection analysis
                </p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Accuracy', value: '99.2%' },
                  { label: 'Avg Speed', value: '<800ms' },
                  { label: 'Models', value: '5+' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-2xl p-5 text-center border"
                    style={{ background: 'rgba(59,130,246,0.04)', borderColor: 'var(--brand-border)' }}>
                    <p className="text-xl font-black text-white mb-1">{value}</p>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  </div>
                ))}
              </div>

              <ImageUpload onFileSelected={handleFileSelected} isAnalyzing={isAnalyzing} />

              <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
                Powered by EfficientNet-B3 · YOLOv8 · OpenCV Forensics
              </p>
            </motion.div>
          )}

          {/* Analysis results state */}
          {selectedFile && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-0.5">Analysis Results</h1>
                  <p className="text-sm truncate max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                    {selectedFile.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {result && (
                    <>
                      <button
                        onClick={handleShare}
                        className="btn-ghost btn-sm flex items-center gap-2"
                      >
                        {shared ? <><CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-green)' }} /> Copied!</> : <><Share2 className="w-4 h-4" /> Share</>}
                      </button>
                      <button
                        onClick={handleDownload}
                        className="btn-ghost btn-sm flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Report
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleReset}
                    className="btn-primary btn-sm flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> New Scan
                  </button>
                </div>
              </div>

              {/* Image preview */}
              <div className="rounded-2xl overflow-hidden border mb-4 relative" style={{ borderColor: 'var(--brand-border)' }}>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Uploaded"
                    className="w-full max-h-72 object-contain"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  />
                )}
                <AnimatePresence>
                  {isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{ background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(6px)' }}
                    >
                      {/* Animated scan line */}
                      <div className="relative w-16 h-16 mb-5">
                        <div className="absolute inset-0 rounded-2xl border-2 animate-spin-slow" style={{ borderColor: 'var(--accent-blue)', borderTopColor: 'transparent' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ScanLine className="w-7 h-7" style={{ color: 'var(--accent-blue)' }} />
                        </div>
                      </div>
                      <p className="text-white font-semibold text-sm mb-1">Scanning digital artifacts…</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Running multi-model ensemble</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error state */}
              {error && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl p-6 border flex items-start gap-4 mb-4"
                  style={{ background: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.2)' }}
                >
                  <AlertCircle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--accent-rose)' }} />
                  <div className="flex-1">
                    <p className="font-semibold text-white mb-1">Analysis Failed</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                  </div>
                  <button
                    onClick={() => handleFileSelected(selectedFile)}
                    className="btn-primary btn-sm"
                  >
                    Retry
                  </button>
                </motion.div>
              )}

              {/* Skeleton while loading */}
              {isAnalyzing && (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton h-16 rounded-2xl" style={{ opacity: 1 - i * 0.15 }} />
                  ))}
                </div>
              )}

              {/* Results */}
              {result && !isAnalyzing && <ResultsPanel result={result} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ HISTORY SIDEBAR ═══ */}
      <div className="w-full lg:w-72 flex-shrink-0">
        <div className="rounded-2xl border p-4 sticky top-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--brand-border)' }}>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <History className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            Recent Scans
            {history.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue-hi)' }}>
                {history.length}
              </span>
            )}
          </h3>

          {history.length === 0 ? (
            <div className="text-center py-8">
              <ScanLine className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-disabled)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No scans yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item, idx) => {
                const score = Math.round(item.result.ai_probability * 100);
                const isAI = item.result.ai_probability > 0.6;
                const isHuman = item.result.ai_probability < 0.4;
                const dotColor = isAI ? 'var(--accent-rose)' : isHuman ? 'var(--accent-green)' : 'var(--accent-amber)';
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedFile(item.file);
                      setImagePreview(item.preview);
                      setResult(item.result);
                      setError(null);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                    style={{ borderColor: 'var(--brand-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <img src={item.preview} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" style={{ background: 'var(--brand-card)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{item.file.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{score}% AI</p>
                        <span className="mx-1" style={{ color: 'var(--text-disabled)' }}>·</span>
                        <Clock className="w-2.5 h-2.5" style={{ color: 'var(--text-disabled)' }} />
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {item.scannedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetectorPage;
