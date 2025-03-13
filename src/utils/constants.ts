// Storage Keys
export const STORAGE_KEYS = {
	POSITION: 'convex-panel:position',
	SIZE: 'convex-panel:size',
  ACTIVE_TAB: 'convex-panel:active-tab',
  SETTINGS: 'convex-panel:settings',
}

export const INTERVALS = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000,
  YEAR: 31536000,
  MIN_FETCH_INTERVAL: 1000,
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000,
  MAX_CONSECUTIVE_ERRORS: 5,
}

// Tab types
export type TabTypes = 'logs' | 'data-tables' | 'health';

// Convex dashboard log types
export enum LogType {
	ALL = "All log types",
	SUCCESS = "success",
	FAILURE = "failure",
	DEBUG = "debug",
	LOGINFO = "loginfo",
	WARNING = "warn",
	ERROR = "error",
	HTTP = "HTTP",
}

// Default settings
export const defaultSettings = {
  showDebugFilters: false,
  showStorageDebug: false,
  logLevel: 'info' as const,
  healthCheckInterval: 60, // seconds
  showRequestIdInput: true,
  showLimitInput: true,
  showSuccessCheckbox: true,
};

// API Routes
export const API_ROUTES = {
  STREAM_FUNCTION_LOGS: '/api/app_metrics/stream_function_logs',
}