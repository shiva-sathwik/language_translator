const axios = require('axios');

const LANGUAGE_NAMES = {
  "en": "English",
  "hi": "Hindi",
  "te": "Telugu",
  "ta": "Tamil",
  "kn": "Kannada",
  "ml": "Malayalam",
  "mr": "Marathi",
  "bn": "Bengali",
  "gu": "Gujarati",
  "pa": "Punjabi"
};

/**
 * Service for communicating with translation APIs.
 * Utilizes a multi-tier strategy:
 * Tier 1: Google Translate client API (fast, high-quality, free)
 * Tier 2: MyMemory API (public TM, filtered to remove crowdsourced spam/names)
 */
class TranslatorService {
  /**
   * Translates text between source and target languages.
   * 
   * @param {string} text - The input text to translate.
   * @param {string} source - Source language code (e.g., 'en').
   * @param {string} target - Target language code (e.g., 'hi').
   * @returns {Promise<string>} The translated text result.
   */
  static async translate(text, source, target) {
    const cleanText = text.trim();
    const sl = source.toLowerCase();
    const tl = target.toLowerCase();

    // --- Tier 1: Google Translate API (No-key client endpoint, extremely accurate & fast) ---
    try {
      console.log(`[TranslatorService] Attempting Tier 1 translation (Google Translate) for: "${cleanText.substring(0, 30)}${cleanText.length > 30 ? '...' : ''}" (${sl} -> ${tl})`);
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(cleanText)}`;
      
      const response = await axios.get(googleUrl, {
        timeout: 4000, // 4 seconds timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (response.status === 200 && response.data && response.data[0] && response.data[0][0] && response.data[0][0][0]) {
        const translatedResult = response.data[0][0][0];
        console.log(`[TranslatorService] Tier 1 Google success: "${translatedResult}"`);
        return translatedResult;
      }
    } catch (err) {
      console.warn(`[TranslatorService] Tier 1 Google translation failed, falling back to Tier 2 (MyMemory):`, err.message);
    }

    // --- Tier 2: MyMemory API (with Professional Matches Filtering) ---
    try {
      const langpair = `${sl}|${tl}`;
      const myMemoryUrl = 'https://api.mymemory.translated.net/get';
      const params = {
        q: cleanText,
        langpair: langpair,
      };

      if (process.env.MYMEMORY_EMAIL) {
        params.de = process.env.MYMEMORY_EMAIL.trim();
      }

      console.log(`[TranslatorService] Attempting Tier 2 translation (MyMemory) for: "${cleanText.substring(0, 30)}${cleanText.length > 30 ? '...' : ''}" (${langpair})`);

      const response = await axios.get(myMemoryUrl, {
        params,
        timeout: 6000, // 6 seconds timeout
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LanguageTranslatorBackend/1.0.0'
        }
      });

      const data = response.data;
      if (data && data.responseData) {
        let resultText = data.responseData.translatedText;
        
        if (resultText && (resultText.toUpperCase().includes('MYMEMORY WARNING') || response.data.responseStatus === 403)) {
          const error = new Error('Translation API rate limit exceeded or warning received.');
          error.statusCode = 429;
          throw error;
        }

        // Apply professional filtering on matches if they exist
        if (data.matches && data.matches.length > 0) {
          const targetLanguageName = LANGUAGE_NAMES[tl] || "";
          
          const validMatches = data.matches.filter(m => {
            if (!m.translation) return false;
            const t = m.translation.trim().toLowerCase();
            if (targetLanguageName && t === targetLanguageName.toLowerCase()) return false;
            if (t === tl) return false;
            return true;
          });

          if (validMatches.length > 0) {
            const professionalMatches = validMatches.filter(m => m['created-by'] && m['created-by'] !== 'Public Web');
            if (professionalMatches.length > 0) {
              professionalMatches.sort((a, b) => Number(b.quality) - Number(a.quality));
              resultText = professionalMatches[0].translation;
            } else {
              validMatches.sort((a, b) => Number(b.quality) - Number(a.quality));
              resultText = validMatches[0].translation;
            }
          }
        }
        
        console.log(`[TranslatorService] Tier 2 MyMemory success: "${resultText}"`);
        return resultText || data.responseData.translatedText;
      } else {
        const error = new Error('Unexpected translation response structure from MyMemory API.');
        error.statusCode = 502;
        throw error;
      }
    } catch (err) {
      if (err.statusCode) {
        throw err;
      }
      if (err.response) {
        console.error('[TranslatorService] MyMemory Response Error:', err.response.data);
        const error = new Error(err.response.data?.responseDetails || 'MyMemory translation server error.');
        error.statusCode = err.response.status || 502;
        throw error;
      } else if (err.request) {
        console.error('[TranslatorService] MyMemory Network Error (no response):', err.message);
        const error = new Error('MyMemory translation request timed out or server is unreachable.');
        error.statusCode = 504;
        throw error;
      } else {
        console.error('[TranslatorService] Unexpected Error:', err.message);
        const error = new Error(err.message || 'An unexpected error occurred in translator service.');
        error.statusCode = 500;
        throw error;
      }
    }
  }
}

module.exports = TranslatorService;
