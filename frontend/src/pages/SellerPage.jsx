import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { salesAPI, purchasesAPI, productsAPI, mobilesAPI, customersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Modal, Btn, Field, Input, Select, fmtCurrency, fmtDateTime } from '../components/shared/UI';
import { useNavigate } from 'react-router-dom';

const PERIODS = [['today','Today'],['yesterday','Yesterday'],['last7','Last 7 Days']];

export default function SellerPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [saleModal,     setSaleModal]     = useState(false);
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [period,        setPeriod]        = useState('today');
  const [sales,         setSales]         = useState([]);
  const [purchases,     setPurchases]     = useState([]);
  const [products,      setProducts]      = useState([]);
  const [mobiles,       setMobiles]       = useState([]);
  const [customers,     setCustomers]     = useState([]);
  const [saving,        setSaving]        = useState(false);

  // Sale form
  const [saleItems,   setSaleItems]   = useState([{ itemType:'product', product:'', usedMobile:'', name:'', salePrice:'', quantity:1 }]);
  const [salePay,     setSalePay]     = useState('cash');
  const [saleDisc,    setSaleDisc]    = useState(0);
  const [custName,    setCustName]    = useState('');

  // Purchase form
  const [purProduct,  setPurProduct]  = useState('');
  const [purName,     setPurName]     = useState('');
  const [purQty,      setPurQty]      = useState(1);
  const [purPrice,    setPurPrice]    = useState('');
  const [purSupplier, setPurSupplier] = useState('');

  const loadData = async () => {
    const [s, p, prods, mobs, custs] = await Promise.all([
      salesAPI.getAll({ period }),
      purchasesAPI.getAll({ period }),
      productsAPI.getAll({ limit: 200 }),
      mobilesAPI.getAll({ status:'available', limit: 200 }),
      customersAPI.getAll(),
    ]);
    setSales(s.data.data);
    setPurchases(p.data.data);
    setProducts(prods.data.data);
    setMobiles(mobs.data.data);
    setCustomers(custs.data.data);
  };

  useEffect(() => { loadData(); }, [period]);

  const updateSaleItem = (idx, key, val) => {
    setSaleItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      if (key === 'product' && val) {
        const p = products.find(x => x._id === val);
        if (p) { next[idx].salePrice = p.salePrice; next[idx].name = p.name; }
      }
      if (key === 'usedMobile' && val) {
        const m = mobiles.find(x => x._id === val);
        if (m) { next[idx].salePrice = m.salePrice || m.purchasePrice; next[idx].name = `${m.brand} ${m.model}`; }
      }
      return next;
    });
  };

  const saleTotal = saleItems.reduce((s, i) => s + (parseFloat(i.salePrice)||0)*(parseInt(i.quantity)||1), 0) - parseFloat(saleDisc||0);

  const handleSale = async () => {
    if (saleItems.some(i => !i.salePrice)) return toast.error('Set price for all items');
    setSaving(true);
    try {
      await salesAPI.create({ items: saleItems, customerName: custName, paymentMethod: salePay, discount: saleDisc, totalAmount: saleTotal });
      toast.success('✅ Sale recorded!');
      setSaleModal(false);
      setSaleItems([{ itemType:'product', product:'', usedMobile:'', name:'', salePrice:'', quantity:1 }]);
      setSalePay('cash'); setSaleDisc(0); setCustName('');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handlePurchase = async () => {
    if (!purName || !purPrice || !purQty) return toast.error('Fill required fields');
    setSaving(true);
    try {
      await purchasesAPI.create({ product: purProduct||undefined, productName: purName, quantity: purQty, purchasePrice: purPrice, supplier: purSupplier });
      toast.success('✅ Purchase recorded!');
      setPurchaseModal(false);
      setPurProduct(''); setPurName(''); setPurQty(1); setPurPrice(''); setPurSupplier('');
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <span className="font-bold">Mobile Shop POS</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Seller: {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/knowledge')}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg">❓ Help</button>
          <button onClick={logout}
            className="text-xs bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded-lg">Logout</button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Main Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={() => setSaleModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white rounded-2xl p-6 text-center shadow-lg active:scale-95 transition-transform">
            <span className="text-4xl block mb-2">🛒</span>
            <span className="text-lg font-bold">New Sale</span>
          </button>
          <button onClick={() => setPurchaseModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-6 text-center shadow-lg active:scale-95 transition-transform">
            <span className="text-4xl block mb-2">📦</span>
            <span className="text-lg font-bold">New Purchase</span>
          </button>
        </div>

        {/* Period tabs */}
        <div className="flex gap-2 mb-4">
          {PERIODS.map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors
                ${period===v ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600'}`}>{l}</button>
          ))}
        </div>

        {/* Today's sales */}
        <div className="bg-white rounded-xl border mb-4">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">Sales ({sales.length})</p>
            <p className="text-xs text-gray-500">
              Total: <span className="font-semibold text-green-700">{fmtCurrency(sales.reduce((s,x)=>s+x.totalAmount,0))}</span>
            </p>
          </div>
          {sales.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No sales yet</p>
          ) : (
            <div className="divide-y">
              {sales.slice(0,10).map(s => (
                <div key={s._id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-blue-600">{s.saleNumber}</p>
                    <p className="text-xs text-gray-500">{fmtDateTime(s.createdAt)} · {s.items?.length} item(s)</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{fmtCurrency(s.totalAmount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's purchases */}
        <div className="bg-white rounded-xl border">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold text-gray-800">Purchases ({purchases.length})</p>
          </div>
          {purchases.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No purchases yet</p>
          ) : (
            <div className="divide-y">
              {purchases.slice(0,5).map(p => (
                <div key={p._id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-800">{p.productName}</p>
                    <p className="text-xs text-gray-500">Qty: {p.quantity}</p>
                  </div>
                  <p className="text-xs font-medium text-gray-700">{fmtCurrency(p.totalCost)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── SALE MODAL ──────────────────────────────────────────────────── */}
      <Modal open={saleModal} onClose={() => setSaleModal(false)} title="New Sale" size="lg">
        <div className="mb-3">
          <Field label="Customer (optional)">
            <Input value={custName} onChange={e => setCustName(e.target.value)} placeholder="Customer name" list="s-custs" />
            <datalist id="s-custs">{customers.map(c => <option key={c._id} value={c.name} />)}</datalist>
          </Field>
        </div>

        {saleItems.map((item, idx) => (
          <div key={idx} className="bg-gray-50 rounded-xl p-3 mb-2">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <Select value={item.itemType} onChange={e => updateSaleItem(idx,'itemType',e.target.value)}>
                  <option value="product">Product</option>
                  <option value="mobile">Mobile</option>
                  <option value="service">Service</option>
                </Select>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Item</p>
                {item.itemType==='product' && (
                  <Select value={item.product} onChange={e => updateSaleItem(idx,'product',e.target.value)}>
                    <option value="">Select...</option>
                    {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </Select>
                )}
                {item.itemType==='mobile' && (
                  <Select value={item.usedMobile} onChange={e => updateSaleItem(idx,'usedMobile',e.target.value)}>
                    <option value="">Select...</option>
                    {mobiles.map(m => <option key={m._id} value={m._id}>{m.brand} {m.model}</option>)}
                  </Select>
                )}
                {item.itemType==='service' && (
                  <Input value={item.name} onChange={e => updateSaleItem(idx,'name',e.target.value)} placeholder="Service description" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Price (Rs)</p>
                <Input type="number" min="0" value={item.salePrice} onChange={e => updateSaleItem(idx,'salePrice',e.target.value)} placeholder="0" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Qty</p>
                <Input type="number" min="1" value={item.quantity} onChange={e => updateSaleItem(idx,'quantity',e.target.value)} disabled={item.itemType==='mobile'} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">{fmtCurrency((item.salePrice||0)*(item.quantity||1))}</span>
              {saleItems.length > 1 && (
                <button onClick={() => setSaleItems(p => p.filter((_,i)=>i!==idx))} className="text-xs text-red-500">Remove</button>
              )}
            </div>
          </div>
        ))}

        <button onClick={() => setSaleItems(p => [...p, { itemType:'product', product:'', usedMobile:'', name:'', salePrice:'', quantity:1 }])}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 mb-4">
          ＋ Add Item
        </button>

        <div className="border-t pt-3 mb-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-600">Discount</span>
            <Input type="number" min="0" value={saleDisc} onChange={e => setSaleDisc(e.target.value)} className="w-24 text-right" />
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-green-600">{fmtCurrency(saleTotal)}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {['cash','card','transfer','other'].map(m => (
            <button key={m} onClick={() => setSalePay(m)}
              className={`flex-1 py-2 text-xs rounded-lg capitalize transition-colors
                ${salePay===m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{m}</button>
          ))}
        </div>

        <button onClick={handleSale} disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base">
          {saving ? 'Recording...' : `✅ Record Sale — ${fmtCurrency(saleTotal)}`}
        </button>
      </Modal>

      {/* ─── PURCHASE MODAL ──────────────────────────────────────────────── */}
      <Modal open={purchaseModal} onClose={() => setPurchaseModal(false)} title="Record Purchase">
        <Field label="Select Product (optional)">
          <Select value={purProduct} onChange={e => {
            const p = products.find(x => x._id === e.target.value);
            setPurProduct(e.target.value);
            if (p) { setPurName(p.name); setPurPrice(p.purchasePrice); }
          }}>
            <option value="">-- Select or type below --</option>
            {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Product Name" required>
          <Input value={purName} onChange={e => setPurName(e.target.value)} required placeholder="Product name" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity" required>
            <Input type="number" min="1" value={purQty} onChange={e => setPurQty(e.target.value)} required />
          </Field>
          <Field label="Purchase Price (Rs)" required>
            <Input type="number" min="0" value={purPrice} onChange={e => setPurPrice(e.target.value)} required placeholder="0" />
          </Field>
        </div>
        <Field label="Supplier">
          <Input value={purSupplier} onChange={e => setPurSupplier(e.target.value)} placeholder="Supplier name" />
        </Field>
        {purPrice && purQty && (
          <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700 mb-4">
            Total Cost: {fmtCurrency(purPrice * purQty)}
          </div>
        )}
        <button onClick={handlePurchase} disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base">
          {saving ? 'Recording...' : '📦 Record Purchase'}
        </button>
      </Modal>
    </div>
  );
}
