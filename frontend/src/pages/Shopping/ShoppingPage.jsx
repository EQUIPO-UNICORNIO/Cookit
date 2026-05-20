import { useState, useEffect } from 'react';
import { api } from '../../api/client';

const categories = ['Verduras', 'Frutas', 'Carnes', 'Lácteos', 'Pan', 'Conservas', 'Congelados', 'Bebidas', 'Especias', 'Otros'];

export default function ShoppingPage() {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try { setItems(await api.getShopping()); } catch (e) { console.error(e); }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.addShoppingItem({ name: newName });
      setNewName('');
      loadItems();
    } catch (e) { alert(e.message); }
  };

  const toggleCheck = async (item) => {
    try {
      await api.updateShoppingItem(item.id, { ...item, checked: !item.checked });
      loadItems();
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    try { await api.deleteShoppingItem(id); loadItems(); } catch (e) { alert(e.message); }
  };

  const clearChecked = async () => {
    const checked = items.filter(i => i.checked);
    for (const item of checked) {
      await api.deleteShoppingItem(item.id);
    }
    loadItems();
  };

  const filtered = items.filter(i => {
    if (filter === 'pending') return !i.checked;
    if (filter === 'done') return i.checked;
    return true;
  });

  const pendingCount = items.filter(i => !i.checked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Lista de Compra</h1>
          <p className="text-sm text-gray-500 font-medium">{pendingCount} items pendientes</p>
        </div>
        {items.some(i => i.checked) && (
          <button onClick={clearChecked} className="neo-btn !bg-red-50 !text-red-600 !border-red-300 !py-2 !px-3 !text-xs">
            Limpiar
          </button>
        )}
      </div>

      <form onSubmit={addItem} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Agregar item..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="neo-input flex-1"
        />
        <button type="submit" className="neo-btn-primary !p-3 !rounded-xl">
          <span className="material-symbols-outlined">add</span>
        </button>
      </form>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
        {['all', 'pending', 'done'].map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-white text-primary-600' : 'text-gray-500'}`}
          >
            {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : 'Completadas'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className={`neo-card flex items-center gap-3 !p-3 transition-all ${item.checked ? 'opacity-50' : ''}`}>
            <button
              onClick={() => toggleCheck(item)}
              className={`w-7 h-7 rounded-lg border-2 border-black flex items-center justify-center transition-all ${
                item.checked ? 'bg-primary-600 text-white' : 'bg-white'
              }`}
            >
              {item.checked && <span className="material-symbols-outlined text-sm">check</span>}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${item.checked ? 'line-through text-gray-400' : ''}`}>{item.name}</p>
              <p className="text-xs text-gray-500">{item.category}</p>
            </div>
            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-gray-300">shopping_cart</span>
          <p className="text-gray-400 font-bold mt-2">Lista vacía</p>
          <p className="text-gray-300 text-sm">Agrega items para tu compra</p>
        </div>
      )}
    </div>
  );
}
