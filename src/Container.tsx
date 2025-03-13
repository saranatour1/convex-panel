import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import debounce from 'debounce';
import { ContainerProps, LogEntry } from "./types";
import { LogType } from './utils/constants';
import { cardVariants } from './theme';
import { getLogId } from './utils';
import DataTable from './data/DataTable';
import { SettingsButton, ConvexPanelSettings } from './settings';
import { getStorageItem, setStorageItem } from './utils/storage';
import { HealthContainer } from './health';
import { defaultSettings, INTERVALS, STORAGE_KEYS, TabTypes } from './utils/constants';
import { fetchLogsFromApi } from './utils/api';
import { createFilterPredicate } from './utils/filters';
import { TabButton } from './components/TabButton';
import LogsContainer from './logs/LogsContainer';
import { ConvexFavicon } from './components/icons';

const TABS = [
  { id: 'logs' as const, label: 'Logs' },
  { id: 'data-tables' as const, label: 'Data' },
  { id: 'health' as const, label: 'Health' },
] as const;

const Container = ({
  /** 
   * Controls visibility of the main container.
   * @required
   */
  isOpen,

  /** 
   * Function to toggle the panel open/closed state.
   * @required
   */
  toggleOpen,

  /** 
   * Initial number of logs to fetch and display.
   * Controls the initial page size when loading logs.
   * @default 100
   */
  initialLimit = 100,

  /**
   * Whether to show successful logs in the initial view.
   * Can be toggled by the user in the UI.
   * @default true
   */
  initialShowSuccess = true,

  /**
   * Initial log type filter to apply when panel first loads.
   * Options include: ALL, SUCCESS, FAILURE, DEBUG, LOGINFO, WARNING, ERROR, HTTP
   * Controls which types of operations are displayed.
   * Can be changed by the user via dropdown.
   * @default LogType.ALL
   */
  initialLogType = LogType.ALL,

  /**
   * Callback fired whenever new logs are fetched.
   * Receives array of log entries as parameter.
   * Useful for external monitoring or processing of logs.
   * @param logs Array of LogEntry objects
   */
  onLogFetch,

  /**
   * Error handling callback.
   * Called when errors occur during log fetching or processing.
   * Receives error message string as parameter.
   * @param error Error message
   */
  onError,

  /**
   * Theme customization object to override default styles.
   * Supports customizing colors, spacing, and component styles.
   * See ThemeClasses interface for available options.
   * @default {}
   */
  theme = {},

  /**
   * Maximum number of logs to keep in memory.
   * Prevents memory issues from storing too many logs.
   * Older logs are removed when limit is reached.
   * @default 500
   */
  maxStoredLogs = 500,

  /**
   * Current position of the panel.
   * Coordinates object with x and y values.
   * Used for draggable positioning.
   * @required
   */
  position,

  /**
   * Function to update panel position.
   * Called during drag operations to update coordinates.
   * @required
   */
  setPosition,

  /**
   * Current size of the panel.
   * Dimensions object with width and height values.
   * Used for resizable container.
   * @required
   */
  containerSize,

  /**
   * Function to update panel size.
   * Called during resize operations to update dimensions.
   * @required
   */
  setContainerSize,

  /**
   * Framer Motion drag controls.
   * Used to enable draggable functionality.
   * @required
   */
  dragControls,

  /**
   * Convex React client instance.
   * Required for making API calls to your Convex backend.
   * Must be initialized and configured before passing.
   * @required
   */
  convex,

  /**
   * Enables admin-level operations in Convex.
   * Should only be used in secure environments.
   * @required
   */
  adminClient,

  /**
   * Initial active tab to display.
   * Controls which view is shown first.
   * @required
   */
  initialActiveTab,

  /**
   * Authentication token for accessing Convex API.
   * Required for securing access to data.
   * Should be kept private and not exposed to clients.
   * @required
   */
  accessToken,

  /**
   * Optional deploy URL for the Convex deployment.
   * Used to configure the admin client connection.
   * Default is the environment variable CONVEX_DEPLOYMENT.
   * @optional
   */
  deployUrl,
}: ContainerProps) => {
  let baseUrl;

  const containerRef = useRef<HTMLDivElement>(null);
  const lastFetchTime = useRef<number>(0);
  const resizeStartPosition = useRef({ x: 0, y: 0 });
  const pendingRequest = useRef<AbortController | null>(null);
  const mergedTheme = useMemo(() => theme, [theme]);
  const [logIds] = useState(() => new Set<string>());
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [showSuccess, setShowSuccess] = useState(initialShowSuccess);
  const [logType, setLogType] = useState(initialLogType);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [isPermanentlyDisabled, setIsPermanentlyDisabled] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [debouncedFilterText, setDebouncedFilterText] = useState('');
  const [requestIdFilter, setRequestIdFilter] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const [cursor, setCursor] = useState<number | string>(0);
  const [excludeViewerQueries, setExcludeViewerQueries] = useState(true);
  const [convexUrl, setConvexUrl] = useState<string>(process.env.NEXT_PUBLIC_CONVEX_URL! || deployUrl!);
  
  /**
   * Retrieve active tab from localStorage or use initialActiveTab
   */
  const [activeTab, setActiveTab] = useState<TabTypes>(() => {
    if (typeof window !== 'undefined') {
      return getStorageItem<TabTypes>(STORAGE_KEYS.ACTIVE_TAB, initialActiveTab);
    }
    return initialActiveTab;
  });

  /**
   * Retrieve settings from localStorage or use defaultSettings
   */
  const [settings, setSettings] = useState<ConvexPanelSettings>(() => {
    if (typeof window !== 'undefined') {
      return getStorageItem<ConvexPanelSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
    }
    return defaultSettings;
  });

  /**
   * Get Convex URL from environment if not provided as prop
   */
  useEffect(() => {
    if (!convexUrl && typeof window !== 'undefined') {
      const envUrl = (window as any).ENV?.NEXT_PUBLIC_CONVEX_URL || deployUrl;
      
      if (envUrl) {
        setConvexUrl(envUrl);
      }
    }
  }, [convexUrl]);

  /**
   * Debounce filter text changes
   */
  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedFilterText(filterText);
    }, 300);
    
    handler();
    return () => handler.clear();
  }, [filterText]);

  /**
   * Fetch logs
   */
  const fetchLogs = useCallback(async () => {
    if (!isOpen || isPaused || !convexUrl || !accessToken) return;
    
    // Prevent frequent polling with a more strict check
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    if (timeSinceLastFetch < INTERVALS.MIN_FETCH_INTERVAL) {
      return;
    }
    
    // Only cancel previous request if it's still pending
    if (pendingRequest.current?.signal.aborted === false) {
      pendingRequest.current.abort();
    }
    
    pendingRequest.current = new AbortController();
    
    setIsLoading(true);
    
    // Only show "Waiting for logs" if we're not already watching
    if (!isWatching || !error || error.includes('Failed to fetch logs') || error.includes('Request timed out')) {
      setError("Waiting for logs...");
    }
    
    try {
      const response = await fetchLogsFromApi({
        cursor,
        convexUrl,
        accessToken,
        signal: pendingRequest.current.signal
      });
      
      // Reset retry attempts on success
      setRetryAttempts(0);
      setConsecutiveErrors(0);
      setShowRetryButton(false);
      
      // Update cursor for next poll if available and different from current
      if (response.newCursor && response.newCursor !== cursor) {
        setCursor(response.newCursor);
      }
      
      // Set watching state
      setIsWatching(true);
      
      // Update the message to indicate we're watching logs (not an error)
      // Only update the message if we don't have logs yet
      if (logs.length === 0) {
        setError(`Watching logs for ${response.hostname.split('.')[0]}...`);
      }
      
      // Filter out duplicate logs
      const newLogs = response.logs.filter((log: LogEntry) => {
        const logId = getLogId(log);
        if (logIds.has(logId)) return false;
        logIds.add(logId);
        return true;
      });
      
      // Add logs to the list
      if (newLogs.length > 0) {
        setLogs(prev => {
          const combined = [...newLogs, ...prev];
          const sorted = combined.sort((a, b) => b.timestamp - a.timestamp);
          return sorted.slice(0, maxStoredLogs);
        });
        
        if (onLogFetch) {
          onLogFetch(newLogs);
        }
        
        // Update the message to indicate we're watching logs (not an error)
        setError(`Watching logs for ${response.hostname.split('.')[0]}...`);
      } else if (logs.length === 0) {
        // If no logs were returned and we don't have any logs yet, update the message
        setError(`Watching logs for ${response.hostname.split('.')[0]}...`);
      }
    } catch (err) {
      // Handle timeout errors
      if (err instanceof Error && err.message.includes('HTTP 504') && retryAttempts < INTERVALS.MAX_RETRY_ATTEMPTS) {
        setRetryAttempts(prev => prev + 1);
        setError(`Request timed out. Retrying in ${INTERVALS.RETRY_DELAY/1000} seconds... (Attempt ${retryAttempts + 1}/${INTERVALS.MAX_RETRY_ATTEMPTS})`);
        
        setTimeout(() => {
          if (isOpen && !isPaused) {
            fetchLogs();
          }
        }, INTERVALS.RETRY_DELAY);
        return;
      }
      
      // Don't handle aborted requests as errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      if (onError && err instanceof Error) {
        onError(err.message);
      }
      
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setConsecutiveErrors(prev => prev + 1);
      
      if (consecutiveErrors >= INTERVALS.MAX_CONSECUTIVE_ERRORS) {
        setIsPermanentlyDisabled(true);
        setError(`Too many consecutive errors (${consecutiveErrors}). Connection disabled.`);
      } else {
        setShowRetryButton(true);
      }
    } finally {
      // Reset pending request if it was aborted
      if (pendingRequest.current?.signal.aborted) {
        pendingRequest.current = null;
      }
      setIsLoading(false);
    }
  }, [
    isOpen, 
    isPaused, 
    cursor, 
    logIds, 
    maxStoredLogs, 
    onLogFetch, 
    retryAttempts, 
    getLogId, 
    INTERVALS.MAX_RETRY_ATTEMPTS, 
    convexUrl, 
    accessToken, 
    consecutiveErrors, 
    INTERVALS.MAX_CONSECUTIVE_ERRORS, 
    onError,
    error, 
    isWatching, 
    logs.length
  ]);

  /**
   * Auto-refresh logs when watching
   */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const scheduleNextFetch = () => {
      if (isOpen && !isPaused && isWatching && !isPermanentlyDisabled) {
        timeoutId = setTimeout(() => {
          fetchLogs().finally(() => {
            // Schedule next fetch only after current one completes
            scheduleNextFetch();
          });
        }, INTERVALS.MIN_FETCH_INTERVAL);
      }
    };
    
    // Initial fetch when watching starts
    if (isOpen && !isPaused && isWatching && !isPermanentlyDisabled) {
      scheduleNextFetch();
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOpen, isPaused, isWatching, isPermanentlyDisabled, fetchLogs]);

  /**
   * Refresh logs when the container is opened
   */
  const refreshLogs = useCallback(() => {
    if (!isPaused && !isPermanentlyDisabled) {
      fetchLogs();
    }
  }, [fetchLogs, isPaused, isPermanentlyDisabled, isOpen]);

  // call refreshLogs when the container is opened
  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen, refreshLogs]);

  /**
   * Toggle the pause state of the logs
   */
  const togglePause = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  /**
   * Clear the logs and reset the cursor
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
    logIds.clear();
    setCursor(0);
  }, [logIds]);

  /**
   * Handle log selection
   */
  const handleLogSelect = useCallback((log: LogEntry) => {
    setSelectedLog(log);
    setIsDetailPanelOpen(true);
  }, []);

  /**
   * Start drag
   */
  function startDrag(event: React.PointerEvent) {
    dragControls.start(event);
  }

  /**
   * Handle resize move with boundary constraints
   */
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    // Calculate delta
    const deltaX = e.clientX - resizeStartPosition.current.x;
    const deltaY = e.clientY - resizeStartPosition.current.y;
    
    // Calculate new size
    const newWidth = Math.max(400, resizeStartSize.current.width + deltaX);
    const newHeight = Math.max(300, resizeStartSize.current.height + deltaY);
    
    // Get window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Ensure the container doesn't exceed window boundaries
    const boundedWidth = Math.min(newWidth, windowWidth - position.x - 20);
    const boundedHeight = Math.min(newHeight, windowHeight - position.y - 20);
    
    setContainerSize({
      width: boundedWidth,
      height: boundedHeight
    });
  }, [isResizing, position.x, position.y]);

  /**
   * Handle resize end
   */
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);
  
  /**
   * Utility function to constrain container position within viewport bounds
   * Ensures at least 40px of the container is always visible
   */
  const constrainPosition = useCallback((pos: { x: number; y: number }) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const containerWidth = containerSize.width;
    const containerHeight = containerSize.height;
    
    return {
      x: Math.min(Math.max(pos.x, -containerWidth + 40), windowWidth - 40),
      y: Math.min(Math.max(pos.y, -containerHeight + 40), windowHeight - 40)
    };
  }, [containerSize.width, containerSize.height]);

  /**
   * Handle window resize events to keep container within bounds
   * Adjusts both position and size when window dimensions change
   */
  useEffect(() => {
    const handleWindowResize = () => {
      setPosition(prev => constrainPosition(prev));
      
      // Constrain container size if window gets smaller
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      if (containerSize.width > windowWidth - position.x - 20 || 
          containerSize.height > windowHeight - position.y - 20) {
        setContainerSize({
          width: Math.min(containerSize.width, windowWidth - position.x - 20),
          height: Math.min(containerSize.height, windowHeight - position.y - 20)
        });
      }
    };
    
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [containerSize, position, constrainPosition]);

  /**
   * Remove event listeners on unmount
   */
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  /**
   * Render the retry button
   * Will be shown if there is an error and the connection is not permanently disabled
   */
  const renderErrorWithRetry = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="convex-panel-error">{error}</div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setError(null);
              setShowRetryButton(false);
              setIsPermanentlyDisabled(false);
              setConsecutiveErrors(0);
              fetchLogs();
            }}
            className="convex-panel-button-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  };

  /**
   * Optimized filtering logic using memoized filter predicates
   */
  const filteredLogs = useMemo(() => {
    const filterPredicate = createFilterPredicate(
      logType,
      requestIdFilter,
      showSuccess,
      debouncedFilterText
    );
    
    return logs.filter(filterPredicate);
  }, [logs, logType, requestIdFilter, showSuccess, debouncedFilterText]);

  /**
   * Handle settings changes
   */
  const handleSettingsChange = useCallback((newSettings: ConvexPanelSettings) => {
    // Update settings state
    setSettings(newSettings);
    
    // Save settings to localStorage
    if (typeof window !== 'undefined') {
      setStorageItem(STORAGE_KEYS.SETTINGS, newSettings);
    }
    
    // Force re-render of the current tab content
    const currentTab = activeTab;
    
    // Use requestAnimationFrame to ensure the state change is processed
    // before setting back to the original tab
    requestAnimationFrame(() => {
      setActiveTab('logs');
      setStorageItem(STORAGE_KEYS.ACTIVE_TAB, 'logs');
      
      // Use another requestAnimationFrame to switch back to the original tab
      requestAnimationFrame(() => {
        setActiveTab(currentTab);
        setStorageItem(STORAGE_KEYS.ACTIVE_TAB, currentTab);
      });
    });
  }, [activeTab]);

  /**
   * Handle tab changes
   */
  const handleTabChange = useCallback((tab: TabTypes) => {
    setActiveTab(tab);
    setStorageItem(STORAGE_KEYS.ACTIVE_TAB, tab);
  }, []);

  // Cleanup effect to cancel pending requests on unmount
  useEffect(() => {
    return () => {
      if (pendingRequest.current) {
        pendingRequest.current.abort();
        pendingRequest.current = null;
      }
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="convex-panel-card"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(_, info) => {
        setPosition((prev: { x: number; y: number }) => {
          const newPos = {
            x: prev.x + info.offset.x,
            y: prev.y + info.offset.y
          };
          return constrainPosition(newPos);
        });
      }}
      style={{
        x: position.x,
        y: position.y,
        width: containerSize.width,
        // height: containerSize.height
      }}
    >
      <div className="convex-panel-header-container">
        <div 
          className="convex-panel-header" 
          role="presentation"
          onPointerDown={startDrag}
          style={{ cursor: 'grab' }}
        >
          <div className="convex-panel-header-content convex-panel-header-content-main"> 
            <div className="convex-panel-window-controls">
              <div 
                className="convex-panel-window-control convex-panel-close"
                onClick={toggleOpen}
              >
                <span className="convex-panel-window-control-icon convex-panel-close-icon">×</span>
              </div>
              <div 
                className="convex-panel-window-control convex-panel-minimize"
                onClick={toggleOpen}
              >
                <span className="convex-panel-window-control-icon convex-panel-minimize-icon">−</span>
              </div>
              <div 
                className="convex-panel-window-control convex-panel-maximize" 
                onClick={() => {
                  if (containerSize.width >= window.innerWidth - 100 && 
                      containerSize.height >= window.innerHeight - 100) {
                    setContainerSize({
                      width: 1000,
                      height: 500
                    });
                    setPosition({ x: 0, y: 0 });
                  } else {
                    setContainerSize({
                      width: window.innerWidth - 100,
                      height: window.innerHeight - 100
                    });
                    setPosition({ x: 50, y: 50 });
                  }
                }}
              >
                <span className="convex-panel-window-control-icon convex-panel-maximize-icon">+</span>
              </div>
            </div>
            <div className="convex-panel-url-container">
              <a 
                href={convexUrl ? `https://${convexUrl.replace('https://', '')}` : "https://dashboard.convex.dev"} 
                target="_blank" 
                rel="noreferrer"
                className="convex-panel-url-link"
              >
                <span className="convex-panel-url-icon">
                  <ConvexFavicon />
                </span>
                <div className="convex-panel-url-text">
                  {convexUrl}
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="convex-panel-tabs">
        <div 
          role="tablist" 
          aria-orientation="horizontal" 
          className="convex-panel-tab-list" 
          tabIndex={0} 
          data-orientation="horizontal" 
          style={{ outline: 'none' }}
        >
          {TABS.map(({ id, label }) => (
            <TabButton
              key={id}
              tabId={id}
              label={label}
              activeTab={activeTab}
              onClick={handleTabChange}
            />
          ))}
        </div>
        
        {/* Settings button */}
        <div className="convex-panel-settings-container">
          <SettingsButton 
            onSettingsChange={handleSettingsChange}
            theme={theme}
          />
        </div>
      </div>
      
      {activeTab === 'logs' && (
        <LogsContainer
          mergedTheme={mergedTheme}
          isPaused={isPaused}
          togglePause={togglePause}
          clearLogs={clearLogs}
          refreshLogs={refreshLogs}
          isLoading={isLoading}
          filterText={filterText}
          setFilterText={setFilterText}
          requestIdFilter={requestIdFilter}
          setRequestIdFilter={setRequestIdFilter}
          limit={limit}
          setLimit={setLimit}
          initialLimit={initialLimit}
          showSuccess={showSuccess}
          setShowSuccess={setShowSuccess}
          isPermanentlyDisabled={isPermanentlyDisabled}
          setIsPermanentlyDisabled={setIsPermanentlyDisabled}
          setConsecutiveErrors={setConsecutiveErrors}
          fetchLogs={fetchLogs}
          logType={logType}
          setLogType={setLogType}
          filteredLogs={filteredLogs}
          containerSize={containerSize}
          isDetailPanelOpen={isDetailPanelOpen}
          selectedLog={selectedLog}
          setIsDetailPanelOpen={setIsDetailPanelOpen}
          handleLogSelect={handleLogSelect}
          error={error as Error | null}
          renderErrorWithRetry={renderErrorWithRetry}
        />
      )}

      {activeTab === 'data-tables' && (
        <DataTable
          key={`data-table-${JSON.stringify(settings)}`}
          convexUrl={convexUrl}
          accessToken={accessToken}
          onError={onError}
          theme={theme}
          baseUrl={baseUrl || ''}
          convex={convex}
          adminClient={adminClient}
          settings={settings}
        />
      )}
      
      {activeTab === 'health' && (
        <HealthContainer 
          deploymentUrl={convexUrl}
          authToken={accessToken}
        />
      )}
    </motion.div>
  );
};

Container.displayName = 'Container';

export default Container; 