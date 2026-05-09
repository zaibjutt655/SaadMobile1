import React from 'react';

// ─── SUCCESS NOTIFICATION ─────────────────────────────────────────────────────
export const SuccessNotification = ({ message }) => (
  <div className="flex items-center gap-3 bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500 animate-slide-in-right">
    <div className="flex-shrink-0">
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </div>
    <div className="flex-1">
      <p className="text-sm font-semibold text-gray-900">Success!</p>
      <p className="text-xs text-gray-600">{message}</p>
    </div>
  </div>
);

// ─── ERROR NOTIFICATION ───────────────────────────────────────────────────────
export const ErrorNotification = ({ message }) => (
  <div className="flex items-center gap-3 bg-white rounded-xl shadow-lg p-4 border-l-4 border-red-500 animate-slide-in-right animate-shake">
    <div className="flex-shrink-0">
      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    </div>
    <div className="flex-1">
      <p className="text-sm font-semibold text-gray-900">Error</p>
      <p className="text-xs text-gray-600">{message}</p>
    </div>
  </div>
);

// ─── INFO NOTIFICATION ────────────────────────────────────────────────────────
export const InfoNotification = ({ message }) => (
  <div className="flex items-center gap-3 bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500 animate-slide-in-right">
    <div className="flex-shrink-0">
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
    <div className="flex-1">
      <p className="text-sm font-semibold text-gray-900">Info</p>
      <p className="text-xs text-gray-600">{message}</p>
    </div>
  </div>
);

// ─── LOADING CARD ─────────────────────────────────────────────────────────────
export const LoadingCard = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
  </div>
);

// ─── SKELETON LOADER ──────────────────────────────────────────────────────────
export const SkeletonLoader = ({ rows = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton h-16 w-full"></div>
    ))}
  </div>
);

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max = 100, color = 'indigo', label, showPercentage = true }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const colors = {
    indigo: 'from-indigo-500 to-purple-500',
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-cyan-500',
    red: 'from-red-500 to-pink-500',
    orange: 'from-orange-500 to-amber-500',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && <span className="text-sm font-semibold text-gray-900">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colors[color]} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// ─── TOOLTIP ──────────────────────────────────────────────────────────────────
export const Tooltip = ({ children, text, position = 'top' }) => {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative group inline-block">
      {children}
      <div className={`absolute ${positions[position]} px-3 py-2 bg-gray-900 text-white text-xs rounded-lg
        opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200
        whitespace-nowrap z-50 pointer-events-none`}>
        {text}
        <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45
          {position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
           position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
           position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2' :
           'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2'}"></div>
      </div>
    </div>
  );
};
