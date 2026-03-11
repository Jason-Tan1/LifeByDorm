import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Initialize i18n for tests with minimal config
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  resources: {
    en: {
      translation: {
        'search.placeholderUniversities': 'Search for a university...',
        'search.placeholderDorms': 'Search for a dorm...',
      },
    },
  },
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
