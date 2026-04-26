import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  label: string;
  percentage: number;
  color?: 'red' | 'blue' | 'green' | 'gray' | 'amber' | 'purple';
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
  const safePercent = Math.min(100, Math.max(0, percentage));

  return (
    <div className={`w-full ${customClass}`}>
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{label}</span>
          {subLabel && (
            <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subLabel}</span>
          )}
        </div>
        <span
          className="text-xs font-bold mono px-2 py-0.5 rounded-md ml-3"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
        >
          {safePercent}%
        </span>
      </div>
      <div className="progress-track">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safePercent}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className={`progress-fill ${color}`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
