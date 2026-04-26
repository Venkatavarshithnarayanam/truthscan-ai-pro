import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, AlertTriangle,
  ChevronRight, Tag, Info, Clock, Cpu, Eye, Layers
} from 'lucide-react';
import type { AnalysisResult } from '../api';
import ProgressBar from './ProgressBar';

interface ResultsPanelProps {
  result: AnalysisResult;
}

// Circular confidence ring
function ConfidenceRing({ value, isAI, isReal }: { value: number; isAI: boolean; isReal: boolean }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (value / 100) * circumference;
  const color = isAI ? '#f43f5e' : isReal ? '#10b981' : '#f59e0b';

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="relative text-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="block text-3xl font-black"
          style={{ color }}
        >
          {value}<span className="text-lg opacity-60">%</span>
        </motion.span>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>AI Score</span>
      </div>
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any } },
};

const ResultsPanel: React.FC<ResultsPanelProps> = ({ result }) => {
  const score = Math.round(result.ai_probability * 100);
  const isAI   = result.ai_probability > 0.6;
  const isReal = result.ai_probability < 0.4;

  const accent  = isAI ? 'var(--accent-rose)' : isReal ? 'var(--accent-green)' : 'var(--accent-amber)';
  const accentBg = isAI ? 'rgba(244,63,94,0.08)' : isReal ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)';
  const accentBorder = isAI ? 'rgba(244,63,94,0.2)' : isReal ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)';
  const barColor = (isAI ? 'red' : isReal ? 'green' : 'amber') as 'red' | 'green' | 'amber';

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">

      {/* ── Hero verdict ── */}
      <motion.div
        variants={item}
        className="rounded-2xl p-6 border relative overflow-hidden"
        style={{ background: accentBg, borderColor: accentBorder }}
      >
        {/* Glow orb */}
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ background: accent }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {isAI
                ? <ShieldAlert className="w-7 h-7" style={{ color: accent }} />
                : isReal
                ? <ShieldCheck className="w-7 h-7" style={{ color: accent }} />
                : <AlertTriangle className="w-7 h-7" style={{ color: accent }} />
              }
              <h2 className="text-xl font-bold text-white">{result.label}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold border" style={{ background: accentBg, borderColor: accentBorder, color: accent }}>
                {result.confidence} confidence
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-3.5 h-3.5" />
                {result.metadata.analysis_time_ms}ms
              </span>
              {result.metadata.faces_detected > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  <Eye className="w-3.5 h-3.5" />
                  {result.metadata.faces_detected} face{result.metadata.faces_detected > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <ConfidenceRing value={score} isAI={isAI} isReal={isReal} />
        </div>
      </motion.div>

      {/* ── Metadata chips ── */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        {[
          { icon: Cpu,    label: 'File Size',   value: result.metadata.file_size },
          { icon: Layers, label: 'Dimensions',  value: result.metadata.image_dimensions },
          { icon: Eye,    label: 'File Type',   value: result.metadata.file_type.replace('image/', '').toUpperCase() },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'var(--brand-border)' }}
          >
            <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-xs font-bold text-white truncate">{value}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Core analysis + Model attribution ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          variants={item}
          className="rounded-2xl p-5 border space-y-5"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--brand-border)' }}
        >
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-blue)' }} />
            Core Analysis
          </h3>
          <ProgressBar label="Generative AI Score" percentage={result.breakdown.genai} color={barColor} subLabel="Base model prediction" />
          {result.metadata.faces_detected > 0 && (
            <ProgressBar label="Face Manipulation" percentage={result.breakdown.face_manipulation} color="purple" subLabel={`${result.metadata.faces_detected} face(s) detected`} />
          )}
          <ProgressBar label="Forensic Anomaly" percentage={Math.round(result.metadata.forensic_score * 100)} color="gray" subLabel="Noise, blur & edge analysis" />
        </motion.div>

        <motion.div
          variants={item}
          className="rounded-2xl p-5 border space-y-4"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--brand-border)' }}
        >
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-purple)' }} />
            Model Attribution
          </h3>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Diffusion Models</p>
          <ProgressBar label="GPT / DALL·E" percentage={result.breakdown.diffusion.gpt} color="blue" />
          <ProgressBar label="MidJourney" percentage={result.breakdown.diffusion.midjourney} color="blue" />
          <ProgressBar label="Stable Diffusion" percentage={result.breakdown.diffusion.stable_diffusion} color="blue" />
          <p className="text-xs font-bold uppercase tracking-wider pt-1" style={{ color: 'var(--text-muted)' }}>GAN Architecture</p>
          <ProgressBar label="StyleGAN" percentage={result.breakdown.gan.stylegan} color="purple" />
          <ProgressBar label="Other GANs" percentage={result.breakdown.gan.others} color="purple" />
        </motion.div>
      </div>

      {/* ── Tags ── */}
      {result.tags?.length > 0 && (
        <motion.div
          variants={item}
          className="rounded-2xl p-5 border"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--brand-border)' }}
        >
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
            <Tag className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            Scene Context
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.tags.map((tag, i) => (
              <span key={i} className="tag-pill">{tag}</span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Detailed reasoning ── */}
      <motion.div
        variants={item}
        className="rounded-2xl p-5 border relative overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--brand-border)' }}
      >
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: 'var(--grad-primary)' }} />
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
          <Info className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
          Detailed Reasoning
        </h3>
        <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
          {result.explanation.summary}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { title: 'Key Indicators', items: result.explanation.key_indicators, accent: 'var(--accent-blue)' },
            { title: 'Visual Patterns', items: result.explanation.visual_patterns, accent: 'var(--accent-purple)' },
          ].map(({ title, items, accent: a }) => (
            <div key={title} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>{title}</h4>
              <ul className="space-y-2">
                {items.map((x, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: a }} />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultsPanel;
