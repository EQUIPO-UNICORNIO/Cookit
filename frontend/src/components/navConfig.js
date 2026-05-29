import i18n from '../i18n/i18n';

export const getNavItems = () => [
  { path: '/meals', icon: 'today', label: i18n.t('nav.meals') },
  { path: '/recipes', icon: 'restaurant_menu', label: i18n.t('nav.recipes') },
  { path: '/pantry', icon: 'kitchen', label: i18n.t('nav.pantry') },
  { path: '/shopping', icon: 'shopping_cart', label: i18n.t('nav.shopping') },
  { path: '/scanner', icon: 'document_scanner', label: i18n.t('nav.scanner') },
  { path: '/community', icon: 'forum', label: i18n.t('nav.community') },
];
