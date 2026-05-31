/*
  speech.js
  Handles Web Speech API integrations:
  - Speech Recognition (Speech-to-Text) for transcribing vocal input.
  - Speech Synthesis (Text-to-Speech) for vocalizing translated outputs.
*/

// Map language codes to regional locale tags supported by Web Speech APIs
const SPEECH_LOCALE_MAP = {
  "en": "en-IN",
  "hi": "hi-IN",
  "te": "te-IN",
  "ta": "ta-IN",
  "kn": "kn-IN",
  "ml": "ml-IN",
  "mr": "mr-IN",
  "bn": "bn-IN",
  "gu": "gu-IN",
  "pa": "pa-IN"
};

// Global recognition instance
let recognition = null;
let isListening = false;

/**
 * Initializes and starts Speech Recognition.
 * 
 * @param {string} langCode - Language code ('en', 'hi', etc.)
 * @param {Function} onResult - Callback triggered when text is transcribed (receives transcript text)
 * @param {Function} onEnd - Callback triggered when recording stops
 * @param {Function} onError - Callback triggered on recognition errors
 */
function startSpeechRecognition(langCode, onResult, onEnd, onError) {
  // Check browser compatibility (Chrome, Safari, Edge support webkitSpeechRecognition)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    if (typeof showToast === "function") {
      showToast("Voice typing is not supported in this browser. Try Chrome or Edge.", "error");
    }
    onError(new Error("Browser not supported"));
    return;
  }

  // If already running, stop it
  if (recognition) {
    stopSpeechRecognition();
  }

  try {
    recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop when the user pauses speaking
    recognition.interimResults = false; // Only final transcriptions
    recognition.lang = SPEECH_LOCALE_MAP[langCode] || "en-US";

    recognition.onstart = () => {
      isListening = true;
      console.log(`Speech Recognition started for locale: ${recognition.lang}`);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      if (typeof showToast === "function" && event.error !== "no-speech") {
        showToast(`Voice Input Error: ${event.error}`, "error");
      }
      onError(event.error);
    };

    recognition.onend = () => {
      isListening = false;
      onEnd();
    };

    recognition.start();
  } catch (err) {
    console.error("Failed to start Speech Recognition:", err);
    onError(err);
  }
}

/**
 * Stops any active Speech Recognition session.
 */
function stopSpeechRecognition() {
  if (recognition) {
    try {
      recognition.stop();
    } catch (err) {
      console.error("Error stopping Speech Recognition:", err);
    }
    recognition = null;
    isListening = false;
  }
}

/**
 * Checks if recognition is currently active.
 * @returns {boolean}
 */
function isSpeechRecognitionActive() {
  return isListening;
}

/**
 * Vocalizes text using standard Web Speech Synthesis (Text-to-Speech).
 * Reads the settings to configure speed (rate) and pitch.
 * 
 * @param {string} text - Text to speak
 * @param {string} langCode - Language code ('en', 'hi', etc.)
 */
function speakText(text, langCode) {
  // Check compatibility
  if (!window.speechSynthesis) {
    if (typeof showToast === "function") {
      showToast("Text-to-Speech is not supported in this browser.", "error");
    }
    return;
  }

  // Cancel any active utterance
  window.speechSynthesis.cancel();

  if (!text) return;

  // Retrieve user voice preferences from settings (fallback to defaults)
  const settings = JSON.parse(localStorage.getItem("settings")) || {};
  const rate = parseFloat(settings.speechRate) || 1.0;
  const pitch = parseFloat(settings.speechPitch) || 1.0;

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SPEECH_LOCALE_MAP[langCode] || "en-US";
  utterance.rate = rate;
  utterance.pitch = pitch;

  // Try to find a system voice matching the specific language locale
  const voices = window.speechSynthesis.getVoices();
  const targetLocale = SPEECH_LOCALE_MAP[langCode];
  
  const matchingVoice = voices.find(voice => voice.lang.replace('_', '-') === targetLocale) || 
                        voices.find(voice => voice.lang.startsWith(langCode)) ||
                        voices.find(voice => voice.lang.includes("IN")); // Indian accent fallback

  if (matchingVoice) {
    utterance.voice = matchingVoice;
    console.log(`TTS Voice selected: ${matchingVoice.name} (${matchingVoice.lang})`);
  } else {
    console.log("No exact matching TTS voice found; using system default.");
  }

  utterance.onerror = (event) => {
    console.error("TTS Speech synthesis failed:", event.error);
    if (event.error !== "interrupted" && typeof showToast === "function") {
      showToast("Voice output failed to load.", "error");
    }
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Stops any active text-to-speech reading.
 */
function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// In some browsers, voices are loaded asynchronously. Ensure they load.
if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = () => {
    console.log("System TTS Voices updated. Count:", window.speechSynthesis.getVoices().length);
  };
}
