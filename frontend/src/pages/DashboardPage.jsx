import React, { useState, useEffect } from 'react';
import { reportsAPI, closingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StatCard, Spinner, fmtCurrency, Btn } from '../components/shared/UI';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, isOwner } = useAuth();
  const [summary,  setSummary]  = useState(null);
  const [closing,  setClosing]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [closing2, setClosing2] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [summaryRes, closingRes] = await Promise.all([
        reportsAPI.getSummary({ period: 'today' }),
        closingAPI.getToday(),
      ]);
      setSummary(summaryRes.data.data);
      setClosing(closingRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualClose = async () => {
    if (!window.confirm("Run daily closing now? This will lock today's records.")) return;
    setClosing2(true);
    try {
      await closingAPI.runClosing();
      toast.success('Daily closing completed!');
      loadData();
    } catch (err) {
      toast.error('Closing failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setClosing2(false);
    }
  };

  if (loading) return <Spinner />;

  const d = summary || {};

  return (
    <div className="animate-fade-in">

      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            👋 Hi, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {closing?.isClosed ? (
            <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold flex items-center gap-1">
              ✅ Day Closed
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-semibold flex items-center gap-1">
              🔓 Day Open
            </span>
          )}
          {isOwner && !closing?.isClosed && (
            <Btn size="sm" onClick={handleManualClose} disabled={closing2}>
              {closing2 ? 'Closing...' : '🔒 Close Day'}
            </Btn>
          )}
        </div>
      </div>

      {/* ─── KPI CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Sales"     value={fmtCurrency(d.totalSales)}     color="blue"   icon="🛒" sub={`${d.saleCount || 0} txns`} />
        <StatCard label="Profit"    value={fmtCurrency(d.totalProfit)}    color="green"  icon="💰" />
        <StatCard label="Purchases" value={fmtCurrency(d.totalPurchases)} color="orange" icon="📦" />
        <StatCard label="Expenses"  value={fmtCurrency(d.totalExpenses)}  color="red"    icon="💳" />
      </div>

      {/* ─── REVENUE BREAKDOWN ─── */}
      <div className="mb-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-8 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 inline-block rounded-full"></span>
          Revenue Breakdown
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Product Sales',  value: d.breakdown?.productSales,  profit: d.breakdown?.productProfit,  icon: '🏷️', color: 'from-green-400 to-emerald-500' },
            { label: 'Mobile Sales',   value: d.breakdown?.mobileSales,   profit: d.breakdown?.mobileProfit,   icon: '📱', color: 'from-blue-400 to-indigo-500' },
            { label: 'Service Income', value: d.breakdown?.serviceIncome, profit: d.breakdown?.serviceIncome,  icon: '🔧', color: 'from-purple-400 to-pink-500' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500">{item.label}</p>
                <span className="text-2xl">{item.icon}</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{fmtCurrency(item.value)}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                    style={{ width: `${Math.min((item.profit / item.value * 100) || 0, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs font-semibold text-green-600 whitespace-nowrap">+{fmtCurrency(item.profit)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── NET PROFIT BANNER ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-5 sm:p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold opacity-90 mb-1 flex items-center gap-2">
                <span>💎</span> Net Profit Today
              </p>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-black mb-1 truncate">
                {fmtCurrency(d.netProfit)}
              </p>
              <p className="text-xs sm:text-sm opacity-80">
                Revenue {fmtCurrency(d.totalProfit)} − Expenses {fmtCurrency(d.totalExpenses)}
              </p>
            </div>
            <span className="text-4xl sm:text-5xl opacity-20 shrink-0">
              {d.netProfit > 0 ? '📈' : '📊'}
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
              <span className="opacity-80">Profit Margin</span>
              <span className="font-bold">
                {d.totalSales > 0 ? ((d.totalProfit / d.totalSales) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-300 to-green-300 rounded-full transition-all duration-700"
                style={{ width: `${d.totalSales > 0 ? Math.min((d.totalProfit / d.totalSales) * 100, 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
