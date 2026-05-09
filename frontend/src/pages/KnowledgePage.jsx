import React, { useState } from 'react';

const KB_DATA = [
  {
    category: 'Getting Started',
    icon: '🚀',
    articles: [
      {
        title: 'First-time setup',
        content: `1. Log in with your Owner credentials (default: owner / owner1234 — change immediately).
2. Go to Staff → Add staff members for your sellers and managers.
3. Add your products in Products section with purchase and sale prices.
4. Register used mobiles with their IMEI numbers in Used Mobiles.
5. Start recording sales from the Sales section.`
      },
      {
        title: 'Understanding user roles',
        content: `Owner: Full access to everything — sales, reports, staff, settings, and can edit/delete any record.
Manager: Can manage inventory (products, purchases), view reports, and create seller accounts. Cannot edit or delete sales.
Seller: Simplified POS interface — can only add sales and purchases. Cannot view profit, reports, or edit anything.`
      },
    ]
  },
  {
    category: 'Sales & POS',
    icon: '🛒',
    articles: [
      {
        title: 'How to record a sale',
        content: `1. Click "New Sale" (or the green button on the Seller screen).
2. Select the item type: Product, Mobile (IMEI-tracked), or Service.
3. For products: select from the list — price fills automatically.
4. For mobiles: select from available inventory — it will be marked as sold.
5. For services: type a description and set the charge amount.
6. Add a discount if applicable, select payment method, and click Record Sale.`
      },
      {
        title: 'Profit calculation rules',
        content: `Products & Mobiles: Profit = (Sale Price - Purchase Price) × Quantity
Services: 100% profit — the full service charge is profit (no purchase cost).
Purchases: NOT counted as loss or expense — they are inventory investments.
Net Profit = Total Profit - Operational Expenses (rent, electricity, salary, etc.)`
      },
      {
        title: 'Daily closing system',
        content: `Every day at 12:05 AM, the system automatically closes the day.
After closing: all records from that day become locked — only the Owner can edit them.
Owners can also manually close the day from the Dashboard using the "Close Day" button.
Each closing creates a permanent summary record for historical reporting.`
      },
    ]
  },
  {
    category: 'Inventory',
    icon: '📦',
    articles: [
      {
        title: 'Managing products',
        content: `Add products with a name, category (Accessory, Protector, Cover, Other), purchase price, and sale price.
Stock is automatically updated when you record a sale or purchase.
Products are PERMANENT — they are never auto-deleted by the system.
Low stock warning appears when stock falls below 5 units.`
      },
      {
        title: 'IMEI-based mobile tracking',
        content: `Each used mobile must have a unique IMEI number (15 digits).
Register the mobile with: IMEI, brand, model, condition, and purchase price.
When you sell the mobile (via a sale record), it is automatically marked as "Sold."
You can search any mobile by IMEI using the quick search box on the Used Mobiles page.
Mobile records are PERMANENT — never auto-deleted.`
      },
      {
        title: 'Recording purchases',
        content: `Go to Purchases → Record Purchase (or use the seller interface).
Link to an existing product to automatically update that product's stock count.
Or type any product name for a one-off purchase.
Remember: purchases increase your inventory investment — they are not an expense or loss.`
      },
    ]
  },
  {
    category: 'Reports & Finance',
    icon: '📈',
    articles: [
      {
        title: 'Using the reports page',
        content: `Available to Owner and Manager only.
Filters: Today, This Week, This Month, or Custom Date Range.
Shows: Total Sales, Total Profit, Total Purchases, Total Expenses, and Net Profit.
Breakdown by: Product Sales, Mobile Sales, and Service Income.
Export your data to Excel or JSON using the download buttons.`
      },
      {
        title: 'Recording expenses',
        content: `Go to Expenses → Add Expense.
Categories: Rent, Electricity, Salary, Internet, Supplies, Other.
Expenses are subtracted from profit to calculate Net Profit in reports.
Example: Profit Rs 50,000 - Expenses Rs 15,000 = Net Profit Rs 35,000.`
      },
    ]
  },
  {
    category: 'For Sellers',
    icon: '👤',
    articles: [
      {
        title: 'Seller quick guide',
        content: `Your screen has two large buttons: New Sale and New Purchase.
You can view your entries for Today, Yesterday, or Last 7 Days.
You cannot see profit figures — contact your owner or manager for financial details.
You cannot edit or delete any records — contact your manager or owner if a correction is needed.
Use the Help button (❓) to access this knowledge base at any time.`
      },
      {
        title: 'What to do if you make a mistake',
        content: `If you recorded a wrong sale or purchase, contact your Manager or Owner immediately.
Only the Owner can edit or delete sales.
Do not try to reverse a mistake with another sale — this creates confusion in the reports.
The Owner can edit or delete records even after daily closing.`
      },
    ]
  },
  {
    category: 'Common Issues',
    icon: '🔧',
    articles: [
      {
        title: 'IMEI already registered error',
        content: `Each IMEI can only be registered once. If you see this error, the mobile may already be in the system.
Go to Used Mobiles and search for the IMEI to find the existing record.
If it was entered by mistake, ask the Owner to correct or delete it.`
      },
      {
        title: 'Stock showing as negative',
        content: `This can happen if a sale was recorded without a matching purchase.
Go to Products, find the item, and edit the stock to the correct current value.
Going forward, always record purchases before sales to keep stock accurate.`
      },
      {
        title: 'Cannot log in',
        content: `Make sure you are using the correct username (not email).
Passwords are case-sensitive.
If you have forgotten your password, ask the Owner — they can reset it from Staff Management.
If the Owner account is locked, contact system support to reseed the database.`
      },
      {
        title: 'Data backup & export',
        content: `Go to Reports → click the JSON or Excel download button (Owner only).
The export includes all sales, purchases, products, mobiles, services, customers, and expenses.
Schedule regular backups by exporting weekly or monthly.
Data older than 1 year (except products, mobiles, and customers) is auto-cleaned monthly.`
      },
    ]
  },
];

export default function KnowledgePage() {
  const [search,   setSearch]   = useState('');
  const [expanded, setExpanded] = useState({});

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const filtered = KB_DATA.map(cat => ({
    ...cat,
    articles: cat.articles.filter(a =>
      !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.articles.length > 0);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Knowledge Base</h1>
        <p className="text-sm text-gray-500">Everything you need to know about using this system</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search articles, topics, or keywords..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>

      {/* Results count */}
      {search && (
        <p className="text-xs text-gray-400 mb-4">
          {filtered.reduce((s, c) => s + c.articles.length, 0)} articles found
        </p>
      )}

      {/* Articles */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-4xl block mb-3">🔍</span>
          <p className="font-medium">No articles found for "{search}"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map(cat => (
            <div key={cat.category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{cat.icon}</span>
                <h2 className="text-base font-bold text-gray-800">{cat.category}</h2>
              </div>
              <div className="space-y-2">
                {cat.articles.map(article => {
                  const key = `${cat.category}-${article.title}`;
                  const open = expanded[key] || !!search;
                  return (
                    <div key={key} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-800">{article.title}</span>
                        <span className={`text-gray-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {open && (
                        <div className="px-4 pb-4 border-t bg-gray-50">
                          <pre className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed font-sans pt-3">
                            {article.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
        <p className="text-sm text-blue-700 font-medium">Need more help?</p>
        <p className="text-xs text-blue-500 mt-1">Contact your shop owner or manager for assistance</p>
      </div>
    </div>
  );
}
