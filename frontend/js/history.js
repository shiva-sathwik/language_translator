/*
  history.js
  Handles LocalStorage operations for storing translation history logs.
*/

const HISTORY_KEY = "translation_history";
const MAX_HISTORY_ITEMS = 100; // Limit history size to prevent localStorage overflow

/**
 * Retrieves the translation history list from LocalStorage.
 * @returns {Array<Object>} - List of history item objects
 */
function getHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse history data", e);
    return [];
  }
}

/**
 * Saves a list of history items to LocalStorage.
 * @param {Array<Object>} historyList 
 */
function saveHistory(historyList) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyList));
  } catch (e) {
    console.error("Failed to save history data", e);
    if (typeof showToast === "function") {
      showToast("Storage quota exceeded. Clean your history.", "error");
    }
  }
}

/**
 * Adds a new translation record to history.
 * 
 * @param {string} sourceText 
 * @param {string} translatedText 
 * @param {string} sourceLang 
 * @param {string} targetLang 
 * @returns {Object} - The created history item object
 */
function addHistoryItem(sourceText, translatedText, sourceLang, targetLang) {
  if (!sourceText.trim() || !translatedText.trim()) return null;

  const history = getHistory();
  
  // Prevent duplicate consecutive translations in history
  if (history.length > 0) {
    const latest = history[0];
    if (
      latest.sourceText.toLowerCase() === sourceText.trim().toLowerCase() &&
      latest.sourceLang === sourceLang &&
      latest.targetLang === targetLang
    ) {
      // Return existing without duplicating
      return latest;
    }
  }

  // Create new item
  const newItem = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    sourceText: sourceText.trim(),
    translatedText: translatedText.trim(),
    sourceLang: sourceLang,
    targetLang: targetLang,
    timestamp: new Date().toISOString(),
    favorite: false
  };

  // Add to the front of history array
  history.unshift(newItem);

  // Cap size
  if (history.length > MAX_HISTORY_ITEMS) {
    history.pop();
  }

  saveHistory(history);
  return newItem;
}

/**
 * Deletes a single history item by id.
 * @param {string} id 
 */
function deleteHistoryItem(id) {
  let history = getHistory();
  history = history.filter(item => item.id !== id);
  saveHistory(history);
}

/**
 * Clears all translation records from history (keeps favorites if settings dictate, otherwise clears all).
 * @param {boolean} keepFavorites - If true, keeps items marked as favorites
 */
function clearHistory(keepFavorites = false) {
  if (keepFavorites) {
    let history = getHistory();
    history = history.filter(item => item.favorite === true);
    saveHistory(history);
  } else {
    localStorage.removeItem(HISTORY_KEY);
  }
}
