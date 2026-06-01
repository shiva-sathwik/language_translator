/*
  app.js
  Main controller script for the Translator Dashboard.
  Handles event listeners, UI changes, animation states, and module binding.
*/

// Application State Variables
let currentHistoryId = null;
let debounceTimeout = null;

// DOM Elements Selection
const sourceSelect = document.getElementById("sourceLangSelect");
const targetSelect = document.getElementById("targetLangSelect");
const sourceTextarea = document.getElementById("sourceTextarea");
const targetTextarea = document.getElementById("targetTextarea");
const charCountDisplay = document.getElementById("charCount");
const translateBtn = document.getElementById("translateBtn");
const swapBtn = document.getElementById("swapLangBtn");
const voiceInputBtn = document.getElementById("voiceInputBtn");
const voiceOutputBtn = document.getElementById("voiceOutputBtn");
const copyTextBtn = document.getElementById("copyTextBtn");
const favoriteBtn = document.getElementById("favoriteBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const speechWave = document.getElementById("speechWave");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const navLinks = document.getElementById("navLinks");

// Load page drivers
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

/**
 * Initializes language dropdown selectors, loads default preferences, and registers event handlers.
 */
async function initDashboard() {
  // Mobile Nav Drawer Toggle
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("mobile-open");
    });
  }

  // Load User Preferences from settings
  const settings = getSettings();
  
  // Populate Language selectors from languages.json
  try {
    const response = await fetch("data/languages.json");
    if (!response.ok) {
      throw new Error("Failed to load languages dataset");
    }
    const languages = await response.json();
    
    // Fill selectors
    languages.forEach(lang => {
      const optSource = document.createElement("option");
      optSource.value = lang.code;
      optSource.textContent = `${lang.name} (${lang.nativeName})`;
      if (lang.code === settings.defaultSourceLang) {
        optSource.selected = true;
      }
      sourceSelect.appendChild(optSource);

      const optTarget = document.createElement("option");
      optTarget.value = lang.code;
      optTarget.textContent = `${lang.name} (${lang.nativeName})`;
      if (lang.code === settings.defaultTargetLang) {
        optTarget.selected = true;
      }
      targetSelect.appendChild(optTarget);
    });

  } catch (err) {
    console.error("Initialization error:", err);
    showToast("Failed to load languages list. Please refresh.", "error");
  }

  // Set up event listeners
  setupDashboardEventListeners();
}

/**
 * Attaches event listeners for textarea inputs, translation actions, and audio controls.
 */
function setupDashboardEventListeners() {
  // Translate button click
  translateBtn.addEventListener("click", () => {
    performTranslation(false);
  });

  // Source language selector update
  sourceSelect.addEventListener("change", () => {
    // Re-translate if input contains text
    if (sourceTextarea.value.trim()) {
      performTranslation(true);
    }
  });

  // Target language selector update
  targetSelect.addEventListener("change", () => {
    // Re-translate if input contains text
    if (sourceTextarea.value.trim()) {
      performTranslation(true);
    }
  });

  // Textarea input and character counters
  sourceTextarea.addEventListener("input", () => {
    const len = sourceTextarea.value.length;
    charCountDisplay.textContent = `${len} / 5000`;

    // Debounced automatic translation (waits for typing pause of 1.2 seconds)
    clearTimeout(debounceTimeout);
    if (sourceTextarea.value.trim()) {
      debounceTimeout = setTimeout(() => {
        performTranslation(true);
      }, 1200);
    } else {
      // Clear output immediately if input is deleted
      targetTextarea.value = "";
      favoriteBtn.disabled = true;
      favoriteBtn.classList.remove("active-favorite");
      currentHistoryId = null;
    }
  });

  // Swap Languages Button click
  swapBtn.addEventListener("click", () => {
    const tempLang = sourceSelect.value;
    sourceSelect.value = targetSelect.value;
    targetSelect.value = tempLang;

    const tempText = sourceTextarea.value;
    sourceTextarea.value = targetTextarea.value;
    targetTextarea.value = tempText;

    const len = sourceTextarea.value.length;
    charCountDisplay.textContent = `${len} / 5000`;

    if (sourceTextarea.value.trim()) {
      performTranslation(false);
    }
  });

  // Voice Input (Microphone Button)
  voiceInputBtn.addEventListener("click", () => {
    handleVoiceInputToggle();
  });

  // Voice Output (Speech Synth Button)
  voiceOutputBtn.addEventListener("click", () => {
    const translatedText = targetTextarea.value.trim();
    if (!translatedText) {
      showToast("Nothing to speak", "info");
      return;
    }
    showToast("Reading aloud translation...", "info");
    speakText(translatedText, targetSelect.value);
  });

  // Copy Translation to Clipboard
  copyTextBtn.addEventListener("click", () => {
    const translatedText = targetTextarea.value.trim();
    if (!translatedText) {
      showToast("Nothing to copy", "info");
      return;
    }
    
    navigator.clipboard.writeText(translatedText)
      .then(() => {
        showToast("Copied to clipboard!", "success");
      })
      .catch((e) => {
        console.error("Copy failed:", e);
        showToast("Copy failed", "error");
      });
  });

  // Favorite / Star translation
  favoriteBtn.addEventListener("click", () => {
    if (!currentHistoryId) return;

    const isStarred = toggleFavorite(currentHistoryId);
    
    // Toggle class and change tooltip
    if (isStarred) {
      favoriteBtn.classList.add("active-favorite");
      favoriteBtn.setAttribute("data-tooltip", "Remove Favorite");
      showToast("Added to Favorites!", "success");
    } else {
      favoriteBtn.classList.remove("active-favorite");
      favoriteBtn.setAttribute("data-tooltip", "Save to Favorites");
      showToast("Removed from Favorites", "info");
    }
  });
}

/**
 * Triggers the Translation process by activating animations, spinner overlays, and modules.
 * @param {boolean} isAuto - If true, runs a silent background load; if false, triggers full page overlay loader.
 */
async function performTranslation(isAuto = false) {
  const text = sourceTextarea.value.trim();
  const sourceLang = sourceSelect.value;
  const targetLang = targetSelect.value;

  if (!text) {
    return;
  }

  // 1. Show appropriate loading states
  if (!isAuto) {
    loadingOverlay.style.display = "flex";
  } else {
    // Subtle loading effect: change border color or pulse target box
    targetTextarea.style.opacity = "0.6";
  }
  
  // Disable favorite button during process
  favoriteBtn.disabled = true;

  try {
    // 2. Perform translation call
    const translatedText = await translateText(text, sourceLang, targetLang);
    
    // 3. Populate target textarea
    targetTextarea.value = translatedText;
    
    // Reset opacity and apply brief fade-in class to target textarea
    targetTextarea.style.opacity = "1";
    targetTextarea.classList.remove("fade-in");
    void targetTextarea.offsetWidth; // Trigger reflow for animation restart
    targetTextarea.classList.add("fade-in");

    // 4. Save to history local storage if enabled in settings
    const settings = getSettings();
    if (settings.autoSave) {
      const savedItem = addHistoryItem(text, translatedText, sourceLang, targetLang);
      if (savedItem) {
        currentHistoryId = savedItem.id;
        favoriteBtn.disabled = false;
        favoriteBtn.classList.remove("active-favorite");
        favoriteBtn.setAttribute("data-tooltip", "Save to Favorites");
      }
    } else {
      currentHistoryId = null;
    }

  } catch (err) {
    console.error("Translation execution failure:", err);
    showToast("Translation failed. Check connection.", "error");
  } finally {
    // Hide overlay loader
    loadingOverlay.style.display = "none";
  }
}

/**
 * Manages the Speech-to-Text mic recording trigger, visual waves, and text integration.
 */
function handleVoiceInputToggle() {
  const sourceLang = sourceSelect.value;

  if (isSpeechRecognitionActive()) {
    // Stop recording
    stopSpeechRecognition();
    voiceInputBtn.classList.remove("recording");
    speechWave.style.display = "none";
    showToast("Voice typing stopped", "info");
  } else {
    // Start recording
    voiceInputBtn.classList.add("recording");
    speechWave.style.display = "flex";
    showToast("Listening... Speak now.", "info");

    startSpeechRecognition(
      sourceLang,
      // onResult Callback
      (transcript) => {
        // Append transcribed text
        const cursorPosition = sourceTextarea.selectionStart;
        const currentVal = sourceTextarea.value;
        const newVal = currentVal.slice(0, cursorPosition) + transcript + currentVal.slice(cursorPosition);
        sourceTextarea.value = newVal;
        
        // Trigger character counter update
        sourceTextarea.dispatchEvent(new Event("input"));
        
        showToast("Voice transcribed successfully!", "success");
      },
      // onEnd Callback
      () => {
        voiceInputBtn.classList.remove("recording");
        speechWave.style.display = "none";
      },
      // onError Callback
      (err) => {
        voiceInputBtn.classList.remove("recording");
        speechWave.style.display = "none";
      }
    );
  }
}

/**
 * Creates a toast notification and appends it to the container.
 * 
 * @param {string} message - Message text
 * @param {string} type - 'success', 'error', or 'info'
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  // Create toast wrapper
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  // Custom inline SVG icons
  let iconSvg = "";
  if (type === "success") {
    iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
  } else if (type === "error") {
    iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
  } else {
    // Info icon
    iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
  }

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  // Set timeout to slide out and delete
  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 3000);
}
