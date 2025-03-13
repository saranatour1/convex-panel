// Storage Keys
export const STORAGE_PREFIX = 'convex-panel';

/**
 * Storage keys
 * @type {Record<string, string>}
 * @description A collection of storage keys for the Convex Panel
 */
export const STORAGE_KEYS: Record<string, string> = {
	POSITION: `${STORAGE_PREFIX}:position`,
	SIZE: `${STORAGE_PREFIX}:size`,
  ACTIVE_TAB: `${STORAGE_PREFIX}:active-tab`,
  SETTINGS: `${STORAGE_PREFIX}:settings`,
  ACTIVE_TABLE: `${STORAGE_PREFIX}:active-table`,
  TABLE_FILTERS: `${STORAGE_PREFIX}:table-filters`,
  SIDEBAR_COLLAPSED: `${STORAGE_PREFIX}:sidebar-collapsed`,
}

// Interval constants
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
export const ROUTES = {
  STREAM_FUNCTION_LOGS: '/api/app_metrics/stream_function_logs',
  SHAPES2: '/api/shapes2',
  CACHE_HIT_RATE: '/api/app_metrics/cache_hit_percentage_top_k',
  FAILURE_RATE: '/api/app_metrics/failure_percentage_top_k',
  SCHEDULER_LAG: '/api/app_metrics/scheduled_job_lag',
  NPM_CONVEX: 'https://registry.npmjs.org/convex/latest',
  CONVEX_CHANGELOG: 'https://github.com/get-convex/convex-js/blob/main/CHANGELOG.md'
}

// Filter types
export const typeOptions = [
  { value: 'string', label: 'string' },
  { value: 'boolean', label: 'boolean' },
  { value: 'number', label: 'number' },
  { value: 'bigint', label: 'bigint' },
  { value: 'null', label: 'null' },
  { value: 'object', label: 'object' },
  { value: 'array', label: 'array' },
  { value: 'id', label: 'id' },
  { value: 'bytes', label: 'bytes' },
  { value: 'unset', label: 'unset' }
];

// Filter operators
export const operatorOptions = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equal' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'isType', label: 'Is type' },
  { value: 'isNotType', label: 'Is not type' },
];