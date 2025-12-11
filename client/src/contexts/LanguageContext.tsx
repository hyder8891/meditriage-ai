import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, LOCALIZATION, LocalizationStrings } from '@shared/localization';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  strings: LocalizationStrings;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Set direction and lang attribute when language changes
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
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
