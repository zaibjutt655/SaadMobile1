const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ─── USER ─────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  username:  { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:  { type: String, required: true, minlength: 6 },
  role:      { type: String, enum: ['owner', 'manager', 'seller'], default: 'seller' },
  isActive:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeObject = function () {
  const o = this.toObject();
  delete o.password;
  return o;
};

// ─── CUSTOMER ─────────────────────────────────────────────────────────────────
// NOTE: Customers are PERMANENT — never auto-deleted
const customerSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  phone:     { type: String, trim: true },
  email:     { type: String, trim: true, lowercase: true },
  address:   { type: String, trim: true },
  notes:     { type: String },
  isDeleted: { type: Boolean, default: false }, // soft-delete only, no hard delete
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// ─── PRODUCT (Accessories / Protectors / Covers) ──────────────────────────────
// NOTE: Products are PERMANENT — never auto-deleted
const productSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  category:      { type: String, enum: ['accessory', 'protector', 'cover', 'other'], required: true },
  purchasePrice: { type: Number, required: true, min: 0 },
  salePrice:     { type: Number, required: true, min: 0 },
  stock:         { type: Number, default: 0, min: 0 },
  unit:          { type: String, default: 'pcs' },
  sku:           { type: String, trim: true },
  description:   { type: String },
  isDeleted:     { type: Boolean, default: false },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

productSchema.index({ name: 'text', sku: 'text' });

// ─── USED MOBILE (IMEI-based) ─────────────────────────────────────────────────
// NOTE: Used mobiles are PERMANENT — never auto-deleted
const usedMobileSchema = new mongoose.Schema({
  imei:          { type: String, required: true, unique: true, trim: true },
  imei2:         { type: String, trim: true, default: "" },  // optional 2nd IMEI for dual-SIM
  brand:         { type: String, required: true, trim: true },
  model:         { type: String, required: true, trim: true },
  storage:       { type: String, trim: true },
  color:         { type: String, trim: true },
  condition:     { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
  purchasePrice: { type: Number, required: true, min: 0 },
  salePrice:     { type: Number, min: 0 },
  status:        { type: String, enum: ['available', 'sold'], default: 'available' },
  purchasedFrom: { type: String, trim: true },
  soldTo:        { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  soldAt:        { type: Date },
  notes:         { type: String },
  isDeleted:     { type: Boolean, default: false },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

usedMobileSchema.index({ imei: 1 });
usedMobileSchema.index({ brand: 'text', model: 'text', imei: 'text', imei2: 'text' });

// ─── SALE ─────────────────────────────────────────────────────────────────────
const saleItemSchema = new mongoose.Schema({
  itemType:      { type: String, enum: ['product', 'mobile', 'service'], required: true },
  product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  usedMobile:    { type: mongoose.Schema.Types.ObjectId, ref: 'UsedMobile' },
  service:       { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  name:          { type: String, required: true },   // snapshot name at time of sale
  purchasePrice: { type: Number, required: true, min: 0 },
  salePrice:     { type: Number, required: true, min: 0 },
  quantity:      { type: Number, default: 1, min: 1 },
  profit:        { type: Number },                   // computed: (sale - purchase) * qty
}, { _id: false });

const saleSchema = new mongoose.Schema({
  saleNumber: { type: String, unique: true },        // auto-generated: SALE-20240101-001
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String },                    // snapshot in case customer is deleted
  items:      { type: [saleItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  totalProfit: { type: Number, default: 0 },
  discount:    { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'card', 'transfer', 'other'], default: 'cash' },
  notes:       { type: String },
  isClosed:    { type: Boolean, default: false },    // locked after daily closing
  isDeleted:   { type: Boolean, default: false },    // soft delete
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  closingDate: { type: Date },
}, { timestamps: true });

saleSchema.pre('save', function (next) {
  if (!this.saleNumber) {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    this.saleNumber = `SALE-${dateStr}-${rand}`;
  }
  // Compute profit for each item
  this.totalProfit = this.items.reduce((sum, item) => {
    const p = (item.salePrice - item.purchasePrice) * (item.quantity || 1);
    item.profit = p;
    return sum + p;
  }, 0);
  next();
});

saleSchema.index({ createdAt: -1 });
saleSchema.index({ 'items.product': 1 });

// ─── PURCHASE ─────────────────────────────────────────────────────────────────
const purchaseSchema = new mongoose.Schema({
  purchaseNumber: { type: String, unique: true },
  product:        { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName:    { type: String, required: true },  // snapshot
  supplier:       { type: String, trim: true },
  quantity:       { type: Number, required: true, min: 1 },
  purchasePrice:  { type: Number, required: true, min: 0 },
  totalCost:      { type: Number },                  // purchasePrice * quantity
  notes:          { type: String },
  isClosed:       { type: Boolean, default: false },
  isDeleted:      { type: Boolean, default: false },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

purchaseSchema.pre('save', function (next) {
  if (!this.purchaseNumber) {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    this.purchaseNumber = `PUR-${dateStr}-${rand}`;
  }
  this.totalCost = this.purchasePrice * this.quantity;
  next();
});

purchaseSchema.index({ createdAt: -1 });

// ─── SERVICE ──────────────────────────────────────────────────────────────────
const serviceSchema = new mongoose.Schema({
  serviceNumber: { type: String, unique: true },
  type:          { type: String, enum: ['repair', 'software', 'other'], required: true },
  description:   { type: String, required: true },
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName:  { type: String },
  deviceInfo:    { type: String },         // e.g. "iPhone 13 Pro"
  imei:          { type: String },
  charge:        { type: Number, required: true, min: 0 }, // full charge = full profit
  status:        { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
  completedAt:   { type: Date },
  notes:         { type: String },
  isClosed:      { type: Boolean, default: false },
  isDeleted:     { type: Boolean, default: false },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

serviceSchema.pre('save', function (next) {
  if (!this.serviceNumber) {
    const d = new Date();
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 9000) + 1000;
    this.serviceNumber = `SVC-${dateStr}-${rand}`;
  }
  next();
});

serviceSchema.index({ createdAt: -1 });

// ─── EXPENSE ──────────────────────────────────────────────────────────────────
const expenseSchema = new mongoose.Schema({
  category:    { type: String, enum: ['rent', 'electricity', 'salary', 'internet', 'supplies', 'other'], required: true },
  description: { type: String, required: true },
  amount:      { type: Number, required: true, min: 0 },
  date:        { type: Date, default: Date.now },
  isClosed:    { type: Boolean, default: false },
  isDeleted:   { type: Boolean, default: false },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

expenseSchema.index({ createdAt: -1 });

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username:    { type: String, required: true },    // snapshot
  action:      { type: String, required: true },    // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  module:      { type: String, required: true },    // 'sale', 'product', 'user', etc.
  targetId:    { type: mongoose.Schema.Types.ObjectId },
  description: { type: String },
  metadata:    { type: mongoose.Schema.Types.Mixed },
  ip:          { type: String },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ module: 1 });

// ─── DAILY CLOSING ────────────────────────────────────────────────────────────
const dailyClosingSchema = new mongoose.Schema({
  date:          { type: Date, required: true, unique: true },
  dateStr:       { type: String, required: true },   // "2024-01-15"
  totalSales:    { type: Number, default: 0 },
  totalProfit:   { type: Number, default: 0 },
  totalPurchases:{ type: Number, default: 0 },
  totalServices: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  saleCount:     { type: Number, default: 0 },
  closedBy:      { type: String, default: 'system' },
  notes:         { type: String },
  isClosed:      { type: Boolean, default: true },
}, { timestamps: true });

dailyClosingSchema.index({ date: -1 });

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
module.exports = {
  User:          mongoose.model('User', userSchema),
  Customer:      mongoose.model('Customer', customerSchema),
  Product:       mongoose.model('Product', productSchema),
  UsedMobile:    mongoose.model('UsedMobile', usedMobileSchema),
  Sale:          mongoose.model('Sale', saleSchema),
  Purchase:      mongoose.model('Purchase', purchaseSchema),
  Service:       mongoose.model('Service', serviceSchema),
  Expense:       mongoose.model('Expense', expenseSchema),
  AuditLog:      mongoose.model('AuditLog', auditLogSchema),
  DailyClosing:  mongoose.model('DailyClosing', dailyClosingSchema),
};
