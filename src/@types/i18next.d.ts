// import the original type declarations
import 'i18next';
// import all namespaces (for the default language, only)
import en from '../../assets/locales/en/en.json';

declare module 'i18next' {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom resources type
    defaultNS: 'en';
    resources: { en: typeof en };
    // other
  }
}
