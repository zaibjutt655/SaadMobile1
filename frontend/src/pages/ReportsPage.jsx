import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { reportsAPI, backupAPI } from '../utils/api';
import { PageHeader, Btn, StatCard, Spinner, fmtCurrency } from '../components/shared/UI';

const PERIODS = [
  { value:'today',  label:'Today' },
  { value:'week',   label:'This Week' },
  { value:'month',  label:'This Month' },
  { value:'custom', label:'Custom Range' },
];

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const [period,    setPeriod]    = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [exporting, setExporting] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { period };
      if (period === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate   = endDate;
      }
      const res = await reportsAPI.getSummary(params);
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    if (period !== 'custom' || (startDate && endDate)) load();
  }, [load, period, startDate, endDate]);

  const exportJSON = async () => {
    setExporting('json');
    try {
      const res = await backupAPI.downloadJSON();
      downloadBlob(res.data, `backup-${Date.now()}.json`);
      toast.success('JSON export downloaded');
    } catch { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  const exportExcel = async () => {
    setExporting('excel');
    try {
      const res = await backupAPI.downloadExcel();
      downloadBlob(res.data, `backup-${Date.now()}.xlsx`);
      toast.success('Excel export downloaded');
    } catch { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  const d = data || {};

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Financial summary and profit analysis"
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" onClick={exportJSON} disabled={!!exporting}>
              {exporting==='json' ? '...' : '⬇ JSON'}
            </Btn>
            <Btn variant="secondary" size="sm" onClick={exportExcel} disabled={!!exporting}>
              {exporting==='excel' ? '...' : '⬇ Excel'}
            </Btn>
          </div>
        }
      />

      {/* Period selector */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
              ${period===p.value ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {p.label}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg" />
            <span className="text-gray-400">–</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg" />
          </div>
        )}
      </div>

      {loading ? <Spinner /> : !data ? null : (
        <>
          {/* Main KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Sales"     value={fmtCurrency(d.totalSales)}     color="blue"   icon="🛒" sub={`Revenue from all sales`} />
            <StatCard label="Total Profit"    value={fmtCurrency(d.totalProfit)}    color="green"  icon="💰" sub={`After cost of goods`} />
            <StatCard label="Total Purchases" value={fmtCurrency(d.totalPurchases)} color="orange" icon="📦" sub={`Inventory investment`} />
            <StatCard label="Total Expenses"  value={fmtCurrency(d.totalExpenses)}  color="red"    icon="💳" sub={`Operational costs`} />
          </div>

          {/* Net Profit Banner */}
          <div className={`rounded-xl p-5 mb-6 text-white ${d.netProfit >= 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-rose-600'}`}>
            <p className="text-sm opacity-80 mb-1">Net Profit (Profit − Expenses)</p>
            <p className="text-4xl font-bold">{fmtCurrency(d.netProfit)}</p>
            <p className="text-xs opacity-70 mt-1">
              Profit {fmtCurrency(d.totalProfit)} − Expenses {fmtCurrency(d.totalExpenses)}
            </p>
          </div>

          {/* Breakdown */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Sales Breakdown</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">📦 Product Sales</p>
              <p className="text-2xl font-bold text-gray-900">{fmtCurrency(d.breakdown?.productSales)}</p>
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-gray-500">Profit</p>
                <p className="text-lg font-semibold text-green-600">{fmtCurrency(d.breakdown?.productProfit)}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">📱 Mobile Sales</p>
              <p className="text-2xl font-bold text-gray-900">{fmtCurrency(d.breakdown?.mobileSales)}</p>
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-gray-500">Profit</p>
                <p className="text-lg font-semibold text-green-600">{fmtCurrency(d.breakdown?.mobileProfit)}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">🔧 Service Income</p>
              <p className="text-2xl font-bold text-gray-900">{fmtCurrency(d.breakdown?.serviceIncome)}</p>
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-gray-500">100% Profit</p>
                <p className="text-lg font-semibold text-green-600">{fmtCurrency(d.breakdown?.serviceIncome)}</p>
              </div>
            </div>
          </div>

          {/* Expense breakdown by category */}
          {d.expenses?.length > 0 && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Expense Breakdown</p>
              <div className="bg-white rounded-xl border divide-y mb-6">
                {d.expenses.map(e => (
                  <div key={e._id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="text-gray-700 capitalize font-medium">{e._id}</span>
                    <span className="text-red-600 font-semibold">{fmtCurrency(e.total)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 font-bold text-sm">
                  <span>Total Expenses</span>
                  <span className="text-red-600">{fmtCurrency(d.totalExpenses)}</span>
                </div>
              </div>
            </>
          )}

          {/* Important note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">📌 Profit Calculation Rules</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Profit = (Sale Price − Purchase Price) × Quantity — for products & mobiles</li>
              <li>Service income is 100% profit (no purchase cost)</li>
              <li>Purchases are inventory investments — not counted as loss</li>
              <li>Net Profit = Total Profit − Operational Expenses</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
