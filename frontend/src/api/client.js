const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la petición');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  me: () => request('/auth/me'),
  updateAvatar: (avatar) => request('/auth/avatar', { method: 'PUT', body: JSON.stringify({ avatar }) }),

  // Pantry
  getPantry: () => request('/pantry'),
  addPantryItem: (item) => request('/pantry', { method: 'POST', body: JSON.stringify(item) }),
  updatePantryItem: (id, item) => request(`/pantry/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deletePantryItem: (id) => request(`/pantry/${id}`, { method: 'DELETE' }),

  // Shopping
  getShopping: () => request('/shopping'),
  addShoppingItem: (item) => request('/shopping', { method: 'POST', body: JSON.stringify(item) }),
  updateShoppingItem: (id, item) => request(`/shopping/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteShoppingItem: (id) => request(`/shopping/${id}`, { method: 'DELETE' }),

  // Meals
  getMeals: () => request('/meals'),
  addMeal: (meal) => request('/meals', { method: 'POST', body: JSON.stringify(meal) }),
  updateMeal: (id, meal) => request(`/meals/${id}`, { method: 'PUT', body: JSON.stringify(meal) }),
  deleteMeal: (id) => request(`/meals/${id}`, { method: 'DELETE' }),

  // Challenges
  getChallenges: () => request('/challenges'),
  addChallenge: (challenge) => request('/challenges', { method: 'POST', body: JSON.stringify(challenge) }),
  updateChallengeProgress: (id, progress) => request(`/challenges/${id}/progress`, { method: 'PUT', body: JSON.stringify({ progress }) }),
  deleteChallenge: (id) => request(`/challenges/${id}`, { method: 'DELETE' }),

  // Community
  getPosts: () => request('/community'),
  createPost: (data) => request('/community', { method: 'POST', body: JSON.stringify(data) }),
  likePost: (id) => request(`/community/${id}/like`, { method: 'POST' }),
  addComment: (postId, content) => request(`/community/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  savePost: (id) => request(`/community/${id}/save`, { method: 'POST' }),
  deletePost: (id) => request(`/community/${id}`, { method: 'DELETE' }),

  // Impact
  getImpact: () => request('/impact'),
  addImpact: (data) => request('/impact', { method: 'POST', body: JSON.stringify(data) }),

  // Cooking
  getSessions: () => request('/cooking'),
  createSession: (data) => request('/cooking', { method: 'POST', body: JSON.stringify(data) }),
  updateStep: (id, step) => request(`/cooking/${id}/step`, { method: 'PUT', body: JSON.stringify({ current_step: step }) }),
  deleteSession: (id) => request(`/cooking/${id}`, { method: 'DELETE' }),

  // Substitutions
  getSubstitutions: () => request('/substitutions'),
  addSubstitution: (data) => request('/substitutions', { method: 'POST', body: JSON.stringify(data) }),
  deleteSubstitution: (id) => request(`/substitutions/${id}`, { method: 'DELETE' }),

  // Scanner
  processTicket: (image, media_type) => request('/scanner/process-ticket', { method: 'POST', body: JSON.stringify({ image, media_type }) }),
  saveMerged: (items) => request('/scanner/save-merged', { method: 'POST', body: JSON.stringify({ items }) }),
};
