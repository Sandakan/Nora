import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './assets/locales/en/en.json';
import fr from './assets/locales/fr/fr.json';
import ptBR from './assets/locales/pt-br/pt-br.json';
import tr from './assets/locales/tr/tr.json';
import vi from './assets/locales/vi/vi.json';
import type { DropdownOption } from './components/Dropdown';

export const resources = {
  en: { translation: en },
  tr: { translation: tr },
  vi: { translation: vi },
  'pt-BR': { translation: ptBR },
  fr: { translation: fr }
} as const;

// export type LanguageCodes = keyof typeof resources;

export const supportedLanguagesDropdownOptions: DropdownOption<keyof typeof resources>[] = [
  { label: `English`, value: 'en' },
  { label: `Turkish`, value: 'tr' },
  { label: `Vietnamese`, value: 'vi' },
  { label: `Português (Brasil)`, value: 'pt-BR' },
  { label: `Francais`, value: 'fr' }
];

const { language } = await window.api.settings.getUserSettings();

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources,
  lng: language ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false } // React is safe from xss attacks
});

export default i18n;
