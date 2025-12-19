
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';

i18n
    .use(resourcesToBackend((language: string) => import(`./locales/${language}.json`)))
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        debug: false,
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        detection: {
            order: ['queryString', 'cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage', 'cookie'],
        }
    });

export default i18n;
