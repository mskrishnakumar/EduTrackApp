import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Supported languages for milestone descriptions
export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te';

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  getTranslatedDescription: (
    description: string,
    translations?: Record<string, string>
  ) => string;
}

const STORAGE_KEY = 'edutrack_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    // Try to load from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in SUPPORTED_LANGUAGES) {
      return stored as SupportedLanguage;
    }
    return 'en';
  });

  // Persist language to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
  }, []);

  const getTranslatedDescription = useCallback(
    (description: string, translations?: Record<string, string>): string => {
      // If English is selected or no translations available, return original
      if (language === 'en' || !translations) {
        return description;
      }

      // Try to get translation for selected language
      const translation = translations[language];
      if (translation) {
        return translation;
      }

      // Fallback to original description
      return description;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        getTranslatedDescription,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
