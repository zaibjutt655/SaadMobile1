import React from 'react';

// ─── ANIMATED TABLE ───────────────────────────────────────────────────────────
export const Table = ({ children, className = '' }) => (
  <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
    <table className={`w-full ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children }) => (
  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
    {children}
  </thead>
);

export const TableBody = ({ children }) => (
  <tbody className="bg-white divide-y divide-gray-100">
    {children}
  </tbody>
);

export const TableRow = ({ children, onClick, className = '' }) => (
  <tr
    onClick={onClick}
    className={`transition-all duration-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50
      ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className = '' }) => (
  <th className={`px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '' }) => (
  <td className={`px-6 py-4 text-sm text-gray-900 ${className}`}>
    {children}
  </td>
);

// ─── ANIMATED CARD ────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', hover = true, gradient = false }) => (
  <div className={`
    bg-white rounded-2xl border border-gray-200 shadow-sm
    ${hover ? 'hover-lift' : ''}
    ${gradient ? 'bg-gradient-to-br from-white to-gray-50' : ''}
    ${className}
  `}>
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, action, icon }) => (
  <div className="px-6 py-5 border-b border-gray-100">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        {icon && <div className="text-3xl">{icon}</div>}
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`px-6 py-5 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl ${className}`}>
    {children}
  </div>
);

// ─── TABS ─────────────────────────────────────────────────────────────────────
export const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="border-b border-gray-200 mb-6">
    <nav className="flex gap-2 -mb-px">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            px-6 py-3 text-sm font-semibold rounded-t-xl transition-all duration-200
            ${activeTab === tab.id
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform -translate-y-0.5'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }
          `}
        >
          <span className="flex items-center gap-2">
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-bold
                ${activeTab === tab.id ? 'bg-white bg-opacity-20' : 'bg-gray-200 text-gray-700'}
              `}>
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </nav>
  </div>
);

// ─── ALERT ────────────────────────────────────────────────────────────────────
export const Alert = ({ type = 'info', title, message, onClose, icon }) => {
  const types = {
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: icon || '💡',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      textColor: 'text-blue-700'
    },
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: icon || '✅',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      textColor: 'text-green-700'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: icon || '⚠️',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-900',
      textColor: 'text-yellow-700'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: icon || '❌',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      textColor: 'text-red-700'
    }
  };

  const style = types[type];

  return (
    <div className={`${style.bg} border rounded-xl p-4 animate-slide-in-right`}>
      <div className="flex items-start gap-3">
        <div className={`${style.iconBg} rounded-lg p-2 flex-shrink-0`}>
          <span className="text-xl">{style.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          {title && <h4 className={`text-sm font-bold ${style.titleColor} mb-1`}>{title}</h4>}
          <p className={`text-sm ${style.textColor}`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`${style.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ─── STATS GRID ───────────────────────────────────────────────────────────────
export const StatsGrid = ({ children, cols = 4 }) => {
  const colsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${colsClass[cols]} gap-4 stagger-children`}>
      {children}
    </div>
  );
};

// ─── DIVIDER ──────────────────────────────────────────────────────────────────
export const Divider = ({ label, icon }) => (
  <div className="relative my-8">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200"></div>
    </div>
    {(label || icon) && (
      <div className="relative flex justify-center">
        <span className="px-4 bg-gray-50 text-sm font-semibold text-gray-600 flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          {label}
        </span>
      </div>
    )}
  </div>
);

// ─── QUICK ACTION BUTTON ──────────────────────────────────────────────────────
export const QuickAction = ({ icon, label, onClick, color = 'indigo' }) => {
  const colors = {
    indigo: 'from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600',
    green: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
    blue: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
    red: 'from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600',
    orange: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-3 p-6 rounded-2xl
        bg-gradient-to-br ${colors[color]} text-white shadow-lg
        hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300
        group
      `}
    >
      <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
};
