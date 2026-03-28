import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  label: string;
  percentage: number;
  color?: 'red' | 'blue' | 'green' | 'gray' | 'yellow' | 'purple';
  subLabel?: string;
  customClass?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  percentage,
  color = 'blue',
  subLabel,
  customClass = '',
}) => {
  const colorMap = {
    red: 'from-rose-500 to-red-600',
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-400 to-green-600',
    gray: 'from-slate-300 to-slate-400',
    yellow: 'from-amber-400 to-orange-500',
    purple: 'from-violet-500 to-fuchsia-600',
  };

  const bgGradient = colorMap[color];

  return (
    <div className={`w-full ${customClass}`}>
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-800 tracking-tight">{label}</span>
          {subLabel && <span className="text-xs font-medium text-slate-500 mt-0.5">{subLabel}</span>}
        </div>
        <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{percentage}%</span>
      </div>
      <div className="h-3 w-full bg-slate-100/80 rounded-full overflow-hidden shadow-inner ring-1 ring-black/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full bg-gradient-to-r ${bgGradient} shadow-[inset_0_1px_rgba(255,255,255,0.3)]`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
