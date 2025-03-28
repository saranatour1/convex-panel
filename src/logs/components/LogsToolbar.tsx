import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { PlayCircleIcon, PauseCircleIcon } from 'lucide-react';
import { LogType } from '../../utils/constants';
import { ConvexPanelSettings } from '../../types';
import { getStorageItem, setStorageItem } from '../../utils/storage';
import { defaultSettings, STORAGE_KEYS } from '../../utils/constants';
import { LogsToolbarProps } from '../../types';
import { ChevronDownIcon, RefreshIcon } from '../../components/icons';

const LogsToolbar = React.forwardRef<HTMLDivElement, LogsToolbarProps>(({
  /** 
   * Theme customization object with merged default and custom styles.
   * Controls visual appearance of logs toolbar components.
   */
  mergedTheme,

  /**
   * Whether log streaming is currently paused.
   * Controls if new logs are being fetched and displayed.
   */
  isPaused,

  /**
   * Function to toggle the paused state.
   * Allows starting/stopping log streaming.
   */
  togglePause,

  /**
   * Function to clear all currently displayed logs.
   * Removes logs from view but keeps streaming active.
   */
  clearLogs,

  /**
   * Function to manually refresh and fetch latest logs.
   * Forces an immediate log fetch regardless of streaming state.
   */
  refreshLogs,

  /**
   * Whether logs are currently being fetched.
   * Controls loading indicators in the UI.
   */
  isLoading,

  /**
   * Text string to filter logs by content.
   * Filters log messages containing this text.
   */
  filterText,

  /**
   * Function to update the filter text.
   * @param text New filter text to apply
   */
  setFilterText,

  /**
   * Request ID to filter logs by.
   * Shows only logs matching this request ID.
   */
  requestIdFilter,

  /**
   * Function to update the request ID filter.
   * @param id New request ID to filter by
   */
  setRequestIdFilter,

  /**
   * Current limit on number of logs to fetch.
   * Controls pagination size of log fetching.
   */
  limit,

  /**
   * Function to update the fetch limit.
   * @param limit New limit to apply
   */
  setLimit,

  /**
   * Initial limit value when component loads.
   * Starting pagination size for log fetching.
   */
  initialLimit,

  /**
   * Whether to show successful log entries.
   * Controls visibility of logs with success status.
   */
  showSuccess,

  /**
   * Function to toggle showing successful logs.
   * @param show Whether to show success logs
   */
  setShowSuccess,

  /**
   * Whether logging is permanently disabled.
   * Prevents any log fetching when true.
   */
  isPermanentlyDisabled,

  /**
   * Function to update permanently disabled state.
   * @param disabled Whether to disable logging
   */
  setIsPermanentlyDisabled,

  /**
   * Function to update count of consecutive errors.
   * @param errors Number of consecutive fetch errors
   */
  setConsecutiveErrors,

  /**
   * Function to fetch a new batch of logs.
   * Triggers manual log fetching.
   */
  fetchLogs,

  /**
   * Current type of logs being displayed.
   * Controls which log categories are shown.
   */
  logType,

  /**
   * Function to update the log type filter.
   * @param type New log type to filter by
   */
  setLogType,

  /**
   * Settings object with user preferences.
   * Controls UI behavior and features.
   */
  settings,
}, ref) => {
  const logTypeDropdownRef = useRef<HTMLDivElement>(null);
  const [isLogTypeDropdownOpen, setIsLogTypeDropdownOpen] = useState(false);
  const [showRequestIdInput, setShowRequestIdInput] = useState(true);
  const [showLimitInput, setShowLimitInput] = useState(true);
  const [showSuccessCheckbox, setShowSuccessCheckbox] = useState(true);
  const [localSettings, setLocalSettings] = useState<ConvexPanelSettings | null>(null);
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = getStorageItem<ConvexPanelSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
    setLocalSettings(savedSettings);
    
    // Update UI controls based on settings
    setShowRequestIdInput(savedSettings.showRequestIdInput);
    setShowLimitInput(savedSettings.showLimitInput);
    setShowSuccessCheckbox(savedSettings.showSuccessCheckbox);
  }, []);
  
  // Update settings when props change
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);
  
  // Use settings from props if provided, otherwise use settings from localStorage, with fallback to defaults
  const effectiveSettings = settings || localSettings || {};
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isLogTypeDropdownOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (
        logTypeDropdownRef.current && 
        !logTypeDropdownRef.current.contains(e.target as Node)
      ) {
        setIsLogTypeDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLogTypeDropdownOpen]);

  /**
   * Handle Go Live button click
   * Toggles pause state and scrolls to top when resuming
   */
  const handleGoLive = () => {
    // If we're currently paused and about to go live
    if (isPaused) {
      // First toggle the pause state
      togglePause();
      
      // Then scroll logs to the top
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        const logsListContainer = document.querySelector('.convex-panel-logs-list');
        if (logsListContainer) {
          logsListContainer.scrollTop = 0;
        }
      });
    } else {
      // Just toggle the pause state if we're not paused
      togglePause();
    }
  };

  /**
   * Handle log type change
   * Updates the log type and saves it to localStorage
   */
  const handleLogTypeChange = (type: LogType) => {
    setLogType(type);
    setStorageItem(STORAGE_KEYS.LOG_TYPE_FILTER, type);
    setIsLogTypeDropdownOpen(false);
  };

  // Load saved log type from localStorage on mount
  useEffect(() => {
    const savedLogType = getStorageItem<LogType>(STORAGE_KEYS.LOG_TYPE_FILTER, LogType.ALL);
    if (savedLogType && savedLogType !== logType) {
      setLogType(savedLogType);
    }
  }, [setLogType, logType]);

  return (
    <div ref={ref} className={`convex-panel-toolbar ${mergedTheme.toolbar}`}>
      <div className="convex-panel-toolbar-button-container">
        <button 
          className={`convex-panel-live-button ${mergedTheme.input}`}
          onClick={handleGoLive}
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
          <div className="convex-inline">
            <RefreshIcon />
            Refresh Logs
          </div>
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
        <div 
          ref={logTypeDropdownRef}
          className="convex-panel-filter-menu-dropdown"
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsLogTypeDropdownOpen(!isLogTypeDropdownOpen);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="convex-panel-filter-menu-dropdown-button"
          >
            <span>{logType}</span>
            <ChevronDownIcon />
          </button>
          
          {isLogTypeDropdownOpen && (
            <div 
              className="convex-panel-filter-menu-dropdown-content"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {Object.values(LogType).map((type) => (
                <button
                  type="button"
                  key={type}
                  className={`convex-panel-filter-menu-option ${logType === type ? 'convex-panel-filter-menu-option-selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLogTypeChange(type);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

LogsToolbar.displayName = 'LogsToolbar';

export default LogsToolbar;