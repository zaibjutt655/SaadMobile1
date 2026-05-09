import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { expensesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader, Modal, Btn, Field, Input, Select, Textarea,
  Badge, EmptyState, Spinner, ConfirmDialog, fmtCurrency, fmtDate
} from '../components/shared/UI';

const EMPTY = { category:'rent', description:'', amount:'', date: new Date().toISOString().slice(0,10), notes:'' };
const CATS  = { rent:'Rent', electricity:'Electricity', salary:'Salary', internet:'Internet', supplies:'Supplies', other:'Other' };
const CAT_COLOR = { rent:'blue', electricity:'yellow', salary:'purple', internet:'green', supplies:'orange', other:'gray' };

export default function ExpensesPage() {
  const { isOwner } = useAuth();
  const [expenses, setE] = useState([]);
  const [loading,  setL] = useState(true);
  const [modal,    setM] = useState(false);
  const [form,     setF] = useState(EMPTY);
  const [saving,   setSv]= useState(false);
  const [delId,    setD] = useState(null);
  const [startDate, setSD] = useState('');
  const [endDate,   setED] = useState('');

  const load = useCallback(async () => {
    setL(true);
    try {
      const params = {};
      if (startDate && endDate) { params.startDate = startDate; params.endDate = endDate; }
      const r = await expensesAPI.getAll(params);
      setE(r.data.data);
    } catch { toast.error('Load failed'); }
    finally { setL(false); }
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const f = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSv(true);
    try {
      await expensesAPI.create(form);
      toast.success('Expense recorded'); setM(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSv(false); }
  };

  const handleDelete = async () => {
    try { await expensesAPI.delete(delId); toast.success('Deleted'); setD(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Rent, electricity, salary and other operational costs"
        action={<Btn onClick={() => { setF(EMPTY); setM(true); }}>＋ Add Expense</Btn>}
      />

      {/* Date filter */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <input type="date" value={startDate} onChange={e => setSD(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        <span className="text-gray-400 text-sm">to</span>
        <input type="date" value={endDate} onChange={e => setED(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg" />
        {(startDate || endDate) && (
          <Btn size="sm" variant="secondary" onClick={() => { setSD(''); setED(''); }}>Clear</Btn>
        )}
        {expenses.length > 0 && (
          <div className="ml-auto bg-red-50 border border-red-100 rounded-lg px-4 py-2 text-sm">
            <span className="text-gray-500">Total: </span>
            <span className="font-bold text-red-600">{fmtCurrency(total)}</span>
          </div>
        )}
      </div>

      {loading ? <Spinner /> : expenses.length === 0 ? (
        <EmptyState icon="💳" title="No expenses recorded" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Category','Description','Amount','Date','By',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {expenses.map(e => (
                <tr key={e._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><Badge label={CATS[e.category]} color={CAT_COLOR[e.category]} /></td>
                  <td className="px-4 py-3 text-gray-800">{e.description}</td>
                  <td className="px-4 py-3 font-semibold text-red-600">{fmtCurrency(e.amount)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(e.date)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{e.createdBy?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {isOwner && <Btn size="sm" variant="ghost" onClick={() => setD(e._id)}>🗑️</Btn>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setM(false)} title="Add Expense">
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              <Select value={form.category} onChange={f('category')}>
                {Object.entries(CATS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Date" required>
              <Input type="date" value={form.date} onChange={f('date')} required />
            </Field>
            <Field label="Description" required className="col-span-2">
              <Input value={form.description} onChange={f('description')} required placeholder="Describe the expense" />
            </Field>
            <Field label="Amount (Rs)" required className="col-span-2">
              <Input type="number" min="0" value={form.amount} onChange={f('amount')} required placeholder="0" />
            </Field>
          </div>
          <div className="flex gap-2 justify-end">
            <Btn variant="secondary" type="button" onClick={() => setM(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Expense'}</Btn>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!delId} onClose={() => setD(null)} onConfirm={handleDelete}
        title="Delete Expense" danger message="This expense will be soft-deleted." />
    </div>
  );
}
