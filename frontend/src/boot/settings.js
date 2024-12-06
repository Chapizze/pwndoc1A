import { reactive } from 'vue'
import Settings from '@/services/settings'

// Create a reactive settings object using reactive
const settings = reactive({});

const loadSettings = async () => {
    try {
        Object.assign(settings, (await Settings.getPublicSettings()).data.datas);
    } catch(err) {
        console.error('Failed to load settings:', err);
    }
};

// Add refresh method
settings.refresh = async () => {
    try {
        const newSettings = (await Settings.getPublicSettings()).data.datas;
        
        // Update settings while preserving the refresh method
        Object.assign(settings, newSettings);
    } catch(err) {
        console.error('Failed to refresh settings:', err);
    }
};

// Load initial settings
loadSettings();

export { settings }