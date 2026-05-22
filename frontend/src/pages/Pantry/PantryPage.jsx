import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, CATEGORY_ICONS, autoCategorize } from '../../utils/categories';

const units = ['unidad', 'kg', 'g', 'L', 'ml', 'paquete', 'lata', 'botella', 'cucharada', 'taza'];

const LOCAL_KEY = 'cookit_pantry';
let localIdCounter = 0;

function getLocalPantry() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; }
}

function saveLocalPantry(items) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch {}
}

function daysUntilExpiry(expiryDate) {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function isExpiringSoon(expiryDate) {
  const days = daysUntilExpiry(expiryDate);
  return days !== null && days >= 0 && days <= 3;
}

function isExpired(expiryDate) {
  const days = daysUntilExpiry(expiryDate);
  return days !== null && days < 0;
}

export default function PantryPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Otros', quantity: '1', unit: 'unidad', expiry_date: '', notes: '' });
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [sortByExpiry, setSortByExpiry] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { loadItems(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadItems = async () => {
    let apiItems = [];
    try { apiItems = await api.getPantry(); } catch (e) { console.error(e); }
    let local = getLocalPantry();
    if (local.length > 0) {
      localIdCounter = Math.max(...local.map(m => parseInt(m.id.replace('local_', '')) || 0), 0) + 1;
    }
    setItems([...local, ...apiItems]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        if (typeof editing === 'string' && editing.startsWith('local_')) {
          const local = getLocalPantry();
          const updated = local.map(m => m.id === editing ? { ...m, ...form } : m);
          saveLocalPantry(updated);
        } else {
          await api.updatePantryItem(editing, form);
        }
      } else {
        const saved = await api.addPantryItem(form).catch(() => null);
        if (!saved && form.name) {
          const id = 'local_' + (++localIdCounter);
          const local = getLocalPantry();
          local.push({ id, ...form, created_at: new Date().toISOString() });
          saveLocalPantry(local);
        }
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', category: 'Otros', quantity: '1', unit: 'unidad', expiry_date: '', notes: '' });
      loadItems();
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (typeof id === 'string' && id.startsWith('local_')) {
      const local = getLocalPantry().filter(m => m.id !== id);
      saveLocalPantry(local);
      setItems(prev => prev.filter(m => m.id !== id));
      setConfirmDeleteId(null);
      return;
    }
    try { await api.deletePantryItem(id); loadItems(); setConfirmDeleteId(null); } catch (e) { alert(e.message); }
  };

  const confirmDelete = (id) => setConfirmDeleteId(id);
  const cancelDelete = () => setConfirmDeleteId(null);

  const handleEdit = (item) => {
    setForm({ name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, expiry_date: item.expiry_date || '', notes: item.notes || '' });
    setEditing(item.id);
    setShowForm(true);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm(prev => ({ ...prev, name, category: autoCategorize(name) }));
  };

  let filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  if (sortByExpiry) {
    filtered = [...filtered].sort((a, b) => {
      const da = daysUntilExpiry(a.expiry_date);
      const db = daysUntilExpiry(b.expiry_date);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }

  const grouped = sortByExpiry
    ? { 'Por caducidad': filtered }
    : filtered.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {});

  if (selectedItem) {
    return (
      <div>
        <button onClick={() => setSelectedItem(null)} className="neo-btn !bg-gray-100 dark:!bg-gray-300 !py-2 !px-3 !text-sm mb-4 dark:!text-black">
          <span className="material-symbols-outlined text-sm align-text-bottom">arrow_back</span> {t('common.back')}
        </button>

        <div className="neo-card mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center border-2 border-black">
              <span className="material-symbols-outlined text-3xl text-primary-600">{CATEGORY_ICONS[selectedItem.category] || 'inventory_2'}</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold">{selectedItem.name}</h2>
              <span className="text-xs font-bold text-primary-600 uppercase bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">{selectedItem.category}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-500 font-medium">{t('common.quantity')}</p>
              <p className="font-bold text-lg dark:text-black">{selectedItem.quantity} {selectedItem.unit}</p>
            </div>
            {selectedItem.expiry_date && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-xs text-gray-500 font-medium">{t('common.expiry')}</p>
                <p className="font-bold text-lg">{selectedItem.expiry_date}</p>
              </div>
            )}
          </div>

          {selectedItem.notes && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-xs text-gray-500 font-medium">{t('common.notes')}</p>
              <p className="text-sm font-medium">{selectedItem.notes}</p>
            </div>
          )}

          {selectedItem.created_at && (
            <p className="text-xs text-gray-400 mt-3">{t('common.addedOn')} {new Date(selectedItem.created_at).toLocaleDateString()}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => { handleEdit(selectedItem); setSelectedItem(null); }} className="neo-btn-primary flex-1">{t('common.edit')}</button>
           <button onClick={() => { confirmDelete(selectedItem.id); setSelectedItem(null); }} className="neo-btn !bg-red-50 !text-red-600 !border-red-300 flex-1">{t('common.delete')}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{t('pantry.title')}</h1>
          <p className="text-sm text-gray-500 font-medium">{items.length} {t('common.items')}</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', category: 'Otros', quantity: '1', unit: 'unidad', expiry_date: '', notes: '' }); }}
          className="neo-btn-primary !p-3 !rounded-xl">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder={t('pantry.searchPantry')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="neo-input flex-1"
        />
        <button
          onClick={() => setSortByExpiry(!sortByExpiry)}
          className={`neo-btn !py-2 !px-3 !text-xs whitespace-nowrap ${sortByExpiry ? '!bg-orange-100 !text-orange-700 !border-orange-400' : ''}`}
        >
          <span className="material-symbols-outlined text-sm align-text-bottom">schedule</span> {t('pantry.expiryPriority')}
        </button>
      </div>



      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-20 border-t-2 border-black max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-extrabold mb-4">{editing ? t('pantry.editItem') : t('pantry.newItem')}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="neo-input" placeholder={t('pantry.itemName')} value={form.name} onChange={handleNameChange} required />
              <div className="flex gap-2">
                <select className="neo-input flex-1" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input className="neo-input w-20" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
                <select className="neo-input w-28" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                  {units.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <input className="neo-input" type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} />
              <input className="neo-input" placeholder={t('pantry.optionalNotes')} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
                <button type="submit" className="neo-btn-primary flex-1">{editing ? t('common.save') : t('common.add')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="neo-btn !bg-gray-100 flex-1">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="mb-4">
          <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">{sortByExpiry ? 'schedule' : (CATEGORY_ICONS[cat] || 'inventory_2')}</span> {cat}
          </h2>
          <div className="space-y-2">
            {catItems.map(item => (
              <div key={item.id} className="neo-card flex items-center gap-3 !p-3 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedItem(item)}>
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 border-2 border-black">
                  <span className="material-symbols-outlined text-primary-600">{CATEGORY_ICONS[item.category] || 'inventory_2'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">{CATEGORY_ICONS[item.category] || 'inventory_2'}</span> {item.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-white font-medium">{item.quantity} {item.unit}{item.expiry_date ? ` · Vence: ${item.expiry_date}` : ''}</span>
                  </div>
                  {item.expiry_date && isExpired(item.expiry_date) && (
                    <span className="text-xs font-bold text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-lg border border-gray-400 inline-flex items-center gap-0.5 mt-0.5 line-through">
                      <span className="material-symbols-outlined text-xs">block</span> ¡Producto caducado!
                    </span>
                  )}
                  {item.expiry_date && !isExpired(item.expiry_date) && isExpiringSoon(item.expiry_date) && (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-lg border border-red-300 inline-flex items-center gap-0.5 mt-0.5">
                      <span className="material-symbols-outlined text-xs">warning</span> ¡Consumir pronto!
                    </span>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); confirmDelete(item.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 flex-shrink-0">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && !showForm && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-gray-300">kitchen</span>
          <p className="text-gray-400 font-bold mt-2">{t('pantry.emptyPantry')}</p>
          <p className="text-gray-300 text-sm">{t('pantry.addFirstItems')}</p>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4" onClick={cancelDelete}>
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-base text-gray-900 text-center mb-1">{t('pantry.deleteItem')}</h3>
            <p className="text-sm text-gray-500 text-center mb-5">{t('common.cannotUndo')}</p>
            <div className="flex gap-2">
              <button onClick={cancelDelete} className="neo-btn !bg-gray-100 flex-1">{t('common.cancel')}</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="neo-btn !bg-red-500 !text-white flex-1">{t('common.accept')}</button>
            </div>
          </div>
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
