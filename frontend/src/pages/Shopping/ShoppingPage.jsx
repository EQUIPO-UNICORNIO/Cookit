import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, CATEGORY_ICONS, autoCategorize } from '../../utils/categories';

const units = ['unidad', 'kg', 'g', 'L', 'ml', 'paquete', 'lata', 'botella', 'cucharada', 'taza'];

export default function ShoppingPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Otros', quantity: '1', unit: 'unidad' });
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);

  useEffect(() => { loadItems(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const loadItems = async () => {
    try { setItems(await api.getShopping()); } catch (e) { console.error(e); }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm(prev => ({ ...prev, name, category: autoCategorize(name) }));
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await api.addShoppingItem(form);
      setForm({ name: '', category: 'Otros', quantity: '1', unit: 'unidad' });
      setShowForm(false);
      loadItems();
      showToast(t('shopping.addedToList'));
    } catch (e) { alert(e.message); }
  };

  const toggleCheck = async (item) => {
    try {
      await api.updateShoppingItem(item.id, { checked: !item.checked });
      loadItems();
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    try { await api.deleteShoppingItem(id); loadItems(); } catch (e) { alert(e.message); }
  };

  const markBought = async (item) => {
    try {
      await api.addPantryItem({
        name: item.name,
        category: item.category || 'Otros',
        quantity: item.quantity || '1',
        unit: item.unit || 'unidad',
      });
      await api.deleteShoppingItem(item.id);
      loadItems();
      showToast('Añadido a la despensa');
    } catch (e) { alert(e.message); }
  };

  const clearChecked = async () => {
    const checked = items.filter(i => i.checked);
    for (const item of checked) {
      try { await api.deleteShoppingItem(item.id); } catch {}
    }
    loadItems();
  };

  const filtered = items.filter(i => {
    if (filter === 'pending') return !i.checked;
    if (filter === 'done') return i.checked;
    return true;
  });

  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category || 'Otros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const pendingCount = items.filter(i => !i.checked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{t('shopping.title')}</h1>
          <p className="text-sm text-gray-500 font-medium">{pendingCount} {t('shopping.pendingItems')}</p>
        </div>
        <div className="flex gap-2">
          {items.some(i => i.checked) && (
            <button onClick={clearChecked} className="neo-btn !bg-red-50 !text-red-600 !border-red-300 !py-2 !px-3 !text-xs">
              {t('shopping.clear')}
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="neo-btn-primary !p-3 !rounded-xl">
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 border-2 border-black">
        {['all', 'pending', 'done'].map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white text-primary-600 border-2 border-black' : 'text-gray-500'}`}
          >
            {f === 'all' ? t('shopping.all') : f === 'pending' ? t('shopping.pending') : t('shopping.completed')}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-20 border-t-2 border-black" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-extrabold mb-4">{t('shopping.newProduct')}</h2>
            <form onSubmit={addItem} className="space-y-3">
              <input className="neo-input" placeholder={t('shopping.productName')} value={form.name} onChange={handleNameChange} required />
              <div className="flex gap-2">
                <select className="neo-input flex-1" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input className="neo-input w-20" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                <select className="neo-input w-28" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                  {units.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="neo-btn-primary flex-1">{t('shopping.add')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="neo-btn !bg-gray-100 flex-1">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="mb-4">
          <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">{CATEGORY_ICONS[cat] || 'inventory_2'}</span> {cat}
          </h2>
          <div className="space-y-2">
            {catItems.map(item => (
              <div key={item.id} className={`neo-card flex items-center gap-3 !p-3 transition-all ${item.checked ? 'opacity-50' : ''}`}>
                <button
                  onClick={() => toggleCheck(item)}
                  className={`w-7 h-7 rounded-lg border-2 border-black flex items-center justify-center transition-all flex-shrink-0 ${
                    item.checked ? 'bg-primary-600 text-white' : 'bg-white'
                  }`}
                >
                  {item.checked && <span className="material-symbols-outlined text-sm">check</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm dark:text-white ${item.checked ? 'line-through text-gray-400' : ''}`}>{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">{item.quantity} {item.unit} · {item.category}</p>
                </div>
                {item.checked && (
                  <button onClick={() => markBought(item)} className="neo-btn !bg-green-50 !text-green-700 !border-green-400 !py-1.5 !px-2.5 !text-xs whitespace-nowrap flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">checklist</span> Comprar
                  </button>
                )}
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 flex-shrink-0">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && !showForm && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-gray-300">shopping_cart</span>
          <p className="text-gray-400 font-bold mt-2">{t('shopping.emptyList')}</p>
          <p className="text-gray-300 text-sm">{t('shopping.addShoppingItems')}</p>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
          <div className="bg-primary-600 text-white font-bold text-sm px-5 py-3 rounded-2xl border-2 border-primary-800 whitespace-nowrap">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
