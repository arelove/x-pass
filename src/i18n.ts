/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 *
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// Importing all translations (assuming the files already exist in public/locales)
import translationEN from './assets/locales/en/translation.json';
import translationRU from './assets/locales/ru/translation.json';
import translationZH from './assets/locales/zh/translation.json'; // Simplified Chinese
import translationES from './assets/locales/es/translation.json'; // Spanish
import translationPT from './assets/locales/pt/translation.json'; // Portuguese
import translationFR from './assets/locales/fr/translation.json'; // French
import translationDE from './assets/locales/de/translation.json'; // German
import translationJA from './assets/locales/ja/translation.json'; // Japanese
import translationKO from './assets/locales/ko/translation.json'; // Korean
import translationIT from './assets/locales/it/translation.json'; // Italian
import translationAR from './assets/locales/ar/translation.json'; // Arabic
import translationHI from './assets/locales/hi/translation.json'; // Hindi
import translationID from './assets/locales/id/translation.json'; // Indonesian

const resources = {
  en: { translation: translationEN },
  ru: { translation: translationRU },
  zh: { translation: translationZH }, // Chinese (Simplified)
  es: { translation: translationES }, // Spanish
  pt: { translation: translationPT }, // Portuguese (Brazil/Portugal)
  fr: { translation: translationFR }, // French
  de: { translation: translationDE }, // German
  ja: { translation: translationJA }, // Japanese
  ko: { translation: translationKO }, // Korean
  it: { translation: translationIT }, // Italian
  ar: { translation: translationAR }, // Arabic
  hi: { translation: translationHI }, // Hindi
  id: { translation: translationID }, // Indonesian
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    // Adding RTL support for Arabic
    react: {
      useSuspense: false,
    },
  });

// For RTL support (Arabic)
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

export default i18n;