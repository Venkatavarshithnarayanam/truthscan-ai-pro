import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, AlertTriangle, ChevronRight, Tag, Info } from 'lucide-react';
import type { AnalysisResult } from '../api';
import ProgressBar from './ProgressBar';

interface ResultsPanelProps {
  result: AnalysisResult;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ result }) => {
  const isAI = result.ai_probability > 0.6;
  const isLikelyReal = result.ai_probability < 0.4;
  
  // Dynamic styling based on result
  const primaryColor = isAI ? 'text-rose-600' : isLikelyReal ? 'text-emerald-600' : 'text-amber-500';
  const bgSoft = isAI ? 'bg-rose-50' : isLikelyReal ? 'bg-emerald-50' : 'bg-amber-50';
  const borderSoft = isAI ? 'border-rose-100' : isLikelyReal ? 'border-emerald-100' : 'border-amber-100';
  const barColorPrimary = isAI ? 'red' : isLikelyReal ? 'green' : 'yellow';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* 1. Top Hero Result Card */}
      <motion.div variants={itemVariants} className={`p-6 sm:p-8 rounded-3xl border ${borderSoft} ${bgSoft} relative overflow-hidden`}>
        {/* Background glow */}
        <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${
          isAI ? 'bg-rose-500' : isLikelyReal ? 'bg-emerald-500' : 'bg-amber-400'
        }`} />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {isAI ? (
                <ShieldAlert className="w-8 h-8 text-rose-500" />
              ) : isLikelyReal ? (
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              )}
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                {result.label}
              </h2>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                isAI ? 'bg-rose-100 text-rose-700 border-rose-200' : 
                isLikelyReal ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                Confidence: {result.confidence}
              </span>
              <span className="text-slate-500 text-sm font-medium">
                Analysis time: {result.metadata.analysis_time_ms}ms
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-6xl sm:text-7xl font-black tracking-tighter ${primaryColor}`}>
              {Math.round(result.ai_probability * 100)}<span className="text-4xl sm:text-5xl opacity-50">%</span>
            </span>
            <span className="text-slate-500 font-medium uppercase tracking-wider text-xs mt-1">AI Probability</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Primary Scores */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Core Analysis
          </h3>
          
          <ProgressBar
            label="Generative AI Score"
            percentage={result.breakdown.genai}
            color={barColorPrimary}
            subLabel="Base model prediction"
          />
          
          {result.metadata.faces_detected > 0 && (
            <ProgressBar
              label="Face Manipulation"
              percentage={result.breakdown.face_manipulation}
              color="purple"
              subLabel={`${result.metadata.faces_detected} face(s) detected`}
            />
          )}

          <ProgressBar
            label="Forensic Anomaly"
            percentage={Math.round(result.metadata.forensic_score * 100)}
            color="gray"
            subLabel="Noise, blur, and edge inconsistencies"
          />
        </motion.div>

        {/* 3. Model Breakdown */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            Model Attribution
          </h3>
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Diffusion Models</h4>
            <div className="space-y-3">
              <ProgressBar label="GPT/DALL·E" percentage={result.breakdown.diffusion.gpt} color="blue" />
              <ProgressBar label="MidJourney" percentage={result.breakdown.diffusion.midjourney} color="blue" />
              <ProgressBar label="Stable Diffusion" percentage={result.breakdown.diffusion.stable_diffusion} color="blue" />
            </div>
            
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">GAN Architecture</h4>
            <div className="space-y-3">
              <ProgressBar label="StyleGAN" percentage={result.breakdown.gan.stylegan} color="purple" />
              <ProgressBar label="Other GANs" percentage={result.breakdown.gan.others} color="purple" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 4. Scene Context / Tags */}
      {result.tags && result.tags.length > 0 && (
        <motion.div variants={itemVariants} className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-slate-400" />
            Scene Context
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.tags.map((tag, i) => (
              <span 
                key={i} 
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl shadow-sm hover:border-blue-300 hover:text-blue-600 transition-colors cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* 5. Detailed Explanation */}
      <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-600" />
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-500" />
          Detailed Reasoning
        </h3>
        <p className="text-slate-600 leading-relaxed mb-6 font-medium">
          {result.explanation.summary}
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Key Indicators</h4>
            <ul className="space-y-2">
              {result.explanation.key_indicators.map((indicator, i) => (
                <li key={i} className="flex items-start text-sm text-slate-700">
                  <ChevronRight className="w-4 h-4 text-blue-500 mr-1 shrink-0 mt-0.5" />
                  <span>{indicator}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Visual Patterns</h4>
            <ul className="space-y-2">
              {result.explanation.visual_patterns.map((pattern, i) => (
                <li key={i} className="flex items-start text-sm text-slate-700">
                  <ChevronRight className="w-4 h-4 text-purple-500 mr-1 shrink-0 mt-0.5" />
                  <span>{pattern}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultsPanel;
