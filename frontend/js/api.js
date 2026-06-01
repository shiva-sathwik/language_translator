/*
  api.js
  Service module for handling translation requests.
  Integrates MyMemory API for actual client-side translations,
  and features a robust offline mock fallback database for Indian languages.
*/

// Mock dictionary for standard common phrases
const MOCK_DICTIONARY = {
  "hello": {
    "en": "Hello",
    "hi": "नमस्ते (Namaste)",
    "te": "నమస్కారం (Namaskaram)",
    "ta": "வணக்கம் (Vanakkam)",
    "kn": "ನಮಸ್ಕಾರ (Namaskara)",
    "ml": "നമസ്കാരം (Namaskaram)",
    "mr": "नमस्कार (Namaskar)",
    "bn": "হ্যালো / নমস্কার (Hello / Namaskar)",
    "gu": "નમસ્તે (Namaste)",
    "pa": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ (Sat Sri Akal)"
  },
  "how are you?": {
    "en": "How are you?",
    "hi": "आप कैसे हैं? (Aap kaise hain?)",
    "te": "మీరు ఎలా ఉన్నారు? (Meeru ela unnaaru?)",
    "ta": "நீங்கள் எப்படி இருக்கிறீர்கள்? (Neengal eppadi irukkireergall?)",
    "kn": "ನೀವು ಹೇಗಿದ್ದೀರಿ? (Neevu hegiddiri?)",
    "ml": "സുഖമാണോ? (Sukhamano?)",
    "mr": "तुम्ही कसे आहात? (Tumhi kase ahat?)",
    "bn": "আপনি কেমন আছেন? (Apni kemon achen?)",
    "gu": "તમે કેમ છો? (Tame kem cho?)",
    "pa": "ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ? (Tusi kive ho?)"
  },
  "thank you": {
    "en": "Thank you",
    "hi": "धन्यवाद (Dhanyavaad)",
    "te": "ధన్యవాదాలు (Dhanyavaadaalu)",
    "ta": "நன்றி (Nandri)",
    "kn": "ಧನ್ಯವಾದಗಳು (Dhanyavaadagalu)",
    "ml": "നന്ദി (Nandi)",
    "mr": "धन्यवाद (Dhanyavaad)",
    "bn": "ধন্যবাদ (Dhanyabad)",
    "gu": "આભાર (Aabhar)",
    "pa": "ਧੰਨਵਾਦ (Dhannvaad)"
  },
  "goodbye": {
    "en": "Goodbye",
    "hi": "अलविदा (Alvida)",
    "te": "సెలవు (Selavu)",
    "ta": "போய் வருகிறேன் (Poi varukiren)",
    "kn": "ಹೋಗಿ ಬರುತ್ತೇನೆ (Hogi baruttene)",
    "ml": "വിട (Vida)",
    "mr": "निरोप (Nirop)",
    "bn": "বিদায় (Biday)",
    "gu": "આવજો (Aavjo)",
    "pa": "ਅਲਵਿਦਾ (Alvida)"
  },
  "what is your name?": {
    "en": "What is your name?",
    "hi": "आपका नाम क्या है? (Aapka naam kya hai?)",
    "te": "మీరు పేరు ఏమిటి? (Mee peru emiti?)",
    "ta": "உங்கள் பெயர் என்ன? (Ungal peyar enna?)",
    "kn": "ನಿಮ್ಮ ಹೆಸರೇನು? (Nimma hesarenu?)",
    "ml": "നിങ്ങളുടെ പേരെന്താണ്? (Ningalude perenthanu?)",
    "mr": "तुमचे नाव काय आहे? (Tumche naav kay aahe?)",
    "bn": "আপনার নাম কি? (Apnar nam ki?)",
    "gu": "તમારું નામ શું છે? (Tamaru naam shu chhe?)",
    "pa": "ਤੁਹਾਡਾ ਨਾਮ ਕੀ ਹੈ? (Tuhada naam ki hai?)"
  }
};

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
 * Performs translation on text between source and target languages.
 * Checks for dictionary matches, falls back to live API translation, 
 * and reverts to simulated translation if offline or rate-limited.
 * 
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code (e.g. 'en')
 * @param {string} targetLang - Target language code (e.g. 'hi')
 * @returns {Promise<string>} - The translated string
 */
async function translateText(text, sourceLang, targetLang) {
  // 1. Edge Case: Same language
  if (sourceLang === targetLang) {
    return text;
  }

  // Trim and clean input text
  const cleanText = text.trim().toLowerCase();

  // 2. Dictionary Lookup (Exact phrase match)
  if (MOCK_DICTIONARY[cleanText] && MOCK_DICTIONARY[cleanText][targetLang]) {
    return MOCK_DICTIONARY[cleanText][targetLang];
  }

  // 3. Check for settings: is "Offline Mock Mode Only" enabled?
  const settings = JSON.parse(localStorage.getItem("settings")) || {};
  const forceMock = settings.offlineMode === true;

  if (forceMock) {
    return getSimulatedTranslation(text, sourceLang, targetLang);
  }

  // 4. Call Local Translation Backend API with a timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    // Automatically resolve backend URL depending on whether the page is run from local file or web server
    const isLocalFile = window.location.protocol === 'file:';
    const backendHost = isLocalFile ? 'http://localhost:5000' : '';
    const url = `${backendHost}/api/translate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        source: sourceLang,
        target: targetLang
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.translatedText) {
      return data.translatedText;
    } else {
      throw new Error("Invalid response format from backend");
    }
  } catch (error) {
    console.warn("Backend translation failed, falling back to simulator:", error.message);
    // 5. Fallback to Simulated Mock translation
    return getSimulatedTranslation(text, sourceLang, targetLang);
  }
}

/**
 * Generates a realistic mock translation when offline or API is throttled.
 * Uses native character strings of target language combined with structured placeholder tags.
 * 
 * @param {string} text - Input text
 * @param {string} sourceLang - Source lang
 * @param {string} targetLang - Target lang
 * @returns {string} - Simulated translation text
 */
function getSimulatedTranslation(text, sourceLang, targetLang) {
  // Pre-defined alphabetic scripts snippets to create realistic layouts
  const scripts = {
    "hi": ["नमस्ते", "स्वागतम", "धन्यवाद", "सुप्रभात", "विकास", "भारत", "ज्ञान", "संसार"],
    "te": ["నమస్కారం", "స్వాగతం", "ధన్యవాదాలు", "శుభోదయం", "తెలుగు", "దేశం", "ప్రేమ", "శాంతి"],
    "ta": ["வணக்கம்", "வரவேற்பு", "நன்றி", "காலை வணக்கம்", "தமிழ்", "நாடு", "அன்பு", "அமைதி"],
    "kn": ["ನಮಸ್ಕಾರ", "ಸ್ವಾಗತ", "ಧನ್ಯವಾದಗಳು", "ಶುಭೋದಯ", "ಕನ್ನಡ", "ಕಾವ್ಯ", "ಸ್ನೇಹ", "ಲೋಕ"],
    "ml": ["നമസ്കാരം", "സ്വാഗതം", "നന്ദി", "സുപ്രഭാതം", "മലയാളം", "സ്നേഹം", "സമാധാനം", "കേരളം"],
    "mr": ["नमस्कार", "स्वागत", "धन्यवाद", "शुभ प्रभात", "मराठी", "महाराष्ट्र", "प्रेम", "जग"],
    "bn": ["নমস্কার", "স্বাগতম", "ধন্যবাদ", "সুপ্রভাত", "বাংলা", "ভাষা", "বন্ধুত্ব", "পৃথিবী"],
    "gu": ["નમસ્તે", "સ્વાગત", "આભાર", "શુભ પ્રભાત", "ગુજરાતી", "માનવ", "પ્રેમ", "વિશ્વ"],
    "pa": ["ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ", "ਜੀ ਆਇਆਂ ਨੂੰ", "ਧੰਨਵਾਦ", "ਸਤਿਕਾਰ", "ਪੰਜਾਬੀ", "ਪੰਜਾਬ", "ਪਿਆਰ", "ਦੁਨੀਆ"]
  };

  const targetName = LANGUAGE_NAMES[targetLang] || targetLang.toUpperCase();
  const sourceName = LANGUAGE_NAMES[sourceLang] || sourceLang.toUpperCase();
  
  if (targetLang === "en") {
    // Translating Indian script to English
    return `[Mock Translation to English] Received text "${text}" from ${sourceName} and processed successfully.`;
  }

  // Get a snippet of the script to mix in
  const targetScript = scripts[targetLang] || ["अनुवाद"];
  const wordCount = text.split(/\s+/).length;
  let translatedWords = [];

  for (let i = 0; i < Math.min(wordCount, 6); i++) {
    const idx = (text.charCodeAt(i % text.length) + i) % targetScript.length;
    translatedWords.push(targetScript[idx]);
  }

  const generatedPhrase = translatedWords.join(" ");
  return `${generatedPhrase}\n\n[Simulated translation from ${sourceName} to ${targetName} for: "${text.length > 30 ? text.substring(0, 30) + '...' : text}"]`;
}
