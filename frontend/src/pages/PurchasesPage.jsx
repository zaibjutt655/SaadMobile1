// ─── PURCHASES PAGE ───────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { purchasesAPI, productsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Modal, Btn, Field, Input, Select, EmptyState, Spinner, fmtCurrency, fmtDate } from '../components/shared/UI';

const EMPTY_P = { productName:'', product:'', supplier:'', quantity:1, purchasePrice:'', notes:'' };

export const PurchasesPage = () => {
  const { isOwner } = useAuth();
  const [purchases,setP]   = useState([]);
  const [loading,  setL]   = useState(true);
  const [modal,    setM]   = useState(false);
  const [form,     setF]   = useState(EMPTY_P);
  const [products, setProd]= useState([]);
  const [saving,   setS]   = useState(false);

  const load = useCallback(async () => {
    setL(true);
    try { const r = await purchasesAPI.getAll(); setP(r.data.data); }
    catch { toast.error('Load failed'); } finally { setL(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openModal = async () => {
    const r = await productsAPI.getAll({ limit:200 });
    setProd(r.data.data); setF(EMPTY_P); setM(true);
  };

  const fld = k => e => setF(prev => {
    const next = { ...prev, [k]: e.target.value };
    if (k === 'product' && e.target.value) {
      const p = products.find(x => x._id === e.target.value);
      if (p) { next.productName = p.name; next.purchasePrice = p.purchasePrice; }
    }
    return next;
  });

  const handleSave = async (e) => {
    e.preventDefault(); setS(true);
    try {
      await purchasesAPI.create(form);
      toast.success('Purchase recorded'); setM(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setS(false); }
  };

  const total = (parseFloat(form.purchasePrice)||0) * (parseInt(form.quantity)||1);

  return (
    <div>
      <PageHeader title="Purchases" action={<Btn onClick={openModal}>＋ Record Purchase</Btn>} />
      {loading ? <Spinner /> : purchases.length === 0 ? (
        <EmptyState icon="📦" title="No purchases recorded" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Ref','Product','Supplier','Qty','Unit Price','Total','Date','By'].map(h=>(
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {purchases.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-mono text-xs text-gray-500">{p.purchaseNumber}</td>
                  <td className="px-3 py-3 font-medium text-gray-900">{p.productName}</td>
                  <td className="px-3 py-3 text-gray-500">{p.supplier || '—'}</td>
                  <td className="px-3 py-3 text-gray-800">{p.quantity}</td>
                  <td className="px-3 py-3 text-gray-600">{fmtCurrency(p.purchasePrice)}</td>
                  <td className="px-3 py-3 font-semibold text-gray-900">{fmtCurrency(p.totalCost)}</td>
                  <td className="px-3 py-3 text-xs text-gray-400">{fmtDate(p.createdAt)}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{p.createdBy?.username}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => setM(false)} title="Record Purchase">
        <form onSubmit={handleSave}>
          <Field label="Product" required>
            <Select value={form.product} onChange={fld('product')}>
              <option value="">-- Select or type below --</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Product Name (if not listed)" required>
            <Input value={form.productName} onChange={fld('productName')} required placeholder="Product name" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Supplier"><Input value={form.supplier} onChange={fld('supplier')} placeholder="Supplier name" /></Field>
            <Field label="Quantity" required><Input type="number" min="1" value={form.quantity} onChange={fld('quantity')} required /></Field>
            <Field label="Purchase Price" required><Input type="number" min="0" value={form.purchasePrice} onChange={fld('purchasePrice')} required placeholder="0" /></Field>
            <Field label="Total Cost"><div className="px-3 py-2 bg-gray-50 rounded-lg text-sm font-semibold">{fmtCurrency(total)}</div></Field>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs text-yellow-700">
            ℹ️ Purchase cost is an inventory investment — it is NOT counted as a loss or expense.
          </div>
          <div className="flex gap-2 justify-end">
            <Btn variant="secondary" type="button" onClick={() => setM(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : 'Record Purchase'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PurchasesPage;
