import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { customersAPI } from '../utils/api';
import { PageHeader, Modal, Btn, Field, Input, Textarea, SearchInput, EmptyState, Spinner, fmtDate } from '../components/shared/UI';

const EMPTY_C = { name:'', phone:'', email:'', address:'', notes:'' };

export default function CustomersPage() {
  const [customers, setC] = useState([]);
  const [loading,   setL] = useState(true);
  const [search,    setSe]= useState('');
  const [modal,     setM] = useState(false);
  const [editing,   setE] = useState(null);
  const [form,      setF] = useState(EMPTY_C);
  const [saving,    setSv]= useState(false);

  const load = useCallback(async () => {
    setL(true);
    try { const r = await customersAPI.getAll({ search }); setC(r.data.data); }
    catch { toast.error('Load failed'); } finally { setL(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setE(null); setF(EMPTY_C); setM(true); };
  const openEdit = (c) => { setE(c); setF({ ...c }); setM(true); };
  const f = k => e => setF(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSv(true);
    try {
      editing ? await customersAPI.update(editing._id, form) : await customersAPI.create(form);
      toast.success(editing ? 'Updated' : 'Customer added');
      setM(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSv(false); }
  };

  return (
    <div>
      <PageHeader title="Customers" subtitle="Stored permanently — never auto-deleted"
        action={<Btn onClick={openAdd}>＋ Add Customer</Btn>} />
      <div className="mb-4"><SearchInput value={search} onChange={setSe} placeholder="Search by name or phone..." /></div>
      {loading ? <Spinner /> : customers.length === 0 ? (
        <EmptyState icon="👥" title="No customers yet" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Name','Phone','Email','Added',''].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {customers.map(c => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(c.createdAt)}</td>
                  <td className="px-4 py-3"><Btn size="sm" variant="ghost" onClick={() => openEdit(c)}>✏️</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modal} onClose={() => setM(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSave}>
          <Field label="Full Name" required><Input value={form.name} onChange={f('name')} required placeholder="Customer name" /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={f('phone')} placeholder="03xx-xxxxxxx" /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={f('email')} placeholder="email@example.com" /></Field>
          <Field label="Address"><Input value={form.address} onChange={f('address')} placeholder="Address" /></Field>
          <Field label="Notes"><Textarea value={form.notes} onChange={f('notes')} placeholder="Any notes..." /></Field>
          <div className="flex gap-2 justify-end">
            <Btn variant="secondary" type="button" onClick={() => setM(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Customer'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
