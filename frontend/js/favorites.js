/*
  favorites.js
  Handles starring and unstarring translations within the history list.
*/

/**
 * Toggles the favorite status of a history item by ID.
 * 
 * @param {string} id - The unique ID of the translation item
 * @returns {boolean} - The new favorite status of the item, or false if not found
 */
function toggleFavorite(id) {
  const history = getHistory();
  const itemIndex = history.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    console.warn("Item not found to toggle favorite:", id);
    return false;
  }
  
  // Toggle the boolean
  history[itemIndex].favorite = !history[itemIndex].favorite;
  
  // Save updated history list back to local storage
  saveHistory(history);
  
  return history[itemIndex].favorite;
}

/**
 * Checks if a specific history item is starred as favorite.
 * 
 * @param {string} id 
 * @returns {boolean}
 */
function isFavorite(id) {
  const history = getHistory();
  const item = history.find(item => item.id === id);
  return item ? item.favorite === true : false;
}

/**
 * Filters and returns only the translations marked as favorites.
 * 
 * @returns {Array<Object>}
 */
function getFavorites() {
  const history = getHistory();
  return history.filter(item => item.favorite === true);
}
