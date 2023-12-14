import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../../assets/locales/en/en.json';

const resources = {
  en: { translation: en },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
});

export default i18n;
