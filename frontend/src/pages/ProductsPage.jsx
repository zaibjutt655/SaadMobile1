import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { productsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  PageHeader, Modal, Btn, Field, Input, Select, SearchInput,
  Badge, EmptyState, Spinner, ConfirmDialog, fmtCurrency, fmtDate
} from '../components/shared/UI';

const EMPTY = { name:'', category:'accessory', purchasePrice:'', salePrice:'', stock:'', sku:'', description:'' };
const CATS = { accessory:'Accessory', protector:'Protector', cover:'Cover', other:'Other' };
const CAT_COLOR = { accessory:'blue', protector:'purple', cover:'green', other:'gray' };

export default function ProductsPage() {
  const { canEdit, isOwner } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('');
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [delId,    setDelId]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({ search, category: catFilter });
      setProducts(res.data.data);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await productsAPI.update(editing._id, form);
        toast.success('Product updated');
      } else {
        await productsAPI.create(form);
        toast.success('Product added');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await productsAPI.delete(delId);
      toast.success('Product deleted');
      setDelId(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const profit = (p) => p.salePrice - p.purchasePrice;
  const margin = (p) => p.purchasePrice > 0 ? ((profit(p) / p.purchasePrice) * 100).toFixed(0) : 0;

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Accessories, Protectors & Covers — stored permanently"
        action={canEdit && <Btn onClick={openAdd}>＋ Add Product</Btn>}
      />

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-48"><SearchInput value={search} onChange={setSearch} placeholder="Search products..." /></div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          {Object.entries(CATS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? <Spinner /> : products.length === 0 ? (
        <EmptyState icon="🏷️" title="No products yet" message="Add your first product to get started" />
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Name','Category','Buy','Sell','Profit','Stock','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.name}
                      {p.sku && <span className="text-xs text-gray-400 ml-2">#{p.sku}</span>}
                    </td>
                    <td className="px-4 py-3"><Badge label={CATS[p.category]} color={CAT_COLOR[p.category]} /></td>
                    <td className="px-4 py-3 text-gray-600">{fmtCurrency(p.purchasePrice)}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{fmtCurrency(p.salePrice)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${profit(p) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {fmtCurrency(profit(p))} ({margin(p)}%)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${p.stock < 5 ? 'text-red-500' : 'text-gray-800'}`}>
                        {p.stock}
                      </span>
                      {p.stock < 5 && <span className="text-xs text-red-400 ml-1">low</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {canEdit && (
                          <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}>✏️</Btn>
                        )}
                        {isOwner && (
                          <Btn size="sm" variant="ghost" onClick={() => setDelId(p._id)}>🗑️</Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Product Name" required className="col-span-2">
              <Input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required placeholder="e.g. Samsung Case" />
            </Field>
            <Field label="Category" required>
              <Select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
                {Object.entries(CATS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="SKU (optional)">
              <Input value={form.sku} onChange={e => setForm(f=>({...f,sku:e.target.value}))} placeholder="SKU code" />
            </Field>
            <Field label="Purchase Price" required>
              <Input type="number" min="0" value={form.purchasePrice} onChange={e => setForm(f=>({...f,purchasePrice:e.target.value}))} required placeholder="0" />
            </Field>
            <Field label="Sale Price" required>
              <Input type="number" min="0" value={form.salePrice} onChange={e => setForm(f=>({...f,salePrice:e.target.value}))} required placeholder="0" />
            </Field>
            <Field label="Current Stock">
              <Input type="number" min="0" value={form.stock} onChange={e => setForm(f=>({...f,stock:e.target.value}))} placeholder="0" />
            </Field>
          </div>
          {/* Profit preview */}
          {form.salePrice && form.purchasePrice && (
            <div className="bg-green-50 rounded-lg px-3 py-2 text-sm text-green-700 mb-4">
              Profit per unit: {fmtCurrency(form.salePrice - form.purchasePrice)}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Btn variant="secondary" onClick={() => setModal(false)} type="button">Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Product'}</Btn>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!delId} onClose={() => setDelId(null)} onConfirm={handleDelete}
        title="Delete Product" danger
        message="This will soft-delete the product. It won't appear in active inventory but data is preserved."
      />
    </div>
  );
}
