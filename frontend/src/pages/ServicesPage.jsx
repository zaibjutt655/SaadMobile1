import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { servicesAPI, customersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Modal, Btn, Field, Input, Select, Textarea, Badge, EmptyState, Spinner, fmtCurrency, fmtDate } from '../components/shared/UI';

const EMPTY = { type:'repair', description:'', deviceInfo:'', imei:'', charge:'', customerName:'', status:'pending', notes:'' };
const STATUS_COLOR = { pending:'yellow', 'in-progress':'blue', completed:'green', cancelled:'red' };

export default function ServicesPage() {
  const { canEdit, isOwner } = useAuth();
  const [services,  setS] = useState([]);
  const [loading,   setL] = useState(true);
  const [modal,     setM] = useState(false);
  const [form,      setF] = useState(EMPTY);
  const [editing,   setE] = useState(null);
  const [saving,    setSv]= useState(false);
  const [customers, setC] = useState([]);

  const load = useCallback(async () => {
    setL(true);
    try { const r = await servicesAPI.getAll(); setS(r.data.data); }
    catch { toast.error('Load failed'); } finally { setL(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = async () => {
    const c = await customersAPI.getAll();
    setC(c.data.data); setE(null); setF(EMPTY); setM(true);
  };

  const openEdit = (s) => { setE(s); setF({ ...s }); setM(true); };

  const f = k => e => setF(prev => ({ ...prev, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSv(true);
    try {
      editing ? await servicesAPI.update(editing._id, form) : await servicesAPI.create(form);
      toast.success(editing ? 'Updated' : 'Service job created');
      setM(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSv(false); }
  };

  return (
    <div>
      <PageHeader title="Services" subtitle="Repair & software jobs — 100% profit"
        action={<Btn onClick={openAdd}>＋ New Job</Btn>} />

      {loading ? <Spinner /> : services.length === 0 ? (
        <EmptyState icon="🔧" title="No service jobs" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Job#','Type','Description','Device','Customer','Charge','Status','Date',''].map(h=>(
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {services.map(s => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-mono text-xs text-blue-600">{s.serviceNumber}</td>
                  <td className="px-3 py-3"><Badge label={s.type} color="purple" /></td>
                  <td className="px-3 py-3 text-gray-800 max-w-xs truncate">{s.description}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{s.deviceInfo || '—'}</td>
                  <td className="px-3 py-3 text-gray-600">{s.customerName || '—'}</td>
                  <td className="px-3 py-3 font-semibold text-green-700">{fmtCurrency(s.charge)}</td>
                  <td className="px-3 py-3"><Badge label={s.status} color={STATUS_COLOR[s.status]} /></td>
                  <td className="px-3 py-3 text-xs text-gray-400">{fmtDate(s.createdAt)}</td>
                  <td className="px-3 py-3">
                    {canEdit && <Btn size="sm" variant="ghost" onClick={() => openEdit(s)}>✏️</Btn>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setM(false)} title={editing ? 'Update Service' : 'New Service Job'}>
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Job Type" required>
              <Select value={form.type} onChange={f('type')}>
                <option value="repair">Repair</option>
                <option value="software">Software</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={f('status')}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </Field>
            <Field label="Description" required className="col-span-2">
              <Input value={form.description} onChange={f('description')} required placeholder="e.g. Screen replacement" />
            </Field>
            <Field label="Device Info">
              <Input value={form.deviceInfo} onChange={f('deviceInfo')} placeholder="iPhone 13 Pro" />
            </Field>
            <Field label="IMEI (optional)">
              <Input value={form.imei} onChange={f('imei')} placeholder="IMEI" />
            </Field>
            <Field label="Customer Name">
              <Input value={form.customerName} onChange={f('customerName')} placeholder="Customer" list="svc-cust" />
              <datalist id="svc-cust">{customers.map(c => <option key={c._id} value={c.name} />)}</datalist>
            </Field>
            <Field label="Charge (Rs)" required>
              <Input type="number" min="0" value={form.charge} onChange={f('charge')} required placeholder="0" />
            </Field>
          </div>
          {form.charge && (
            <div className="bg-green-50 rounded-lg px-3 py-2 text-sm text-green-700 mb-3">
              Service income = 100% profit: {fmtCurrency(form.charge)}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Btn variant="secondary" type="button" onClick={() => setM(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create Job'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
