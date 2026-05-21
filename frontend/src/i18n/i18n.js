import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';

const savedLang = localStorage.getItem('cookit_lang') || 'es';

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export const setLanguage = (lng) => {
  i18n.changeLanguage(lng);
  localStorage.setItem('cookit_lang', lng);
};

export default i18n;
