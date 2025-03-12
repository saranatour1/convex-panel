import * as React from 'react';
import { useEffect, useState } from 'react';
import { PlayCircleIcon, PauseCircleIcon } from 'lucide-react';
import { ThemeClasses } from '../types';
import { LogType } from './types';
import { ConvexPanelSettings } from '../settings/SettingsModal';
import { getStorageItem } from '../data/utils/storage';

// Default settings for fallback
const defaultSettings = {
  showRequestIdInput: true,
  showLimitInput: true,
  showSuccessCheckbox: true,
};

// Storage key for settings
const SETTINGS_STORAGE_KEY = 'convex-panel:settings';

interface LogsToolbarProps {
  mergedTheme: ThemeClasses;
  isPaused: boolean;
  togglePause: () => void;
  clearLogs: () => void;
  refreshLogs: () => void;
  isLoading: boolean;
  filterText: string;
  setFilterText: (text: string) => void;
  requestIdFilter: string;
  setRequestIdFilter: (id: string) => void;
  limit: number;
  setLimit: (limit: number) => void;
  initialLimit: number;
  showSuccess: boolean;
  setShowSuccess: (show: boolean) => void;
  isPermanentlyDisabled: boolean;
  setIsPermanentlyDisabled: (disabled: boolean) => void;
  setConsecutiveErrors: (count: number) => void;
  fetchLogs: () => void;
  logType: LogType;
  setLogType: (type: LogType) => void;
  settings?: ConvexPanelSettings;
}

const LogsToolbar = React.forwardRef<HTMLDivElement, LogsToolbarProps>(({
  mergedTheme,
  isPaused,
  togglePause,
  clearLogs,
  refreshLogs,
  isLoading,
  filterText,
  setFilterText,
  requestIdFilter,
  setRequestIdFilter,
  limit,
  setLimit,
  initialLimit,
  showSuccess,
  setShowSuccess,
  isPermanentlyDisabled,
  setIsPermanentlyDisabled,
  setConsecutiveErrors,
  fetchLogs,
  logType,
  setLogType,
  settings: propSettings
}, ref) => {
  // State to store settings loaded from localStorage
  const [localSettings, setLocalSettings] = useState<Partial<ConvexPanelSettings> | null>(null);
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = getStorageItem<Partial<ConvexPanelSettings>>(SETTINGS_STORAGE_KEY, {});
    setLocalSettings(savedSettings);
    
    // Log the settings to verify what's being loaded
    console.log('Loaded settings from localStorage:', savedSettings);
  }, []);
  
  // Update localSettings when propSettings changes
  useEffect(() => {
    if (propSettings) {
      setLocalSettings(propSettings);
      console.log('Settings updated from props:', propSettings);
    }
  }, [propSettings]);
  
  // Use settings from props if provided, otherwise use settings from localStorage, with fallback to defaults
  const effectiveSettings = propSettings || localSettings || {};
  
  // IMPORTANT: Don't use default values when reading from settings
  // This ensures that if a setting is explicitly set to false, it will be respected
  const showRequestIdInput = effectiveSettings.showRequestIdInput !== undefined 
    ? effectiveSettings.showRequestIdInput 
    : defaultSettings.showRequestIdInput;
    
  const showLimitInput = effectiveSettings.showLimitInput !== undefined
    ? effectiveSettings.showLimitInput
    : defaultSettings.showLimitInput;
    
  const showSuccessCheckbox = effectiveSettings.showSuccessCheckbox !== undefined
    ? effectiveSettings.showSuccessCheckbox
    : defaultSettings.showSuccessCheckbox;

  // Log the effective settings being used
  useEffect(() => {
    console.log('Effective settings being used:', {
      showRequestIdInput,
      showLimitInput,
      showSuccessCheckbox
    });
  }, [showRequestIdInput, showLimitInput, showSuccessCheckbox]);

  return (
    <div ref={ref} className={`convex-panel-toolbar ${mergedTheme.toolbar}`}>
      <div className="convex-panel-toolbar-button-container">
        <button 
          className={`convex-panel-live-button ${mergedTheme.input}`}
          onClick={togglePause}
        >
          {isPaused ? <PlayCircleIcon className="convex-panel-button-icon" /> : <PauseCircleIcon className="convex-panel-button-icon" />}
          {isPaused ? 'Go Live' : 'Pause'}
        </button>
      </div>
      <div className="convex-panel-toolbar-button-container convex-inline">
        <button 
          className={`convex-panel-clear-button ${mergedTheme.input}`}
          onClick={clearLogs}
        >
          Clear Logs
        </button>
      </div>
      <div>
        <button 
          className={`convex-panel-refresh-button ${isLoading ? 'convex-panel-button-loading' : ''} ${mergedTheme.input}`}
          onClick={refreshLogs}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="convex-inline">
              <svg className="convex-panel-loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="convex-panel-spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="convex-panel-spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Fetching...
            </div>
          ) : (
            <div className="convex-inline">
              <svg className="convex-panel-refresh-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Logs
            </div>
          )}
        </button>
      </div>
      <div className="convex-panel-filter-container">
        <input
          type="text"
          placeholder="Filter logs..."
          className={`convex-panel-filter-input ${mergedTheme.input}`}
          value={filterText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterText(e.target.value)}
        />
      </div>
      {showRequestIdInput && (
        <div>
          <input
            type="text"
            placeholder="Request ID"
            className={`convex-panel-request-id-input ${mergedTheme.input}`}
            value={requestIdFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequestIdFilter(e.target.value)}
          />
        </div>
      )}
      {showLimitInput && (
        <div>
          <input
            type="number"
            min="10"
            max="1000"
            className={`convex-panel-limit-input ${mergedTheme.input}`}
            value={limit}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLimit(parseInt(e.target.value) || initialLimit)}
          />
        </div>
      )}
      {showSuccessCheckbox && (
        <div className="convex-panel-checkbox-container">
          <input
            id="show-success"
            type="checkbox"
            checked={showSuccess}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowSuccess(e.target.checked)}
            className={`convex-panel-checkbox ${mergedTheme.input}`}
          />
          <label htmlFor="show-success" className={`convex-panel-checkbox-label ${mergedTheme.text}`}>
            Show Success
          </label>
        </div>
      )}
      {isPermanentlyDisabled && (
        <div className="convex-panel-toolbar-button-container">
          <button 
            className={`convex-panel-retry-button ${mergedTheme.input}`}
            onClick={() => {
              setIsPermanentlyDisabled(false);
              setConsecutiveErrors(0);
              fetchLogs();
            }}
          >
            Retry Connection
          </button>
        </div>
      )}
      <div>
        <select
          className={`convex-panel-log-type-select ${mergedTheme.input}`}
          value={logType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLogType(e.target.value as LogType)}
        >
          {Object.values(LogType).map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
    </div>
  );
});

LogsToolbar.displayName = 'LogsToolbar';

export default LogsToolbar; 