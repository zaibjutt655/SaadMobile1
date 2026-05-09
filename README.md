# 📱 Mobile Shop — POS, Inventory & Accounting System

A complete, production-ready web application for mobile accessory shops.

---

## 🏗️ Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | React 18 + Tailwind CSS     |
| Backend    | Node.js + Express.js        |
| Database   | MongoDB Atlas               |
| Auth       | JWT (JSON Web Tokens)       |
| Cron Jobs  | node-cron                   |
| Export     | xlsx (Excel + JSON)         |

---

## 📁 Project Structure

```
mobile-shop/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   └── index.js           # All Mongoose schemas
│   ├── middleware/
│   │   └── auth.js            # JWT + RBAC middleware
│   ├── routes/
│   │   ├── auth.js            # Login, me, change-password, seed
│   │   ├── products.js        # Products CRUD
│   │   ├── mobiles.js         # Used mobiles (IMEI)
│   │   ├── sales.js           # Sales + POS
│   │   ├── purchases.js       # Purchases
│   │   ├── services.js        # Service jobs
│   │   ├── customers.js       # Customers
│   │   ├── staff.js           # Staff management
│   │   ├── expenses.js        # Expenses
│   │   ├── reports.js         # Aggregation reports
│   │   ├── audit.js           # Audit log viewer
│   │   ├── backup.js          # JSON + Excel export
│   │   └── closing.js         # Daily closing
│   ├── jobs/
│   │   ├── dailyClosing.js    # Cron: close day at 12:05 AM
│   │   └── dataCleanup.js     # Cron: cleanup old data monthly
│   ├── server.js              # Entry point
│   ├── .env.example           # Environment template
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx  # Global auth state
    │   ├── utils/
    │   │   └── api.js           # Axios API client
    │   ├── components/
    │   │   └── shared/
    │   │       ├── Layout.jsx   # Sidebar + nav
    │   │       └── UI.jsx       # Reusable components
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── ProductsPage.jsx
    │   │   ├── MobilesPage.jsx
    │   │   ├── SalesPage.jsx
    │   │   ├── PurchasesPage.jsx
    │   │   ├── ServicesPage.jsx
    │   │   ├── CustomersPage.jsx
    │   │   ├── StaffPage.jsx
    │   │   ├── ExpensesPage.jsx
    │   │   ├── ReportsPage.jsx
    │   │   ├── AuditPage.jsx
    │   │   ├── KnowledgePage.jsx
    │   │   └── SellerPage.jsx   # Simplified POS for sellers
    │   ├── App.jsx
    │   └── index.js
    └── package.json
```

---

## 🚀 Setup Instructions

### 1. MongoDB Atlas

1. Create a free account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a new cluster (free M0 tier is sufficient)
3. Create a database user with read/write access
4. Whitelist your server IP (or `0.0.0.0/0` for development)
5. Get your connection string: `mongodb+srv://user:pass@cluster.mongodb.net/mobile-shop`

---

### 2. Backend Setup

```bash
cd mobile-shop/backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and a strong JWT_SECRET

# Start development server
npm run dev

# Start production
npm start
```

**First-time initialization** — create the owner account:
```bash
curl -X POST http://localhost:5000/api/auth/seed \
  -H "Content-Type: application/json" \
  -d '{"username":"owner","password":"YourSecurePass123"}'
```

> This only works when the database has zero users. After that it is blocked.

---

### 3. Frontend Setup

```bash
cd mobile-shop/frontend

# Install dependencies
npm install

# Install Tailwind (if not in package.json already)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Add to src/index.css (already done):
# @tailwind base; @tailwind components; @tailwind utilities;

# Start development
npm start

# Build for production
npm run build
```

---

### 4. Production Deployment

**Backend** (any Node.js host — Railway, Render, VPS):
```bash
# Set environment variables on your host:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_32_char_minimum_secret
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
PORT=5000
```

**Frontend** (Netlify, Vercel, or static hosting):
```bash
npm run build
# Deploy the /build folder
# Set REACT_APP_API_URL=https://your-api-domain.com/api
```

---

## 🔐 User Roles Summary

| Permission                  | Owner | Manager | Seller |
|-----------------------------|-------|---------|--------|
| Add sales                   | ✅    | ✅      | ✅     |
| Add purchases               | ✅    | ✅      | ✅     |
| Edit / delete sales         | ✅    | ❌      | ❌     |
| View profit & reports       | ✅    | ✅      | ❌     |
| Manage products             | ✅    | ✅      | ❌     |
| Manage used mobiles         | ✅    | ✅      | ❌     |
| Manage customers            | ✅    | ✅      | ❌     |
| Add expenses                | ✅    | ✅      | ❌     |
| Manage staff                | ✅    | (sellers only) | ❌ |
| Change any user's password  | ✅    | ❌      | ❌     |
| View audit log              | ✅    | ✅      | ❌     |
| Export / backup data        | ✅    | ❌      | ❌     |
| Manual daily closing        | ✅    | ❌      | ❌     |
| View knowledge base         | ✅    | ✅      | ✅     |

---

## 💰 Profit Calculation Rules

```
Product/Mobile Profit  = (Sale Price - Purchase Price) × Quantity
Service Profit         = 100% of service charge (zero purchase cost)
Purchases              = Inventory investment (NOT a loss or expense)
Net Profit             = Total Profit - Total Operational Expenses
```

---

## ⏰ Automated Jobs

| Job              | Schedule        | Action                                          |
|------------------|-----------------|-------------------------------------------------|
| Daily Closing    | 12:05 AM daily  | Locks all records, creates closing summary      |
| Data Cleanup     | 1st of month, 3AM | Deletes soft-deleted+closed records > 1 year  |

**Data never auto-deleted:** Products, Used Mobiles, Customers

---

## 🔒 Security Features

- JWT authentication with 7-day expiry
- Role-based access control on every route
- Soft delete (isDeleted flag) — no permanent data loss
- Audit log for every CREATE / UPDATE / DELETE / LOGIN action
- Daily closing locks records (only Owner can override)
- Passwords hashed with bcrypt (12 rounds)
- Sales editable only by Owner

---

## 📦 All API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/change-password
POST   /api/auth/seed               (first-time only)

GET    /api/products                (all roles)
POST   /api/products                (owner, manager)
PUT    /api/products/:id            (owner, manager)
DELETE /api/products/:id            (owner)

GET    /api/mobiles                 (all roles)
GET    /api/mobiles/imei/:imei      (all roles)
POST   /api/mobiles                 (owner, manager)
PUT    /api/mobiles/:id             (owner, manager)
DELETE /api/mobiles/:id             (owner)

GET    /api/sales                   (all — seller gets limited view, no profit)
POST   /api/sales                   (all roles)
PUT    /api/sales/:id               (owner only)
DELETE /api/sales/:id               (owner only)

GET    /api/purchases               (all)
POST   /api/purchases               (all)
DELETE /api/purchases/:id           (owner)

GET    /api/services                (all)
POST   /api/services                (all)
PUT    /api/services/:id            (owner, manager)
DELETE /api/services/:id            (owner)

GET    /api/customers               (all)
POST   /api/customers               (all)
PUT    /api/customers/:id           (owner, manager)

GET    /api/staff                   (owner, manager)
POST   /api/staff                   (owner, manager)
PUT    /api/staff/:id               (owner)
DELETE /api/staff/:id               (owner)

GET    /api/expenses                (owner, manager)
POST   /api/expenses                (owner, manager)
DELETE /api/expenses/:id            (owner)

GET    /api/reports/summary         (owner, manager)
GET    /api/reports/daily           (owner, manager)
GET    /api/reports/top-products    (owner, manager)

GET    /api/audit                   (owner, manager)

GET    /api/backup/json             (owner)
GET    /api/backup/excel            (owner)

GET    /api/closing                 (owner, manager)
GET    /api/closing/today           (all)
POST   /api/closing/run             (owner)
```

---

## 📝 Default Login

After running the seed endpoint:
- **Username:** `owner`
- **Password:** as set in seed request

> ⚠️ Change the default password immediately after first login via Profile → Change Password.
