import React, { useState, useEffect } from 'react';
import { reportsAPI, closingAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StatCard, Spinner, fmtCurrency, fmtDate, Btn } from '../components/shared/UI';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, isOwner } = useAuth();
  const [summary, setSummary]   = useState(null);
  const [closing, setClosing]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [closing2, setClosing2] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
    if (!window.confirm('Run daily closing now? This will lock all today\'s records.')) return;
    setClosing2(true);
    try {
      await closingAPI.runClosing();
      toast.success('Daily closing completed successfully');
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
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <span className="text-lg">📅</span>
            {new Date().toLocaleDateString('en-PK', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 animate-slide-in-right">
          {closing?.isClosed ? (
            <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-full font-semibold shadow-lg flex items-center gap-2 animate-bounce-in">
              <span className="text-base">✅</span> Day Closed
            </span>
          ) : (
            <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm rounded-full font-semibold shadow-lg flex items-center gap-2 animate-pulse">
              <span className="text-base">🔓</span> Day Open
            </span>
          )}
          {isOwner && !closing?.isClosed && (
            <Btn size="md" onClick={handleManualClose} disabled={closing2} className="shadow-lg">
              {closing2 ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Closing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>🔒</span> Close Day
                </span>
              )}
            </Btn>
          )}
        </div>
      </div>

      {/* Today's KPIs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Today's Performance</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StatCard label="Total Sales" value={fmtCurrency(d.totalSales)} color="blue" icon="🛒"
            sub={`${d.saleCount || 0} transactions`} />
          <StatCard label="Total Profit" value={fmtCurrency(d.totalProfit)} color="green" icon="💰"
            sub="Revenue earned" />
          <StatCard label="Purchases" value={fmtCurrency(d.totalPurchases)} color="orange" icon="📦"
            sub="Inventory investment" />
          <StatCard label="Expenses" value={fmtCurrency(d.totalExpenses)} color="red" icon="💳"
            sub="Operational costs" />
        </div>
      </div>

      {/* Breakdown */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1 w-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></div>
          <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Revenue Breakdown</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover-lift shadow-sm hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-600">Product Sales</p>
              <span className="text-3xl">🏷️</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">{fmtCurrency(d.breakdown?.productSales)}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                  style={{width: `${Math.min((d.breakdown?.productProfit / d.breakdown?.productSales * 100) || 0, 100)}%`}}></div>
              </div>
              <p className="text-xs font-semibold text-green-600">+{fmtCurrency(d.breakdown?.productProfit)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover-lift shadow-sm hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-600">Mobile Sales</p>
              <span className="text-3xl">📱</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">{fmtCurrency(d.breakdown?.mobileSales)}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                  style={{width: `${Math.min((d.breakdown?.mobileProfit / d.breakdown?.mobileSales * 100) || 0, 100)}%`}}></div>
              </div>
              <p className="text-xs font-semibold text-blue-600">+{fmtCurrency(d.breakdown?.mobileProfit)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover-lift shadow-sm hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-600">Service Income</p>
              <span className="text-3xl">🔧</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">{fmtCurrency(d.breakdown?.serviceIncome)}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
              <p className="text-xs font-semibold text-purple-600">100% profit</p>
            </div>
          </div>
        </div>
      </div>

      {/* Net Profit - Enhanced */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl animate-gradient">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24 animate-float" style={{animationDelay: '1s'}}></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold opacity-90 mb-1 flex items-center gap-2">
                <span className="text-2xl">💎</span>
                Net Profit Today
              </p>
              <p className="text-5xl font-black mb-2 animate-count-up">{fmtCurrency(d.netProfit)}</p>
              <p className="text-sm opacity-80">
                Revenue {fmtCurrency(d.totalProfit)} − Expenses {fmtCurrency(d.totalExpenses)}
              </p>
            </div>
            <div className="text-6xl opacity-20 animate-pulse">
              {d.netProfit > 0 ? '📈' : '📊'}
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-6 pt-6 border-t border-white border-opacity-20">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="opacity-80">Profit Margin</span>
              <span className="font-bold">{d.totalSales > 0 ? ((d.totalProfit / d.totalSales) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="h-3 bg-white bg-opacity-20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-300 to-green-300 rounded-full transition-all duration-1000 ease-out"
                style={{width: `${d.totalSales > 0 ? Math.min((d.totalProfit / d.totalSales) * 100, 100) : 0}%`}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
