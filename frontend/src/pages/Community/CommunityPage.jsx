import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const fallbackColors = ['#006e2f', '#9d4300', '#735c00', '#4f46e5', '#0891b2', '#be185d', '#7c3aed', '#db2777'];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function getFallbackColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
}

function AvatarDisplay({ avatar, name, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  const roundClass = size === 'sm' ? 'rounded-lg' : 'rounded-xl';

  if (!avatar) {
    return (
      <div className={`${sizeClass} ${roundClass} border-2 border-black flex items-center justify-center text-white font-bold flex-shrink-0`}
        style={{ backgroundColor: getFallbackColor(name) }}>
        {getInitials(name)}
      </div>
    );
  }

  try {
    const parsed = JSON.parse(avatar);
    if (parsed.emoji) {
      return (
        <div className={`${sizeClass} ${roundClass} border-2 border-black flex items-center justify-center flex-shrink-0`}
          style={{ backgroundColor: parsed.bg || '#006e2f' }}>
          <span className={size === 'sm' ? 'text-sm' : 'text-lg'}>{parsed.emoji}</span>
        </div>
      );
    }
  } catch {}

  return (
    <img src={avatar} alt="" className={`${sizeClass} ${roundClass} border-2 border-black object-cover flex-shrink-0`} />
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [newIngredients, setNewIngredients] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [commentText, setCommentText] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [saving, setSaving] = useState({});
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    try { setPosts(await api.getPosts()); } catch (e) { console.error(e); }
  };

  const handlePhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 600;
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize; } }
        else { if (h > maxSize) { w = w * maxSize / h; h = maxSize; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setNewPhoto(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    try {
      const data = { content: newPost, photo: newPhoto, ingredients: newIngredients.split(',').map(i => i.trim()).filter(Boolean), instructions: newInstructions };
      await api.createPost(data);
      setNewPost('');
      setNewPhoto('');
      setNewIngredients('');
      setNewInstructions('');
      loadPosts();
    } catch (e) { showToast('Error al publicar'); }
  };

  const handleLike = async (id) => {
    try { await api.likePost(id); loadPosts(); } catch (e) { console.error(e); }
  };

  const handleComment = async (postId) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    try {
      await api.addComment(postId, text);
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      loadPosts();
    } catch (e) { console.error(e); }
  };

  const handleSave = async (id) => {
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      await api.savePost(id);
      showToast('Receta guardada en tus menús');
    } catch (e) { showToast('Error al guardar'); }
    setSaving(prev => ({ ...prev, [id]: false }));
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try { await api.deletePost(id); loadPosts(); } catch (e) { showToast('Error al eliminar'); }
  };

  return (
    <div>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
          <div className="bg-primary-600 text-white font-bold text-sm px-5 py-3 rounded-2xl border-2 border-primary-800 shadow-lg whitespace-nowrap">
            {toast}
          </div>
        </div>
      )}
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4">Comunidad</h1>

      <form onSubmit={handlePost} className="neo-card mb-4">
        <textarea
          placeholder="¿Qué receta quieres compartir?"
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm font-medium resize-none min-h-[80px] focus:outline-none focus:border-primary-500"
        />
        <div className="flex gap-2 mt-2">
          <input className="neo-input flex-1 text-xs" placeholder="Ingredientes (separados por coma)" value={newIngredients} onChange={e => setNewIngredients(e.target.value)} />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="neo-btn !py-1.5 !px-3 !text-xs !border-secondary-300 text-secondary-600">
            <span className="material-symbols-outlined text-sm align-text-bottom">photo_camera</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoPick} className="hidden" />
        </div>
        {newPhoto && (
          <div className="relative mt-2">
            <img src={newPhoto} alt="Preview" className="w-full h-24 object-cover rounded-xl border-2 border-primary-300" />
            <button type="button" onClick={() => setNewPhoto('')} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">x</button>
          </div>
        )}
        <textarea
          placeholder="Instrucciones / pasos (uno por línea)"
          value={newInstructions}
          onChange={e => setNewInstructions(e.target.value)}
          className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm font-medium resize-none min-h-[60px] focus:outline-none focus:border-primary-500 mt-2"
        />
        <div className="flex items-center gap-2 mt-2">
          <button type="submit" disabled={!newPost.trim()} className="neo-btn-primary !py-1.5 !px-3 !text-xs disabled:opacity-30 ml-auto">
            Publicar
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {posts.map(post => (
          <div key={post.id} className="neo-card">
            <div className="flex items-center gap-3 mb-2">
              <AvatarDisplay avatar={post.user_avatar} name={post.user_name} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{post.user_name}</p>
                <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {user && post.user_name === user.name && (
                <button onClick={() => handleDelete(post.id)} className="p-1 rounded-lg hover:bg-red-50 text-red-500 flex-shrink-0">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
            </div>

            <p className="text-sm font-medium mb-2">{post.content}</p>

            {post.photo && (
              <img src={post.photo} alt={post.content} className="w-full h-40 object-cover rounded-xl mb-3 border border-gray-200" />
            )}

            {post.ingredients?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-bold text-gray-600 uppercase mb-1">Ingredientes</p>
                <div className="flex flex-wrap gap-1">
                  {post.ingredients.map((ing, i) => (
                    <span key={i} className="text-xs bg-gray-100 dark:bg-gray-300 border border-gray-200 dark:border-gray-400 rounded-lg px-2 py-0.5 font-medium dark:text-black">{ing}</span>
                  ))}
                </div>
              </div>
            )}

            {post.instructions && (
              <div className="mb-3">
                <p className="text-xs font-bold text-gray-600 uppercase mb-1">Instrucciones</p>
                <p className="text-xs text-gray-600 whitespace-pre-line">{post.instructions}</p>
              </div>
            )}

            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => handleLike(post.id)} className={`flex items-center gap-1 text-sm font-bold transition-colors ${post.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
                <span className="material-symbols-outlined text-base">{post.liked ? 'favorite' : 'favorite_border'}</span> {post.likes}
              </button>
              <button onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))} className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-primary-600 transition-colors">
                <span className="material-symbols-outlined text-base">chat_bubble_outline</span> {post.comments?.length || 0}
              </button>
              {user && post.user_name !== user.name && (
                <button onClick={() => handleSave(post.id)} disabled={saving[post.id]}
                  className="flex items-center gap-1 text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors ml-auto disabled:opacity-30">
                  <span className="material-symbols-outlined text-base">bookmark_add</span> {saving[post.id] ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>

            {expandedComments[post.id] && (
              <div className="border-t-2 border-gray-100 pt-3 mt-1 space-y-2">
                {post.comments?.map(c => (
                  <div key={c.id} className="flex items-start gap-2">
                    <AvatarDisplay avatar={c.user_avatar} name={c.user_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">{c.user_name}</p>
                      <p className="text-xs text-gray-600">{c.content}</p>
                    </div>
                  </div>
                ))}
                {(!post.comments || post.comments.length === 0) && (
                  <p className="text-xs text-gray-400 text-center">Sin comentarios</p>
                )}
                <div className="flex gap-2 pt-1">
                  <input
                    className="neo-input !py-1.5 !text-xs flex-1"
                    placeholder="Escribe un comentario..."
                    value={commentText[post.id] || ''}
                    onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                  />
                  <button onClick={() => handleComment(post.id)} disabled={!commentText[post.id]?.trim()}
                    className="neo-btn-primary !py-1.5 !px-3 !text-xs disabled:opacity-30">Enviar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-gray-300">forum</span>
          <p className="text-gray-400 font-bold mt-2">Sé el primero en publicar</p>
          <p className="text-gray-300 text-sm">Comparte tu experiencia culinaria</p>
        </div>
      )}
    </div>
  );
}
