const STORAGE_PREFIX = 'convex-panel';

export const STORAGE_KEYS = {
  ACTIVE_TABLE: `${STORAGE_PREFIX}:active-table`,
  TABLE_FILTERS: `${STORAGE_PREFIX}:table-filters`,
  SETTINGS: `${STORAGE_PREFIX}:settings`,
};

// Add in-memory cache to reduce localStorage reads
const memoryCache: Record<string, any> = {};

/**
 * Get a value from local storage with caching
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  
  // Check memory cache first
  if (key in memoryCache) {
    return memoryCache[key] as T;
  }
  
  try {
    const item = window.localStorage.getItem(key);
    const value = item ? JSON.parse(item) : defaultValue;
    
    // Cache the result
    memoryCache[key] = value;
    
    return value;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Set a value in local storage with caching
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // Update memory cache first for immediate access
    memoryCache[key] = value;
    
    // Then update localStorage
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item ${key} in localStorage:`, error);
  }
}

/**
 * Remove a value from local storage
 */
export function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing item ${key} from localStorage:`, error);
  }
}

/**
 * Get stored filters for a specific table with optimized caching
 */
export function getTableFilters(tableName: string) {
  // Use a specific cache key for each table's filters
  const cacheKey = `${STORAGE_KEYS.TABLE_FILTERS}:${tableName}`;
  
  if (cacheKey in memoryCache) {
    return memoryCache[cacheKey];
  }
  
  const allFilters = getStorageItem<Record<string, any>>(STORAGE_KEYS.TABLE_FILTERS, {});
  const tableFilters = allFilters[tableName] || { clauses: [] };
  
  // Cache the result for this specific table
  memoryCache[cacheKey] = tableFilters;
  
  return tableFilters;
}

/**
 * Save filters for a specific table with optimized caching
 */
export function saveTableFilters(tableName: string, filters: any) {
  // Update the specific table cache
  const cacheKey = `${STORAGE_KEYS.TABLE_FILTERS}:${tableName}`;
  memoryCache[cacheKey] = filters;
  
  // Update the all filters cache
  const allFilters = getStorageItem<Record<string, any>>(STORAGE_KEYS.TABLE_FILTERS, {});
  allFilters[tableName] = filters;
  
  // Save to localStorage
  setStorageItem(STORAGE_KEYS.TABLE_FILTERS, allFilters);
}

/**
 * Get the active table from storage
 */
export function getActiveTable(): string {
  return getStorageItem<string>(STORAGE_KEYS.ACTIVE_TABLE, '');
}

/**
 * Save the active table to storage
 */
export function saveActiveTable(tableName: string): void {
  setStorageItem(STORAGE_KEYS.ACTIVE_TABLE, tableName);
}

/**
 * Clear all convex-panel storage (for debugging)
 */
export function clearAllStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // Clear memory cache first
    Object.keys(memoryCache).forEach(key => {
      delete memoryCache[key];
    });
    
    // Get all keys from localStorage
    const keys = Object.keys(window.localStorage);
    
    // Remove all keys that start with the prefix
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    });
    
    console.log('Cleared all convex-panel storage and cache');
  } catch (error) {
    console.error('Error clearing convex-panel storage:', error);
  }
} 