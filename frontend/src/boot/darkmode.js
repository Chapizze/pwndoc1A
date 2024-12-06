import { createApp } from 'vue';
import App from './../App.vue';
import { Dark } from 'quasar';

const app = createApp(App);

function updateDarkMode(dark = null) {
  Dark.set(dark !== null ? dark : !!localStorage.getItem("darkmode"));
  if (dark !== null) {
    localStorage.setItem('darkmode', dark ? 'y' : 'n');
  } else {
    localStorage.removeItem('darkmode');
  }
}

const toggleDarkMode = function() {
  updateDarkMode(!Dark.isActive);
};

// Initialize dark mode based on local storage value
function initializeDarkMode() {
  const darkMode = localStorage.getItem('darkmode');
  if (darkMode === 'y') {
    Dark.set(true);
  } else if (darkMode === 'n') {
    Dark.set(false);
  }
}

// Call initializeDarkMode when the app is created
initializeDarkMode();

export { toggleDarkMode, Dark };