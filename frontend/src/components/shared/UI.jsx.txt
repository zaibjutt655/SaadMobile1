import React from 'react';

// ─── MODAL ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
        <div className={`
          relative bg-white w-full ${widths[size]}
          rounded-t-2xl sm:rounded-2xl shadow-2xl
          p-4 sm:p-6
          transform transition-all animate-scale-in
          max-h-[92vh] overflow-y-auto
        `}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors shrink-0"
            >✕</button>
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
    blue:   'from-blue-500 to-blue-600',
    green:  'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red:    'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink:   'from-pink-500 to-pink-600',
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colors[color]} p-4 sm:p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1 truncate">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold mb-1 truncate">{value}</p>
          {sub && <p className="text-xs sm:text-sm opacity-80 truncate">{sub}</p>}
        </div>
        {icon && (
          <span className="text-2xl sm:text-3xl opacity-80 bg-white bg-opacity-20 p-2 rounded-xl ml-2 shrink-0">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── BADGE ────────────────────────────────────────────────────────────────────
export const Badge = ({ label, color = 'gray' }) => {
  const colors = {
    gray:   'bg-gray-100 text-gray-700',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    blue:   'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    pink:   'bg-pink-100 text-pink-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {label}
    </span>
  );
};

// ─── SEARCH INPUT ─────────────────────────────────────────────────────────────
export const SearchInput = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-xl w-full
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    />
  </div>
);

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon = '📭', title, message, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-gray-400 animate-fade-in">
    <div className="text-5xl sm:text-6xl mb-3">{icon}</div>
    <p className="font-semibold text-gray-700 text-base sm:text-lg mb-1 text-center">{title}</p>
    {message && <p className="text-sm text-gray-500 mb-4 text-center px-4">{message}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

// ─── BUTTON ───────────────────────────────────────────────────────────────────
export const Btn = ({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', className = '' }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };
  const variants = {
    primary:   'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger:    'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-md',
    ghost:     'hover:bg-gray-100 text-gray-600',
    success:   'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md',
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
  <div className="mb-3">
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
    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                disabled:bg-gray-100 ${className}`}
    {...props}
  />
);

export const Select = ({ children, className = '', ...props }) => (
  <select
    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                bg-white ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const Textarea = ({ className = '', ...props }) => (
  <textarea
    rows={3}
    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                resize-none ${className}`}
    {...props}
  />
);

// ─── PAGE HEADER ──────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-4 sm:mb-6 gap-3">
    <div className="flex-1 min-w-0">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight truncate">{title}</h1>
      {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

// ─── LOADING SPINNER ──────────────────────────────────────────────────────────
export const Spinner = ({ className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
    <div className="relative w-10 h-10">
      <div className="w-10 h-10 border-4 border-indigo-200 rounded-full"></div>
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
    </div>
    <p className="text-sm text-gray-500 mt-3 animate-pulse">Loading...</p>
  </div>
);

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, danger, confirmText = 'Confirm', cancelText = 'Cancel' }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <div className="mb-5">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${danger ? 'bg-red-100' : 'bg-blue-100'}`}>
        <span className="text-3xl">{danger ? '⚠️' : '❓'}</span>
      </div>
      <p className="text-sm text-gray-600 text-center">{message}</p>
    </div>
    <div className="flex gap-3 justify-end">
      <Btn variant="secondary" onClick={onClose}>{cancelText}</Btn>
      <Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmText}</Btn>
    </div>
  </Modal>
);

// ─── MOBILE CARD (Table ka mobile alternative) ────────────────────────────────
export const MobileCard = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${className}`}>
    {children}
  </div>
);

// ─── RESPONSIVE TABLE WRAPPER ─────────────────────────────────────────────────
// Desktop pe table, mobile pe cards
export const DataTable = ({ headers, rows, emptyState, loading, renderMobileCard }) => {
  if (loading) return <Spinner />;
  if (!rows || rows.length === 0) return emptyState || <EmptyState title="No data" />;

  return (
    <>
      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-xl border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {headers.map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {renderMobileCard}
      </div>
    </>
  );
};

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────
export const fmtCurrency = (n) => `Rs ${Number(n || 0).toLocaleString()}`;
export const fmtDate     = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-PK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
