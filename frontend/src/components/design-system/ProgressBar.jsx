import React from 'react';
import shieldTheme from '../../theme/shield-theme';

const ProgressBar = ({ 
  progress = 0, 
  size = 'md', 
  variant = 'primary',
  showLabel = true,
  label = null,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const variantColors = {
    primary: shieldTheme.colors.primary[500],
    success: shieldTheme.colors.success,
    warning: shieldTheme.colors.warning,
    error: shieldTheme.colors.error
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`} data-testid="progress-bar">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm font-semibold text-slate-900">
            {clampedProgress}%
          </span>
        </div>
      )}
      <div 
        className={`w-full bg-slate-200 rounded-full overflow-hidden ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className="h-full transition-all duration-300 ease-out relative overflow-hidden"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: variantColors[variant]
          }}
        >
          {/* Shimmer effect */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'shimmer 2s infinite'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
