import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { mobilesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader, Modal, Btn, Field, Input, Select, SearchInput,
  Badge, EmptyState, Spinner, ConfirmDialog, fmtCurrency, fmtDate
} from '../components/shared/UI';
import CameraScanner from '../components/shared/CameraScanner';

const EMPTY = { imei:'', imei2:'', brand:'', model:'', storage:'', color:'', condition:'good', purchasePrice:'', salePrice:'', purchasedFrom:'', notes:'' };
const CONDITIONS = { excellent:'Excellent', good:'Good', fair:'Fair', poor:'Poor' };
const COND_COLOR  = { excellent:'green', good:'blue', fair:'yellow', poor:'red' };

function ImeiField({ label, value, onChange, disabled, required, onCameraClick }) {
  return (
    <Field label={label} required={required}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">📶</span>
          <input type="text" value={value} onChange={e => onChange(e.target.value)}
            disabled={disabled} required={required} placeholder="Type or scan IMEI..." maxLength={20} inputMode="numeric"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100" />
        </div>
        <button type="button" onClick={onCameraClick} disabled={disabled}
          className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-lg transition-all shrink-0 shadow-md disabled:opacity-40">
          📷
        </button>
      </div>
    </Field>
  );
}

function ImeiLookup() {
  const [query,  setQuery]  = useState('');
  const [result, setResult] = useState(null);
  const [loading,setLoad]   = useState(false);
  const [scanner,setScanner]= useState(false);

  const doSearch = useCallback(async (val) => {
    const v = (val ?? query).trim(); if (!v) return;
    setLoad(true);
    try { const res = await mobilesAPI.searchIMEI(v); setResult(res.data.data); }
    catch { toast.error('IMEI not found'); setResult(null); }
    finally { setLoad(false); }
  }, [query]);

  const handleScan = (code) => { setQuery(code); setScanner(false); doSearch(code); };

  return (
    <>
      {scanner && <CameraScanner title="Scan IMEI Barcode" onScan={handleScan} onClose={() => setScanner(false)} />}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
        <p className="text-xs font-bold text-blue-700 mb-2">🔍 Quick IMEI / Barcode Lookup</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📶</span>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && doSearch()}
              placeholder="Type IMEI or tap 📷 to scan..." inputMode="numeric"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          <button type="button" onClick={() => setScanner(true)}
            className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xl hover:bg-blue-700 active:scale-95 transition-all shrink-0 shadow">
            📷
          </button>
          <Btn size="sm" onClick={() => doSearch()} disabled={loading}>{loading ? '...' : 'Find'}</Btn>
        </div>
        {result && (
          <div className="mt-3 bg-white rounded-xl p-3 shadow-sm space-y-1">
            <div className="flex justify-between items-start gap-2">
              <p className="font-semibold text-gray-900">{result.brand} {result.model}</p>
              <Badge label={result.status} color={result.status==='sold'?'red':'green'} />
            </div>
            <p className="text-xs font-mono text-gray-500">① {result.imei}</p>
            {result.imei2 && <p className="text-xs font-mono text-gray-500">② {result.imei2}</p>}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-1 border-t">
              <span>Buy: <strong>{fmtCurrency(result.purchasePrice)}</strong></span>
              <span>Sell: <strong>{fmtCurrency(result.salePrice)}</strong></span>
              <span>Cond: <strong>{CONDITIONS[result.condition]}</strong></span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function MobilesPage() {
  const { canEdit, isOwner } = useAuth();
  const [mobiles,setMobiles]          = useState([]);
  const [loading,setLoading]          = useState(true);
  const [search,setSearch]            = useState('');
  const [statusFilter,setStatusFilter]= useState('');
  const [modal,setModal]              = useState(false);
  const [editing,setEditing]          = useState(null);
  const [form,setForm]                = useState(EMPTY);
  const [saving,setSaving]            = useState(false);
  const [delId,setDelId]              = useState(null);
  const [activeScan,setActiveScan]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await mobilesAPI.getAll({ search, status: statusFilter }); setMobiles(res.data.data); }
    catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...m, imei2: m.imei2||'' }); setModal(true); };
  const closeModal = () => { setModal(false); setActiveScan(null); };

  const handleScanResult = (code) => {
    if (activeScan==='imei1') { setForm(p=>({...p,imei:code})); toast.success('IMEI 1 scanned!'); }
    else if (activeScan==='imei2') { setForm(p=>({...p,imei2:code})); toast.success('IMEI 2 scanned!'); }
    setActiveScan(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.imei.length < 8) return toast.error('IMEI 1 too short');
    if (form.imei2 && form.imei2.length < 8) return toast.error('IMEI 2 too short');
    setSaving(true);
    try {
      editing ? await mobilesAPI.update(editing._id, form) : await mobilesAPI.create(form);
      toast.success(editing ? 'Updated!' : 'Mobile added!');
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await mobilesAPI.delete(delId); toast.success('Deleted'); setDelId(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const profit = (m) => m.salePrice ? m.salePrice - m.purchasePrice : null;

  return (
    <div>
      {activeScan && (
        <CameraScanner
          title={activeScan==='imei1' ? 'Scan IMEI 1' : 'Scan IMEI 2 (optional)'}
          onScan={handleScanResult}
          onClose={() => setActiveScan(null)}
        />
      )}

      <PageHeader title="Used Mobiles" subtitle="Dual IMEI • Camera Scanner"
        action={canEdit && <Btn onClick={openAdd} size="sm">＋ Add Mobile</Btn>} />

      <ImeiLookup />

      <div className="flex gap-2 mb-4">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search brand, model, IMEI..." /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-2 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {loading ? <Spinner /> : mobiles.length === 0 ? <EmptyState icon="📱" title="No mobiles yet" /> : (
        <>
          <div className="hidden sm:block bg-white rounded-xl border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['IMEI 1','IMEI 2','Device','Cond.','Buy','Sell','Profit','Status',''].map(h=>(
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mobiles.map(m => (
                    <tr key={m._id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 font-mono text-xs text-gray-700">{m.imei}</td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-400">{m.imei2||'—'}</td>
                      <td className="px-3 py-3"><p className="font-medium text-gray-900 whitespace-nowrap">{m.brand} {m.model}</p><p className="text-xs text-gray-400">{m.storage} {m.color}</p></td>
                      <td className="px-3 py-3"><Badge label={CONDITIONS[m.condition]} color={COND_COLOR[m.condition]} /></td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{fmtCurrency(m.purchasePrice)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{m.salePrice?fmtCurrency(m.salePrice):'—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{profit(m)!==null?<span className={`text-xs font-semibold ${profit(m)>=0?'text-green-600':'text-red-500'}`}>{fmtCurrency(profit(m))}</span>:'—'}</td>
                      <td className="px-3 py-3"><Badge label={m.status} color={m.status==='sold'?'red':'green'} /></td>
                      <td className="px-3 py-3"><div className="flex gap-1">
                        {canEdit && <Btn size="sm" variant="ghost" onClick={() => openEdit(m)}>✏️</Btn>}
                        {isOwner && <Btn size="sm" variant="ghost" onClick={() => setDelId(m._id)}>🗑️</Btn>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sm:hidden space-y-2.5">
            {mobiles.map(m => (
              <div key={m._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{m.brand} {m.model}</p>
                    <p className="text-xs font-mono text-gray-500 truncate">① {m.imei}</p>
                    {m.imei2 && <p className="text-xs font-mono text-gray-400 truncate">② {m.imei2}</p>}
                    <p className="text-xs text-gray-400">{m.storage} · {m.color}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge label={m.status} color={m.status==='sold'?'red':'green'} />
                    <Badge label={CONDITIONS[m.condition]} color={COND_COLOR[m.condition]} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[['Buy',fmtCurrency(m.purchasePrice),'gray'],['Sell',m.salePrice?fmtCurrency(m.salePrice):'—','gray'],['Profit',profit(m)!==null?fmtCurrency(profit(m)):'—','green']].map(([l,v,c])=>(
                    <div key={l} className={`bg-${c}-50 rounded-lg p-2 text-center`}>
                      <p className="text-xs text-gray-400">{l}</p>
                      <p className="text-sm font-semibold">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-1">
                  {canEdit && <Btn size="sm" variant="ghost" onClick={() => openEdit(m)}>✏️</Btn>}
                  {isOwner && <Btn size="sm" variant="ghost" onClick={() => setDelId(m._id)}>🗑️</Btn>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={modal} onClose={closeModal} title={editing ? 'Edit Mobile' : 'Add Used Mobile'} size="lg">
        <form onSubmit={handleSave}>
          {!editing && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 mb-4 text-xs text-indigo-700">
              <span className="text-lg shrink-0">📷</span>
              Tap the <strong className="mx-1">📷</strong> button to scan IMEI with your phone camera!
            </div>
          )}

          <ImeiField label="IMEI 1" value={form.imei} onChange={v=>setForm(p=>({...p,imei:v}))}
            required disabled={!!editing} onCameraClick={() => setActiveScan('imei1')} />

          <ImeiField label="IMEI 2 (optional — dual SIM)" value={form.imei2} onChange={v=>setForm(p=>({...p,imei2:v}))}
            required={false} disabled={!!editing} onCameraClick={() => setActiveScan('imei2')} />

          {(form.imei||form.imei2) && (
            <div className="flex gap-2 mb-3">
              {form.imei && <div className="flex-1 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs">
                <p className="text-gray-400 mb-0.5 font-medium">① IMEI 1</p>
                <p className="font-mono font-bold text-green-800 break-all">{form.imei}</p>
              </div>}
              {form.imei2 && <div className="flex-1 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs">
                <p className="text-gray-400 mb-0.5 font-medium">② IMEI 2</p>
                <p className="font-mono font-bold text-green-800 break-all">{form.imei2}</p>
              </div>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand" required><Input value={form.brand} onChange={e=>setForm(p=>({...p,brand:e.target.value}))} required placeholder="Samsung, Apple..." /></Field>
            <Field label="Model" required><Input value={form.model} onChange={e=>setForm(p=>({...p,model:e.target.value}))} required placeholder="Galaxy A54..." /></Field>
            <Field label="Storage"><Input value={form.storage} onChange={e=>setForm(p=>({...p,storage:e.target.value}))} placeholder="128GB" /></Field>
            <Field label="Color"><Input value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} placeholder="Black" /></Field>
            <Field label="Condition">
              <Select value={form.condition} onChange={e=>setForm(p=>({...p,condition:e.target.value}))}>
                {Object.entries(CONDITIONS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Purchased From"><Input value={form.purchasedFrom} onChange={e=>setForm(p=>({...p,purchasedFrom:e.target.value}))} placeholder="Supplier" /></Field>
            <Field label="Purchase Price" required><Input type="number" min="0" value={form.purchasePrice} onChange={e=>setForm(p=>({...p,purchasePrice:e.target.value}))} required placeholder="0" /></Field>
            <Field label="Sale Price"><Input type="number" min="0" value={form.salePrice} onChange={e=>setForm(p=>({...p,salePrice:e.target.value}))} placeholder="0" /></Field>
          </div>

          {form.purchasePrice && form.salePrice && (
            <div className={`rounded-xl px-3 py-2 text-sm mb-3 font-medium ${+form.salePrice>=+form.purchasePrice?'bg-green-50 text-green-700':'bg-red-50 text-red-600'}`}>
              {+form.salePrice>=+form.purchasePrice?'✅':'⚠️'} Profit: {fmtCurrency(form.salePrice-form.purchasePrice)}
            </div>
          )}

          <div className="flex gap-2 justify-end mt-2">
            <Btn variant="secondary" type="button" onClick={closeModal}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving?'Saving...':editing?'Update':'Add Mobile'}</Btn>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={handleDelete}
        title="Delete Mobile" danger message="Soft-delete this mobile record?" />
    </div>
  );
}
