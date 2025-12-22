
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// import resourcesToBackend from 'i18next-resources-to-backend';

// Website might share locales or have own. For now, assuming similar structure but isolated.
// If website is built from same root, we could reuse. But often 'website/' is separate.
// Let's assume we copy the locales or reference them if the build allows.
// Given the file structure, we'll create website/src/locales/* for isolation.

import en from './locales/en.json';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            'pt-BR': { translation: ptBR },
            es: { translation: es }
        },
        fallbackLng: 'en',
        debug: false,
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage', 'cookie'],
        }
    });

export default i18n;
