import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { mobilesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader, Modal, Btn, Field, Input, Select, SearchInput,
  Badge, EmptyState, Spinner, ConfirmDialog, fmtCurrency, fmtDate
} from '../components/shared/UI';

const EMPTY = { imei:'', brand:'', model:'', storage:'', color:'', condition:'good', purchasePrice:'', salePrice:'', purchasedFrom:'', notes:'' };
const CONDITIONS = { excellent:'Excellent', good:'Good', fair:'Fair', poor:'Poor' };
const COND_COLOR  = { excellent:'green', good:'blue', fair:'yellow', poor:'red' };

export default function MobilesPage() {
  const { canEdit, isOwner } = useAuth();
  const [mobiles,    setMobiles]   = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [search,     setSearch]    = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal,      setModal]     = useState(false);
  const [editing,    setEditing]   = useState(null);
  const [form,       setForm]      = useState(EMPTY);
  const [saving,     setSaving]    = useState(false);
  const [delId,      setDelId]     = useState(null);
  const [imeiSearch, setImeiSearch]= useState('');
  const [imeiResult, setImeiResult]= useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mobilesAPI.getAll({ search, status: statusFilter });
      setMobiles(res.data.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const searchByIMEI = async () => {
    if (!imeiSearch.trim()) return;
    try {
      const res = await mobilesAPI.searchIMEI(imeiSearch.trim());
      setImeiResult(res.data.data);
    } catch { toast.error('IMEI not found'); setImeiResult(null); }
  };

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...m }); setModal(true); };

  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      editing ? await mobilesAPI.update(editing._id, form) : await mobilesAPI.create(form);
      toast.success(editing ? 'Updated' : 'Mobile added');
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await mobilesAPI.delete(delId); toast.success('Deleted'); setDelId(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div>
      <PageHeader
        title="Used Mobiles"
        subtitle="IMEI-based tracking — stored permanently"
        action={canEdit && <Btn onClick={openAdd}>＋ Add Mobile</Btn>}
      />

      {/* IMEI Quick Search */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
        <p className="text-xs font-semibold text-blue-700 mb-2">🔍 IMEI Lookup</p>
        <div className="flex gap-2">
          <Input value={imeiSearch} onChange={e => setImeiSearch(e.target.value)}
            placeholder="Enter IMEI number..." onKeyDown={e => e.key==='Enter' && searchByIMEI()} />
          <Btn onClick={searchByIMEI}>Search</Btn>
        </div>
        {imeiResult && (
          <div className="mt-3 bg-white rounded-lg p-3 text-sm">
            <p className="font-semibold text-gray-800">{imeiResult.brand} {imeiResult.model}</p>
            <p className="text-gray-500">IMEI: {imeiResult.imei} | Status: <Badge label={imeiResult.status} color={imeiResult.status==='sold'?'red':'green'} /></p>
            <p className="text-gray-500">Buy: {fmtCurrency(imeiResult.purchasePrice)} | Sell: {fmtCurrency(imeiResult.salePrice)}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search brand, model..." /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {/* Table */}
      {loading ? <Spinner /> : mobiles.length === 0 ? (
        <EmptyState icon="📱" title="No mobiles yet" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['IMEI','Device','Condition','Buy Price','Sale Price','Profit','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {mobiles.map(m => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-mono text-xs text-gray-600">{m.imei}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-900">{m.brand} {m.model}</p>
                      <p className="text-xs text-gray-400">{m.storage} {m.color}</p>
                    </td>
                    <td className="px-3 py-3"><Badge label={CONDITIONS[m.condition]} color={COND_COLOR[m.condition]} /></td>
                    <td className="px-3 py-3 text-gray-600">{fmtCurrency(m.purchasePrice)}</td>
                    <td className="px-3 py-3 font-medium">{m.salePrice ? fmtCurrency(m.salePrice) : '—'}</td>
                    <td className="px-3 py-3 text-xs">
                      {m.salePrice ? (
                        <span className={m.salePrice >= m.purchasePrice ? 'text-green-600 font-medium' : 'text-red-500'}>
                          {fmtCurrency(m.salePrice - m.purchasePrice)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <Badge label={m.status} color={m.status==='sold'?'red':'green'} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        {canEdit && <Btn size="sm" variant="ghost" onClick={() => openEdit(m)}>✏️</Btn>}
                        {isOwner && <Btn size="sm" variant="ghost" onClick={() => setDelId(m._id)}>🗑️</Btn>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Mobile' : 'Add Used Mobile'} size="lg">
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="IMEI" required className="col-span-2">
              <Input value={form.imei} onChange={f('imei')} required placeholder="15-digit IMEI" disabled={!!editing} />
            </Field>
            <Field label="Brand" required>
              <Input value={form.brand} onChange={f('brand')} required placeholder="Samsung, Apple..." />
            </Field>
            <Field label="Model" required>
              <Input value={form.model} onChange={f('model')} required placeholder="Galaxy A54..." />
            </Field>
            <Field label="Storage">
              <Input value={form.storage} onChange={f('storage')} placeholder="128GB" />
            </Field>
            <Field label="Color">
              <Input value={form.color} onChange={f('color')} placeholder="Black" />
            </Field>
            <Field label="Condition">
              <Select value={form.condition} onChange={f('condition')}>
                {Object.entries(CONDITIONS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Purchased From">
              <Input value={form.purchasedFrom} onChange={f('purchasedFrom')} placeholder="Supplier name" />
            </Field>
            <Field label="Purchase Price" required>
              <Input type="number" min="0" value={form.purchasePrice} onChange={f('purchasePrice')} required placeholder="0" />
            </Field>
            <Field label="Sale Price">
              <Input type="number" min="0" value={form.salePrice} onChange={f('salePrice')} placeholder="0 (set when sold)" />
            </Field>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Btn variant="secondary" type="button" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Mobile'}</Btn>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={handleDelete}
        title="Delete Mobile" danger message="Soft-delete this mobile record? IMEI data is preserved." />
    </div>
  );
}
