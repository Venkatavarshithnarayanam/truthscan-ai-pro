import React from 'react';

interface ProgressBarProps {
  label: string;
  value: number;
  maxValue?: number;
  color?: 'red' | 'blue' | 'green' | 'gray';
  showPercentage?: boolean;
  size?: 'sm' | 'md';
  tooltip?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  maxValue = 100,
  color = 'red',
  showPercentage = true,
  size = 'md',
  tooltip,
}) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="flex items-center gap-3 group" title={tooltip}>
      <span className="text-sm text-gray-500 w-36 shrink-0 truncate">{label}</span>
      <div className={`flex-1 ${barHeight} bg-gray-100 rounded-full overflow-hidden`}>
        <div
          className={`${barHeight} rounded-full animate-bar-fill progress-bar-fill ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-sm font-semibold text-gray-700 w-12 text-right tabular-nums">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
