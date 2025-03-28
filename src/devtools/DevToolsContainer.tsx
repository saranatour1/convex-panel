import React, { useState, useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { DEVTOOL_TABS, DevToolsTabTypes, STORAGE_KEYS, TabTypes } from '../utils/constants';
import { ThemeClasses, ConvexPanelSettings } from '../types';
import { JsonView } from './JsonView';
import { ChevronDownIcon } from '../components/icons';
import { CONSOLE_FILTER_TYPES } from '../utils/constants';
import NetworkPanel from './network/NetworkPanel';
import { TabButton } from '../components/TabButton';
import { setStorageItem } from '../utils/storage';

// Convert enum to string literal type for better TypeScript compatibility
const CONSOLE: DevToolsTabTypes = 'console';
const NETWORK: DevToolsTabTypes = 'network';

interface DevToolsContainerProps {
  /**
   * Theme customization object with merged default and custom styles.
   * Controls visual appearance of DevTools components.
   */
  mergedTheme: ThemeClasses;


  /**
   * Settings object with user preferences.
   * Controls UI behavior and features.
   */
  settings: ConvexPanelSettings;

  /**
   * Current size of the container element.
   * Controls dimensions of the DevTools view.
   */
  containerSize: { width: number; height: number };
}

export const DevToolsContainer: React.FC<DevToolsContainerProps> = ({
  mergedTheme,
  settings,
  containerSize,
}) => {
  const logTypeDropdownRef = useRef<HTMLDivElement>(null);
  const [isLogTypeDropdownOpen, setIsLogTypeDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DevToolsTabTypes>(CONSOLE);

  const [filterText, setFilterText] = useState('');
  const [logLevel, setLogLevel] = useState<string>('all');
  const [logs, setLogs] = useState<any[]>();
  const [localLogs, setLocalLogs] = useState<LogEntry[]>([]);
  const [logType, setLogType] = useState<string>(CONSOLE_FILTER_TYPES[0].value);

  // Debug: Log the incoming logs array
  useEffect(() => {
    // Merge incoming logs with local logs
    if (logs && logs.length > 0) {
      setLocalLogs(prevLocalLogs => {
        // Create a map of existing log IDs for quick lookup
        const existingLogIds = new Set(prevLocalLogs.map(log => `${log.timestamp}-${log.message}`));
        
        // Filter out duplicates from incoming logs
        const newLogs = logs.filter(log => !existingLogIds.has(`${log.timestamp}-${log.message}`));
        
        if (newLogs.length > 0) {
          // Add new logs to the beginning
          return [...newLogs, ...prevLocalLogs];
        }
        return prevLocalLogs;
      });
    }
  }, [logs]);

  // Function to capture object data better
  const formatLogArgument = (arg: any): string => {
    if (arg === undefined) return 'undefined';
    if (arg === null) return 'null';
    
    try {
      if (typeof arg === 'object') {
        // Handle DOM elements and browser API objects better
        if (arg instanceof Error) {
          return `${arg.name}: ${arg.message}`;
        }
        if (arg instanceof Element) {
          return arg.outerHTML.slice(0, 1000) + (arg.outerHTML.length > 1000 ? '...' : '');
        }
        if (arg instanceof Event) {
          return `Event: ${arg.type}`;
        }
        
        // Better serialization for circular references
        const cache: any[] = [];
        const jsonString = JSON.stringify(arg, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            // Detect circular references
            if (cache.includes(value)) {
              return '[Circular Reference]';
            }
            cache.push(value);
          }
          return value;
        }, 2);
        
        return jsonString || String(arg);
      }
      return String(arg);
    } catch (error) {
      return `[Object that couldn't be stringified: ${error}]`;
    }
  };

  // Helper function to determine if a string is probably JSON
  const isJSON = (str: string): boolean => {
    try {
      // Check if the string begins with an object or array
      return (str.trim().startsWith('{') && str.trim().endsWith('}')) || 
             (str.trim().startsWith('[') && str.trim().endsWith(']'));
    } catch (e) {
      return false;
    }
  };

  // Helper function to parse JSON safely
  const parseJSON = (str: string): any => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  };

  // Intercept console logs
  useEffect(() => {
    // Original console methods
    const originalConsoleLog = console.log;
    const originalConsoleInfo = console.info;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    const originalConsoleDebug = console.debug;

    // Event handler references for cleanup
    let errorHandler: (event: ErrorEvent) => void;
    let rejectionHandler: (event: PromiseRejectionEvent) => void;

    // Connect to browser's console API to get existing logs
    if (typeof window !== 'undefined' && window.console) {
      // Create log capture function
      const captureLog = (level: string) => (...args: any[]) => {
        // Create a descriptive message without prefixing with "browser"
        const displayMessage = args.map(arg => 
          typeof arg === 'object' && arg !== null ? 
            (arg instanceof Error ? `${arg.name}: ${arg.message}` : 
             arg instanceof Element ? arg.tagName : 
             arg instanceof Event ? `Event: ${arg.type}` : 
             'Object') 
          : String(arg)
        ).join(' ');
        
        // Store the log entry with original raw objects
        const logEntry: LogEntry = {
          timestamp: Date.now(),
          topic: 'console', // Changed from 'browser' to 'console'
          message: displayMessage,
          log_level: level,
          raw: args
        };
        
        setLocalLogs(prevLogs => [logEntry, ...prevLogs]);
        
        // Call original method to maintain normal console behavior
        switch(level) {
          case 'log': return originalConsoleLog(...args);
          case 'info': return originalConsoleInfo(...args);
          case 'warn': return originalConsoleWarn(...args);
          case 'error': return originalConsoleError(...args);
          case 'debug': return originalConsoleDebug(...args);
          default: return originalConsoleLog(...args);
        }
      };

      // Override console methods
      console.log = captureLog('info');
      console.info = captureLog('info');
      console.warn = captureLog('warn');
      console.error = captureLog('error');
      console.debug = captureLog('debug');
      
      // Listen for unhandled errors
      errorHandler = (event: ErrorEvent) => {
        const errorMessage = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
        const logEntry: LogEntry = {
          timestamp: Date.now(),
          topic: 'console',
          message: errorMessage,
          log_level: 'error',
          raw: [event.error]
        };
        
        setLocalLogs(prevLogs => [logEntry, ...prevLogs]);
      };
      
      // Listen for unhandled promise rejections
      rejectionHandler = (event: PromiseRejectionEvent) => {
        const errorMessage = `Unhandled Promise Rejection: ${
          event.reason instanceof Error 
            ? `${event.reason.name}: ${event.reason.message}`
            : String(event.reason)
        }`;
        
        const logEntry: LogEntry = {
          timestamp: Date.now(),
          topic: 'console',
          message: errorMessage,
          log_level: 'error',
          raw: [event.reason]
        };
        
        setLocalLogs(prevLogs => [logEntry, ...prevLogs]);
      };
      
      // Add event listeners
      window.addEventListener('error', errorHandler);
      window.addEventListener('unhandledrejection', rejectionHandler);
    }

    // Cleanup function to restore original console methods
    return () => {
      console.log = originalConsoleLog;
      console.info = originalConsoleInfo;
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
      console.debug = originalConsoleDebug;
      
      // Remove event listeners if they were added
      if (typeof window !== 'undefined' && errorHandler && rejectionHandler) {
        window.removeEventListener('error', errorHandler);
        window.removeEventListener('unhandledrejection', rejectionHandler);
      }
    };
  }, []);

  // Filter logs based on log level and filter text, using the combined logs
  const combinedLogs = [...localLogs, ...(logs || [])];
  const filteredLogs = combinedLogs.filter(log => {
    // Filter by log level
    if (logLevel !== 'all' && log.log_level !== logLevel) {
      return false;
    }

    // Filter by text
    if (filterText && log.message) {
      return log.message.toLowerCase().includes(filterText.toLowerCase());
    }

    return true;
  });

  // Function to clear all logs
  const clearLogs = () => {
    // Clear local logs
    setLocalLogs([]);
    // Optionally, you can also clear logs from other sources if needed
    console.clear();
  };

  // Function to clear all logs
  const handleClearLogs = () => {
    // Clear local logs
    setLocalLogs([]);
    // Also call the parent clearLogs function if available
    if (clearLogs) {
      clearLogs();
    }
  };

  // Get log level class for styling
  const getLogLevelClass = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return 'convex-panel-log-error';
      case 'warn':
        return 'convex-panel-log-warning';
      case 'debug':
        return 'convex-panel-log-debug';
      case 'info':
        return 'convex-panel-log-info';
      default:
        return '';
    }
  };

  // Function to render log content based on its type
  const renderLogContent = (log: LogEntry) => {
    // First check if we have raw data to display
    if (log.raw && log.raw.length > 0) {
      // For a single value, show it directly
      if (log.raw.length === 1) {
        return <JsonView data={log.raw[0]} />;
      }
      // For multiple values, display them as separate components
      return (
        <div className="log-argument-container">
          {log.raw.map((item: any, i: number) => (
            <span key={i} className="log-argument">
              {i > 0 && <span className="log-separator"> </span>}
              <JsonView data={item} />
            </span>
          ))}
        </div>
      );
    }
    
    // Fallback to using message if no raw data
    if (typeof log.message === 'string') {
      // Try to parse message as JSON if it looks like JSON
      if (log.message.startsWith('{') && log.message.endsWith('}')) {
        try {
          const jsonData = JSON.parse(log.message);
          return <JsonView data={jsonData} />;
        } catch {
          return log.message;
        }
      }
      return log.message;
    }
    
    // Default case
    return log.message ? String(log.message) : '';
  };

  // Format timestamp to match Chrome: "hh:mm:ss"
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toTimeString().split(' ')[0];
  };

  const handleLogTypeChange = (type: string) => {
    setLogType(type);
  };

  /**
 * Handle tab changes
 */
  const handleTabChange = (tab: DevToolsTabTypes | TabTypes) => {
    setActiveTab(tab as DevToolsTabTypes);
    setStorageItem(STORAGE_KEYS.DEVTOOLS_ACTIVE_TAB, tab);
  };

  return (
    <div className="convex-panel-devtools-container">
      {/* DevTools Tabs */}
      <div className="convex-panel-devtools-tabs">
        <div 
          role="tablist" 
          aria-orientation="horizontal" 
          className="convex-panel-tab-list" 
          tabIndex={0} 
          data-orientation="horizontal" 
          style={{ outline: 'none' }}
        >
          {DEVTOOL_TABS.map(({ id, label }) => (
            <TabButton
              key={id}
              tabId={id}
              label={label}
              activeTab={activeTab}
              onClick={handleTabChange}
              devtools={true}
            />
          ))}
        </div>
        
        {/* Settings button */}
        {/* <div className="convex-panel-settings-container">
          <SettingsButton 
            onSettingsChange={handleSettingsChange}
            theme={theme}
          />
        </div> */}
      </div>

      {/* Console Panel */}
      {activeTab === CONSOLE && (
        <>
          <div className="convex-panel-toolbar">
            <div className="convex-panel-toolbar-button-container">
              <button 
                className="convex-panel-clear-button"
                onClick={clearLogs}
              >
                Clear Console
              </button>
            </div>
            <div className="convex-panel-filter-container">
              <input
                type="text"
                placeholder="Filter logs..."
                className="convex-panel-filter-input"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            <div className="convex-panel-log-level-selector">
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
                  <span>{CONSOLE_FILTER_TYPES.find(t => t.value === logType)?.label || logType}</span>
                  <ChevronDownIcon />
                </button>
                
                {isLogTypeDropdownOpen && (
                  <div 
                    className="convex-panel-filter-menu-dropdown-content"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {CONSOLE_FILTER_TYPES.map((type) => (
                      <button
                        type="button"
                        key={type.value}
                        className={`convex-panel-filter-menu-option ${logType === type.value ? 'convex-panel-filter-menu-option-selected' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLogTypeChange(type.value);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div 
            className="convex-panel-devtools-logs"
            style={{ 
              height: containerSize.height - 88, // Adjust for toolbar + tabs height
              overflowY: 'auto'
            }}
          >
            {filteredLogs.length === 0 ? (
              <div className="convex-panel-devtools-empty">
                <p>No console logs to display.</p>
              </div>
            ) : (
              <div className="convex-panel-devtools-logs-list">
                {filteredLogs.map((log, index) => (
                  <div 
                    key={`${log.timestamp}-${index}`} 
                    className={`convex-panel-devtools-log-entry ${getLogLevelClass(log.log_level)}`}
                  >
                    <div className="convex-panel-devtools-log-timestamp">
                      {formatTimestamp(log.timestamp)}
                    </div>
                    <div className="convex-panel-devtools-log-message">
                      {renderLogContent(log)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Network Panel */}
      {activeTab === NETWORK && (
        <NetworkPanel 
          mergedTheme={mergedTheme}
          settings={settings}
          containerSize={{
            width: containerSize.width,
            height: containerSize.height - 44 // Adjust for tabs height
          }}
        />
      )}
    </div>
  );
};

export default DevToolsContainer; 