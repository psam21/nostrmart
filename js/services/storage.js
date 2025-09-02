/**
 * Storage Service
 * Handles local storage, session storage, and data persistence
 */

class StorageService {
    constructor() {
        this.prefix = 'nostrmart_';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        this.init();
    }

    /**
     * Initialize storage service
     */
    init() {
        // Check if storage is available
        this.isLocalStorageAvailable = this.checkLocalStorage();
        this.isSessionStorageAvailable = this.checkSessionStorage();
        
        // Setup cache cleanup
        this.setupCacheCleanup();
        
        // Load cached data
        this.loadCachedData();
    }

    /**
     * Check if localStorage is available
     */
    checkLocalStorage() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('localStorage not available:', error);
            return false;
        }
    }

    /**
     * Check if sessionStorage is available
     */
    checkSessionStorage() {
        try {
            const test = '__sessionStorage_test__';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('sessionStorage not available:', error);
            return false;
        }
    }

    /**
     * Setup cache cleanup
     */
    setupCacheCleanup() {
        // Clean up expired cache entries every minute
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 60000);
    }

    /**
     * Load cached data
     */
    loadCachedData() {
        try {
            if (this.isLocalStorageAvailable) {
                const cachedKeys = Object.keys(localStorage)
                    .filter(key => key.startsWith(this.prefix + 'cache_'));
                
                cachedKeys.forEach(key => {
                    const data = this.getFromStorage('local', key);
                    if (data && data.timestamp) {
                        const age = Date.now() - data.timestamp;
                        if (age < this.cacheTimeout) {
                            const cacheKey = key.replace(this.prefix + 'cache_', '');
                            this.cache.set(cacheKey, data);
                        } else {
                            // Remove expired cache
                            this.removeFromStorage('local', key);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load cached data:', error);
        }
    }

    /**
     * Set data in storage
     */
    set(key, value, options = {}) {
        const {
            type = 'local', // 'local', 'session', 'cache'
            ttl = null, // Time to live in milliseconds
            encrypt = false
        } = options;

        try {
            const data = {
                value: value,
                timestamp: Date.now(),
                ttl: ttl
            };

            if (encrypt) {
                data.value = this.encrypt(JSON.stringify(value));
                data.encrypted = true;
            }

            const storageKey = this.prefix + key;

            switch (type) {
                case 'local':
                    if (this.isLocalStorageAvailable) {
                        this.setInStorage('local', storageKey, data);
                    }
                    break;
                case 'session':
                    if (this.isSessionStorageAvailable) {
                        this.setInStorage('session', storageKey, data);
                    }
                    break;
                case 'cache':
                    this.cache.set(key, data);
                    // Also store in localStorage for persistence
                    if (this.isLocalStorageAvailable) {
                        this.setInStorage('local', this.prefix + 'cache_' + key, data);
                    }
                    break;
            }

            return true;
        } catch (error) {
            console.error(`Failed to set ${key} in ${type} storage:`, error);
            return false;
        }
    }

    /**
     * Get data from storage
     */
    get(key, options = {}) {
        const {
            type = 'local', // 'local', 'session', 'cache'
            defaultValue = null
        } = options;

        try {
            let data = null;
            const storageKey = this.prefix + key;

            switch (type) {
                case 'local':
                    if (this.isLocalStorageAvailable) {
                        data = this.getFromStorage('local', storageKey);
                    }
                    break;
                case 'session':
                    if (this.isSessionStorageAvailable) {
                        data = this.getFromStorage('session', storageKey);
                    }
                    break;
                case 'cache':
                    data = this.cache.get(key);
                    // Fallback to localStorage if not in memory cache
                    if (!data && this.isLocalStorageAvailable) {
                        data = this.getFromStorage('local', this.prefix + 'cache_' + key);
                        if (data) {
                            this.cache.set(key, data);
                        }
                    }
                    break;
            }

            if (!data) {
                return defaultValue;
            }

            // Check if data has expired
            if (data.ttl && (Date.now() - data.timestamp) > data.ttl) {
                this.remove(key, { type });
                return defaultValue;
            }

            // Decrypt if needed
            if (data.encrypted) {
                try {
                    return JSON.parse(this.decrypt(data.value));
                } catch (error) {
                    console.error('Failed to decrypt data:', error);
                    return defaultValue;
                }
            }

            return data.value;
        } catch (error) {
            console.error(`Failed to get ${key} from ${type} storage:`, error);
            return defaultValue;
        }
    }

    /**
     * Remove data from storage
     */
    remove(key, options = {}) {
        const { type = 'local' } = options;

        try {
            const storageKey = this.prefix + key;

            switch (type) {
                case 'local':
                    if (this.isLocalStorageAvailable) {
                        this.removeFromStorage('local', storageKey);
                    }
                    break;
                case 'session':
                    if (this.isSessionStorageAvailable) {
                        this.removeFromStorage('session', storageKey);
                    }
                    break;
                case 'cache':
                    this.cache.delete(key);
                    if (this.isLocalStorageAvailable) {
                        this.removeFromStorage('local', this.prefix + 'cache_' + key);
                    }
                    break;
            }

            return true;
        } catch (error) {
            console.error(`Failed to remove ${key} from ${type} storage:`, error);
            return false;
        }
    }

    /**
     * Clear all data from storage
     */
    clear(options = {}) {
        const { type = 'local' } = options;

        try {
            switch (type) {
                case 'local':
                    if (this.isLocalStorageAvailable) {
                        this.clearStorage('local');
                    }
                    break;
                case 'session':
                    if (this.isSessionStorageAvailable) {
                        this.clearStorage('session');
                    }
                    break;
                case 'cache':
                    this.cache.clear();
                    break;
            }

            return true;
        } catch (error) {
            console.error(`Failed to clear ${type} storage:`, error);
            return false;
        }
    }

    /**
     * Check if key exists in storage
     */
    has(key, options = {}) {
        const { type = 'local' } = options;
        return this.get(key, { type, defaultValue: undefined }) !== undefined;
    }

    /**
     * Get all keys from storage
     */
    keys(options = {}) {
        const { type = 'local' } = options;

        try {
            let keys = [];

            switch (type) {
                case 'local':
                    if (this.isLocalStorageAvailable) {
                        keys = Object.keys(localStorage)
                            .filter(key => key.startsWith(this.prefix))
                            .map(key => key.replace(this.prefix, ''));
                    }
                    break;
                case 'session':
                    if (this.isSessionStorageAvailable) {
                        keys = Object.keys(sessionStorage)
                            .filter(key => key.startsWith(this.prefix))
                            .map(key => key.replace(this.prefix, ''));
                    }
                    break;
                case 'cache':
                    keys = Array.from(this.cache.keys());
                    break;
            }

            return keys;
        } catch (error) {
            console.error(`Failed to get keys from ${type} storage:`, error);
            return [];
        }
    }

    /**
     * Get storage size
     */
    getSize(options = {}) {
        const { type = 'local' } = options;

        try {
            let size = 0;

            switch (type) {
                case 'local':
                    if (this.isLocalStorageAvailable) {
                        size = this.getStorageSize('local');
                    }
                    break;
                case 'session':
                    if (this.isSessionStorageAvailable) {
                        size = this.getStorageSize('session');
                    }
                    break;
                case 'cache':
                    size = this.cache.size;
                    break;
            }

            return size;
        } catch (error) {
            console.error(`Failed to get ${type} storage size:`, error);
            return 0;
        }
    }

    /**
     * Low-level storage operations
     */
    setInStorage(type, key, value) {
        const storage = type === 'local' ? localStorage : sessionStorage;
        storage.setItem(key, JSON.stringify(value));
    }

    getFromStorage(type, key) {
        const storage = type === 'local' ? localStorage : sessionStorage;
        const item = storage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    removeFromStorage(type, key) {
        const storage = type === 'local' ? localStorage : sessionStorage;
        storage.removeItem(key);
    }

    clearStorage(type) {
        const storage = type === 'local' ? localStorage : sessionStorage;
        const keys = Object.keys(storage).filter(key => key.startsWith(this.prefix));
        keys.forEach(key => storage.removeItem(key));
    }

    getStorageSize(type) {
        const storage = type === 'local' ? localStorage : sessionStorage;
        const keys = Object.keys(storage).filter(key => key.startsWith(this.prefix));
        return keys.reduce((size, key) => size + storage.getItem(key).length, 0);
    }

    /**
     * Cache management
     */
    cleanupExpiredCache() {
        const now = Date.now();
        
        // Clean memory cache
        for (const [key, data] of this.cache.entries()) {
            if (data.ttl && (now - data.timestamp) > data.ttl) {
                this.cache.delete(key);
            }
        }

        // Clean localStorage cache
        if (this.isLocalStorageAvailable) {
            const cacheKeys = Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix + 'cache_'));
            
            cacheKeys.forEach(key => {
                const data = this.getFromStorage('local', key);
                if (data && data.ttl && (now - data.timestamp) > data.ttl) {
                    this.removeFromStorage('local', key);
                }
            });
        }
    }

    /**
     * Encryption/Decryption (simple implementation)
     */
    encrypt(text) {
        // Simple base64 encoding - in production, use proper encryption
        return btoa(encodeURIComponent(text));
    }

    decrypt(encryptedText) {
        // Simple base64 decoding - in production, use proper decryption
        return decodeURIComponent(atob(encryptedText));
    }

    /**
     * User preferences
     */
    setUserPreference(key, value) {
        return this.set(`pref_${key}`, value, { type: 'local' });
    }

    getUserPreference(key, defaultValue = null) {
        return this.get(`pref_${key}`, { type: 'local', defaultValue });
    }

    /**
     * Theme preferences
     */
    setTheme(theme) {
        return this.setUserPreference('theme', theme);
    }

    getTheme() {
        return this.getUserPreference('theme', 'auto');
    }

    /**
     * Wallet preferences
     */
    setWalletConnected(connected) {
        return this.setUserPreference('wallet_connected', connected);
    }

    getWalletConnected() {
        return this.getUserPreference('wallet_connected', false);
    }

    /**
     * Search history
     */
    addSearchHistory(query) {
        if (!query || query.trim().length === 0) return;
        
        const history = this.getSearchHistory();
        const trimmedQuery = query.trim();
        
        // Remove if already exists
        const filtered = history.filter(item => item !== trimmedQuery);
        
        // Add to beginning
        filtered.unshift(trimmedQuery);
        
        // Keep only last 10 searches
        const limited = filtered.slice(0, 10);
        
        this.setUserPreference('search_history', limited);
    }

    getSearchHistory() {
        return this.getUserPreference('search_history', []);
    }

    clearSearchHistory() {
        return this.setUserPreference('search_history', []);
    }

    /**
     * Recently viewed items
     */
    addRecentlyViewed(item) {
        const recent = this.getRecentlyViewed();
        const filtered = recent.filter(i => i.id !== item.id);
        filtered.unshift(item);
        
        // Keep only last 20 items
        const limited = filtered.slice(0, 20);
        
        this.setUserPreference('recently_viewed', limited);
    }

    getRecentlyViewed() {
        return this.getUserPreference('recently_viewed', []);
    }

    clearRecentlyViewed() {
        return this.setUserPreference('recently_viewed', []);
    }

    /**
     * Export/Import data
     */
    exportData() {
        const data = {
            preferences: {},
            cache: {},
            timestamp: Date.now()
        };

        // Export preferences
        const prefKeys = this.keys({ type: 'local' })
            .filter(key => key.startsWith('pref_'));
        
        prefKeys.forEach(key => {
            data.preferences[key] = this.get(key, { type: 'local' });
        });

        // Export cache
        for (const [key, value] of this.cache.entries()) {
            data.cache[key] = value;
        }

        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Import preferences
            if (data.preferences) {
                Object.entries(data.preferences).forEach(([key, value]) => {
                    this.set(key, value, { type: 'local' });
                });
            }

            // Import cache
            if (data.cache) {
                Object.entries(data.cache).forEach(([key, value]) => {
                    this.cache.set(key, value);
                });
            }

            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
}

// Create global storage service instance
window.storageService = new StorageService();
