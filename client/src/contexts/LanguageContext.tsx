import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, LOCALIZATION, LocalizationStrings } from '@shared/localization';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  strings: LocalizationStrings;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Initialize HTML attributes synchronously before React renders to prevent flash
const getInitialLanguage = (): Language => {
  const saved = localStorage.getItem('language');
  return (saved as Language) || 'ar'; // Arabic as default
};

// Set initial HTML attributes immediately
const initialLang = getInitialLanguage();
document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = initialLang;

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default to Arabic for Iraqi users, with localStorage persistence
  const [language, setLanguage] = useState<Language>(initialLang);

  // Set direction and lang attribute when language changes
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const strings = LOCALIZATION[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, strings, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
