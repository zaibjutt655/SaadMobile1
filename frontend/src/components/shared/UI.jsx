import React from 'react';

// ─── MODAL ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
        <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} p-6 transform transition-all animate-scale-in`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">✕</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, color = 'blue', icon }) => {
  const colors = {
    blue:   'from-blue-500 to-blue-600 shadow-blue-200',
    green:  'from-green-500 to-green-600 shadow-green-200',
    purple: 'from-purple-500 to-purple-600 shadow-purple-200',
    orange: 'from-orange-500 to-orange-600 shadow-orange-200',
    red:    'from-red-500 to-red-600 shadow-red-200',
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200',
    pink:   'from-pink-500 to-pink-600 shadow-pink-200',
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colors[color]} p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-bold mb-1">{value}</p>
          {sub && <p className="text-sm opacity-80">{sub}</p>}
        </div>
        {icon && <span className="text-4xl opacity-80 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur">{icon}</span>}
      </div>
    </div>
  );
};

// ─── BADGE ────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color = 'gray' }) => {
  const colors = {
    gray:   'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
    green:  'bg-green-100 text-green-700 ring-1 ring-green-200',
    red:    'bg-red-100 text-red-700 ring-1 ring-red-200',
    blue:   'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
    yellow: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200',
    purple: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200',
    orange: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
    indigo: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200',
    pink:   'bg-pink-100 text-pink-700 ring-1 ring-pink-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>
      {label}
    </span>
  );
};

// ─── SEARCH INPUT ─────────────────────────────────────────────────────────────
export const SearchInput = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl w-full
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                 shadow-sm hover:shadow transition-shadow"
    />
  </div>
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title, message, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-fade-in">
    <div className="text-7xl mb-4 animate-bounce-in">{icon}</div>
    <p className="font-semibold text-gray-700 text-lg mb-2">{title}</p>
    {message && <p className="text-sm text-gray-500 mb-4">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ─── BUTTON ───────────────────────────────────────────────────────────────────
export const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', className = '' }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0';
  const sizes = { sm: 'px-3 py-2 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  const variants = {
    primary:   'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 shadow hover:shadow-md',
    danger:    'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl',
    ghost:     'hover:bg-gray-100 text-gray-600',
    success:   'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// ─── FORM FIELD ───────────────────────────────────────────────────────────────
export const Field = ({ label, error, children, required }) => (
  <div className="mb-4">
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                disabled:bg-gray-100 shadow-sm hover:shadow transition-shadow ${className}`}
    {...props}
  />
);

export const Select = ({ children, className = '', ...props }) => (
  <select
    className={`w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                bg-white shadow-sm hover:shadow transition-shadow ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const Textarea = ({ className = '', ...props }) => (
  <textarea
    rows={3}
    className={`w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                resize-none shadow-sm hover:shadow transition-shadow ${className}`}
    {...props}
  />
);

// ─── PAGE HEADER ──────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── LOADING SPINNER ──────────────────────────────────────────────────────────
export const Spinner = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="relative">
        <div className={`${sizes[size]} border-4 border-indigo-200 rounded-full`}></div>
        <div className={`${sizes[size]} border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
      </div>
      <p className="text-sm text-gray-500 mt-4 animate-pulse">Loading...</p>
    </div>
  );
};

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, danger, confirmText = 'Confirm', cancelText = 'Cancel' }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <div className="mb-6">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100' : 'bg-blue-100'}`}>
        <span className="text-4xl">{danger ? '⚠️' : '❓'}</span>
      </div>
      <p className="text-sm text-gray-600 text-center">{message}</p>
    </div>
    <div className="flex gap-3 justify-end">
      <Btn variant="secondary" onClick={onClose}>{cancelText}</Btn>
      <Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmText}</Btn>
    </div>
  </Modal>
);

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────
export const fmtCurrency = (n) => `Rs ${Number(n || 0).toLocaleString()}`;
export const fmtDate     = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' }) : '—';
export const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-PK',  { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';
