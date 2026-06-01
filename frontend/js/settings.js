/*
  settings.js
  Manages default preferences, voice settings, and data clear-outs.
*/

const SETTINGS_KEY = "translation_settings";

// Default configuration settings
const DEFAULT_SETTINGS = {
  defaultSourceLang: "en",
  defaultTargetLang: "hi",
  speechRate: 1.0,
  speechPitch: 1.0,
  offlineMode: false,
  autoSave: true
};

/**
 * Retrieves the settings from LocalStorage or returns default settings if empty.
 * @returns {Object}
 */
function getSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) {
      // Initialize with default settings on first load
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(saved);
    // Ensure all default keys exist (compatibility for updates)
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error("Failed to parse settings", e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Saves settings to LocalStorage.
 * @param {Object} settings - The new settings object
 */
function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
}

/**
 * Resets settings back to factory defaults.
 * @returns {Object} - The default settings object
 */
function resetSettings() {
  saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

/**
 * Fully purges all app data (History, Favorites, and Preferences) from local storage.
 */
function purgeAllApplicationData() {
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem("translation_history");
  localStorage.removeItem("theme");
}
