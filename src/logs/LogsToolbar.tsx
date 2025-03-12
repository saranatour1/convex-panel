

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
    <div ref={ref} className={`p-3 flex gap-2 flex-wrap items-center ${mergedTheme.toolbar}`}>
      <div className="!h-8">
        <button 
          className={`flex flex-row items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-xs hover:bg-[#3f529599] bg-[#3f5295] border !border-[#3f529540] ${mergedTheme.input}`}
          onClick={togglePause}
        >
          {isPaused ? <PlayCircleIcon className="w-3 h-3" /> : <PauseCircleIcon className="w-3 h-3" />}
          {isPaused ? 'Go Live' : 'Pause'}
        </button>
      </div>
      <div className="!h-8">
        <button 
          className={`px-3 py-1.5 rounded-md hover:bg-[#3a3a3a90] transition-colors text-xs ${mergedTheme.input}`}
          onClick={clearLogs}
        >
          Clear Logs
        </button>
      </div>
      <div>
        <button 
          className={`px-3 py-1.5 rounded-md hover:bg-[#3a3a3a90] transition-colors text-xs ${isLoading ? 'bg-[#3a3a3a90]' : ''} ${mergedTheme.input} flex items-center gap-1`}
          onClick={refreshLogs}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Fetching...
            </>
          ) : (
            <>
              <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Logs
            </>
          )}
        </button>
      </div>
      <div className="flex-1">
        <input
          type="text"
          placeholder="Filter logs..."
          className={`w-full px-3 py-1.5 rounded-md focus:outline-none text-xs ${mergedTheme.input}`}
          value={filterText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterText(e.target.value)}
        />
      </div>
      {showRequestIdInput && (
        <div>
          <input
            type="text"
            placeholder="Request ID"
            className={`w-full px-3 py-1.5 rounded-md focus:outline-none text-xs font-mono ${mergedTheme.input}`}
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
            className={`w-20 px-3 py-1.5 rounded-md focus:outline-none text-xs font-mono ${mergedTheme.input}`}
            value={limit}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLimit(parseInt(e.target.value) || initialLimit)}
          />
        </div>
      )}
      {showSuccessCheckbox && (
        <div className="flex items-center">
          <input
            id="show-success"
            type="checkbox"
            checked={showSuccess}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowSuccess(e.target.checked)}
            className={`mr-2 ${mergedTheme.input}`}
          />
          <label htmlFor="show-success" className={`text-xs ${mergedTheme.text}`}>
            Show Success
          </label>
        </div>
      )}
      {isPermanentlyDisabled && (
        <div className="!h-8">
          <button 
            className={`px-3 py-1.5 rounded-md hover:bg-[#3a3a3a90] transition-colors text-xs ${mergedTheme.input}`}
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
          className={`px-2 py-1 text-sm rounded-md focus:outline-none ${mergedTheme.input}`}
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