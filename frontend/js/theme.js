/*
  theme.js
  Handles Dark and Light mode switching and syncing with localStorage.
*/

document.addEventListener("DOMContentLoaded", () => {
  // Initialize theme
  initTheme();
  
  // Set up click listener for the theme toggle button if it exists on the page
  const themeToggleBtn = document.getElementById("themeToggle");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      toggleTheme();
    });
  }
});

/**
 * Initializes the theme based on local storage or system preferences.
 */
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  
  if (savedTheme === "dark") {
    setTheme("dark");
  } else if (savedTheme === "light") {
    setTheme("light");
  } else {
    // Default to system preference if no user setting is saved
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }
}

/**
 * Toggles the theme between dark and light.
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(newTheme);
  
  // Create a subtle toast notification for theme change
  if (typeof showToast === "function") {
    showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, "info");
  }
}

/**
 * Applies the theme to the HTML element and stores the choice in localStorage.
 * @param {string} theme - 'dark' or 'light'
 */
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  
  // Update aria-label for accessibility
  const themeToggleBtn = document.getElementById("themeToggle");
  if (themeToggleBtn) {
    themeToggleBtn.setAttribute(
      "aria-label",
      `Switch to ${theme === "dark" ? "light" : "dark"} mode`
    );
  }
}
