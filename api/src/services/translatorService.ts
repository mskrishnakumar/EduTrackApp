/**
 * Azure Translator Service
 *
 * Provides text translation using Azure Cognitive Services Translator API.
 * Supports automatic language detection and translation to multiple target languages.
 */

// Configuration from environment variables
const TRANSLATOR_KEY = process.env.TRANSLATOR_KEY || '';
const TRANSLATOR_ENDPOINT = process.env.TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
const TRANSLATOR_REGION = process.env.TRANSLATOR_REGION || 'eastus';
const DEFAULT_TARGET_LANGUAGES = ['hi', 'ta', 'te']; // Hindi, Tamil, Telugu

// Get target languages from env or use defaults
function getTargetLanguages(): string[] {
  const envLanguages = process.env.TARGET_LANGUAGES;
  if (envLanguages) {
    return envLanguages.split(',').map(lang => lang.trim());
  }
  return DEFAULT_TARGET_LANGUAGES;
}

export interface TranslationResult {
  success: boolean;
  detectedLanguage?: string;
  translations?: Record<string, string>;
  error?: string;
}

interface AzureTranslation {
  text: string;
  to: string;
}

interface AzureDetectedLanguage {
  language: string;
  score: number;
}

interface AzureTranslateResponse {
  detectedLanguage?: AzureDetectedLanguage;
  translations: AzureTranslation[];
}

/**
 * Check if the translator service is configured
 */
export function isTranslatorConfigured(): boolean {
  return !!TRANSLATOR_KEY;
}

/**
 * Translate text to multiple target languages using Azure Translator
 *
 * @param text - The text to translate
 * @param targetLanguages - Array of language codes to translate to (e.g., ['hi', 'ta', 'te'])
 * @returns TranslationResult with translations for each target language
 */
export async function translateText(
  text: string,
  targetLanguages?: string[]
): Promise<TranslationResult> {
  // If translator is not configured, return gracefully
  if (!isTranslatorConfigured()) {
    return {
      success: false,
      error: 'Translator service not configured'
    };
  }

  // Use provided languages or defaults
  const languages = targetLanguages || getTargetLanguages();

  if (languages.length === 0) {
    return {
      success: false,
      error: 'No target languages specified'
    };
  }

  // Don't translate empty text
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      error: 'Empty text provided'
    };
  }

  try {
    // Build URL with target languages
    const params = new URLSearchParams({
      'api-version': '3.0',
    });

    // Add each target language
    languages.forEach(lang => {
      params.append('to', lang);
    });

    const url = `${TRANSLATOR_ENDPOINT}/translate?${params.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': TRANSLATOR_KEY,
        'Ocp-Apim-Subscription-Region': TRANSLATOR_REGION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ text }]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Translation API error:', response.status, errorText);
      return {
        success: false,
        error: `Translation API error: ${response.status}`
      };
    }

    const data = await response.json() as AzureTranslateResponse[];

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'No translation response received'
      };
    }

    const result = data[0];

    // Build translations record
    const translations: Record<string, string> = {};
    for (const translation of result.translations) {
      translations[translation.to] = translation.text;
    }

    return {
      success: true,
      detectedLanguage: result.detectedLanguage?.language,
      translations
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown translation error'
    };
  }
}

/**
 * Get supported language display names
 */
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  'en': 'English',
  'hi': 'Hindi',
  'ta': 'Tamil',
  'te': 'Telugu',
};

/**
 * Get language display name
 */
export function getLanguageDisplayName(code: string): string {
  return SUPPORTED_LANGUAGES[code] || code;
}
