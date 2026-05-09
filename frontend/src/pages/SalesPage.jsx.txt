import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { salesAPI, productsAPI, mobilesAPI, customersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader, Modal, Btn, Field, Input, Select, SearchInput,
  Badge, EmptyState, Spinner, ConfirmDialog, fmtCurrency, fmtDateTime
} from '../components/shared/UI';

const EMPTY_ITEM = { itemType: 'product', product: '', usedMobile: '', name: '', salePrice: '', quantity: 1, purchasePrice: 0 };

export default function SalesPage() {
  const { isOwner, canViewProfit } = useAuth();
  const [sales,     setSales]    = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [period,    setPeriod]   = useState('today');
  const [modal,     setModal]    = useState(false);
  const [delId,     setDelId]    = useState(null);
  const [form,      setForm]     = useState({ items: [], customerName: '', paymentMethod: 'cash', discount: 0, notes: '' });
  const [items,     setItems]    = useState([{ ...EMPTY_ITEM }]);
  const [products,  setProducts] = useState([]);
  const [mobiles,   setMobiles]  = useState([]);
  const [customers, setCustomers]= useState([]);
  const [saving,    setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesAPI.getAll({ period });
      setSales(res.data.data);
    } catch { toast.error('Failed to load sales'); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const openModal = async () => {
    setItems([{ ...EMPTY_ITEM }]);
    setForm({ items: [], customerName: '', paymentMethod: 'cash', discount: 0, notes: '' });
    const [p, m, c] = await Promise.all([
      productsAPI.getAll({ limit: 200 }),
      mobilesAPI.getAll({ status: 'available', limit: 200 }),
      customersAPI.getAll(),
    ]);
    setProducts(p.data.data);
    setMobiles(m.data.data);
    setCustomers(c.data.data);
    setModal(true);
  };

  const updateItem = (idx, key, val) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      if (key === 'product' && val) {
        const p = products.find(x => x._id === val);
        if (p) { next[idx].salePrice = p.salePrice; next[idx].name = p.name; next[idx].purchasePrice = p.purchasePrice; }
      }
      if (key === 'usedMobile' && val) {
        const m = mobiles.find(x => x._id === val);
        if (m) { next[idx].salePrice = m.salePrice || m.purchasePrice; next[idx].name = `${m.brand} ${m.model}`; next[idx].purchasePrice = m.purchasePrice; }
      }
      return next;
    });
  };

  const addItem    = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const totalAmount = items.reduce((s, i) => s + (parseFloat(i.salePrice) || 0) * (parseInt(i.quantity) || 1), 0);
  const grandTotal  = totalAmount - (parseFloat(form.discount) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error('Add at least one item');
    setSaving(true);
    try {
      await salesAPI.create({ ...form, items, totalAmount: grandTotal });
      toast.success('Sale recorded!');
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await salesAPI.delete(delId); toast.success('Deleted'); setDelId(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const periods = [
    ['today', 'Today'], ['yesterday', 'Yesterday'],
    ['last7', '7 Days'], ['month', 'Month'], ['all', 'All']
  ];

  return (
    <div>
      <PageHeader
        title="Sales"
        action={<Btn onClick={openModal} size="sm">＋ New Sale</Btn>}
      />

      {/* Period filter - scrollable on mobile */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {periods.map(([v, l]) => (
          <button key={v} onClick={() => setPeriod(v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors shrink-0
              ${period === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : sales.length === 0 ? (
        <EmptyState icon="🛒" title="No sales for this period" />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Sale #', 'Date', 'Customer', 'Items', 'Total', canViewProfit && 'Profit', 'Payment', 'By', ''].filter(Boolean).map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 font-mono text-xs text-blue-600 whitespace-nowrap">{s.saleNumber}</td>
                      <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDateTime(s.createdAt)}</td>
                      <td className="px-3 py-3 text-gray-700 max-w-24 truncate">{s.customerName || s.customer?.name || '—'}</td>
                      <td className="px-3 py-3 text-gray-600">{s.items?.length} item{s.items?.length !== 1 ? 's' : ''}</td>
                      <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">{fmtCurrency(s.totalAmount)}</td>
                      {canViewProfit && <td className="px-3 py-3 text-green-600 font-medium whitespace-nowrap">{fmtCurrency(s.totalProfit)}</td>}
                      <td className="px-3 py-3"><Badge label={s.paymentMethod} color="blue" /></td>
                      <td className="px-3 py-3 text-xs text-gray-500">{s.createdBy?.username}</td>
                      <td className="px-3 py-3">
                        {isOwner && <Btn size="sm" variant="ghost" onClick={() => setDelId(s._id)}>🗑️</Btn>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2.5">
            {sales.map(s => (
              <div key={s._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-xs text-blue-600 font-semibold">{s.saleNumber}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(s.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge label={s.paymentMethod} color="blue" />
                    {isOwner && (
                      <button onClick={() => setDelId(s._id)} className="text-red-400 hover:text-red-600 text-lg">🗑️</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{s.customerName || s.customer?.name || 'Walk-in'}</p>
                    <p className="text-xs text-gray-500">{s.items?.length} item{s.items?.length !== 1 ? 's' : ''} • by {s.createdBy?.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-gray-900">{fmtCurrency(s.totalAmount)}</p>
                    {canViewProfit && <p className="text-xs text-green-600 font-medium">+{fmtCurrency(s.totalProfit)}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* New Sale Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Sale" size="xl">
        <form onSubmit={handleSubmit}>
          {/* Customer & Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Field label="Customer Name">
              <Input
                value={form.customerName}
                onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                placeholder="Walk-in customer"
                list="cust-list"
              />
              <datalist id="cust-list">{customers.map(c => <option key={c._id} value={c.name} />)}</datalist>
            </Field>
            <Field label="Payment Method">
              <Select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Transfer</option>
                <option value="other">Other</option>
              </Select>
            </Field>
          </div>

          {/* Items */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Sale Items</p>
              <Btn size="sm" variant="secondary" type="button" onClick={addItem}>＋ Add Item</Btn>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  {/* Row 1: Type + Item select */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <Select value={item.itemType} onChange={e => updateItem(idx, 'itemType', e.target.value)}>
                        <option value="product">Product</option>
                        <option value="mobile">Mobile</option>
                        <option value="service">Service</option>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Item</p>
                      {item.itemType === 'product' && (
                        <Select value={item.product} onChange={e => updateItem(idx, 'product', e.target.value)}>
                          <option value="">Select product</option>
                          {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.stock})</option>)}
                        </Select>
                      )}
                      {item.itemType === 'mobile' && (
                        <Select value={item.usedMobile} onChange={e => updateItem(idx, 'usedMobile', e.target.value)}>
                          <option value="">Select mobile</option>
                          {mobiles.map(m => <option key={m._id} value={m._id}>{m.brand} {m.model}</option>)}
                        </Select>
                      )}
                      {item.itemType === 'service' && (
                        <Input value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="Description" />
                      )}
                    </div>
                  </div>

                  {/* Row 2: Price + Qty + Total + Delete */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Price</p>
                      <Input type="number" min="0" value={item.salePrice}
                        onChange={e => updateItem(idx, 'salePrice', e.target.value)} placeholder="0" />
                    </div>
                    <div className="w-16">
                      <p className="text-xs text-gray-500 mb-1">Qty</p>
                      <Input type="number" min="1" value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                        disabled={item.itemType === 'mobile'} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Total</p>
                      <p className="text-sm font-bold text-gray-800 py-2">{fmtCurrency((item.salePrice || 0) * (item.quantity || 1))}</p>
                    </div>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)}
                        className="text-red-400 hover:text-red-600 text-xl mb-1.5 shrink-0">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-3 mb-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{fmtCurrency(totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Discount</span>
              <Input type="number" min="0" value={form.discount}
                onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                className="w-28 text-right" placeholder="0" />
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t pt-2">
              <span>Grand Total</span>
              <span className="text-indigo-600">{fmtCurrency(grandTotal)}</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Btn variant="secondary" type="button" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving} variant="success">
              {saving ? 'Saving...' : '✅ Record Sale'}
            </Btn>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={handleDelete}
        title="Delete Sale" danger message="This sale will be soft-deleted." />
    </div>
  );
}
