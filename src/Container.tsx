import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
// @ts-ignore
import { motion, PanInfo } from 'framer-motion';
import debounce from 'debounce';
import { ContainerProps, LogEntry } from "./types/index";
import { cardVariants } from './theme';
import { getLogId } from './utils';
import DataTable from './data/DataTable';
import { SettingsButton, ConvexPanelSettings } from './settings';
import { getStorageItem, setStorageItem } from './utils/storage';
import { HealthContainer } from './health';
import { defaultSettings, INTERVALS, STORAGE_KEYS, TABS, TabTypes, LogType, DevToolsTabTypes } from './utils/constants';
import { fetchLogsFromApi } from './utils/api';
import { createFilterPredicate } from './utils/filters';
import { TabButton } from './components/TabButton';
import LogsContainer from './logs/LogsContainer';
import { DevToolsContainer } from './devtools';
import { ConvexFavicon } from './components/icons';
import { FunctionsProvider } from './functions/FunctionsProvider';
import { FunctionsView } from './functions/FunctionsView';

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

  /**
   * Whether to use mock data instead of real API data.
   * Useful for development, testing, and demos.
   * When true, the component will use mock data instead of making API calls.
   * @default false
   */
  useMockData = false
}: ContainerProps) => {
  let baseUrl =  deployUrl!;

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
  const [convexUrl, setConvexUrl] = useState<string>(deployUrl!);
  const unregisterConsoleHandler = useRef<(() => void) | null>(null);
  
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

  // Add a ref to track if user has manually scrolled
  const userHasScrolled = useRef(false);
  
  // Function to handle scroll events on the logs list
  const handleLogScroll = useCallback((event: Event) => {
    const target = event.target as HTMLElement;
    
    // If user has scrolled down at all
    if (target.scrollTop > 0) {
      userHasScrolled.current = true;
      
      // Auto-pause logs when scrolled down
      if (!isPaused) {
        setIsPaused(true);
      }
    } else {
      // If scrolled back to top
      userHasScrolled.current = false;
      
      // Auto-resume logs when scrolled to top
      if (isPaused) {
        setIsPaused(false);
      }
    }
  }, [isPaused, setIsPaused]);
  
  // Add scroll event listener to the logs list
  useEffect(() => {
    const logsListContainer = document.querySelector('.convex-panel-logs-list');
    
    if (logsListContainer) {
      logsListContainer.addEventListener('scroll', handleLogScroll);
    }
    
    return () => {
      if (logsListContainer) {
        logsListContainer.removeEventListener('scroll', handleLogScroll);
      }
    };
  }, [handleLogScroll]);
  
  /**
   * Fetch logs
   */
  const fetchLogs = useCallback(async () => {
    // Don't fetch if the panel is closed or paused
    if (!isOpen || isPaused) {
      return;
    }
        
    // For mock data, clear any error message immediately
    if (useMockData) {
      setError(null);
      setShowRetryButton(false);
    }
    
    // For real data, we use convexUrl and accessToken
    // For mock data, we can skip
    if (!useMockData && (!convexUrl || !accessToken)) {
      console.error("Missing convexUrl or accessToken, skipping fetch");
      return;
    }
        
    // Prevent frequent polling with a more strict check
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    if (timeSinceLastFetch < INTERVALS.MIN_FETCH_INTERVAL) {
      return;
    }
    
    // Update last fetch time
    lastFetchTime.current = now;
    
    // Only cancel previous request if it's still pending and we're not using mock data
    // Mock data doesn't need AbortController since it's not making real network requests
    if (!useMockData && pendingRequest.current?.signal.aborted === false) {
      pendingRequest.current.abort();
    }
    
    // Only create a new AbortController if we're not using mock data
    if (!useMockData) {
      pendingRequest.current = new AbortController();
    }
    
    setIsLoading(true);
    
    // Only show "Waiting for logs" if we're not already watching
    if (!isWatching || !error || (typeof error === 'string' && (error.includes('Failed to fetch logs') || error.includes('Request timed out')))) {
      setError("Waiting for logs...");
    }
    
    try {
      const response = await fetchLogsFromApi({
        cursor,
        convexUrl: useMockData ? 'mock-deployment.convex.cloud' : convexUrl,
        accessToken: useMockData ? 'mock-token' : accessToken,
        signal: useMockData ? undefined : pendingRequest.current?.signal,
        useMockData
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
      // Only update the message if we don't have logs yet and we're not using mock data
      if (logs.length === 0) {
        if (useMockData) {
          // For mock data, don't show any error message
          setError(null);
        } else {
          setError(`Watching logs for ${response.hostname.split('.')[0]}...`);
        }
      }
      
      // Filter out duplicate logs
      const newLogs = response.logs.filter((log: LogEntry) => {
        const logId = getLogId(log);
        if (logIds.has(logId)) {
          return false;
        }
        logIds.add(logId);
        return true;
      });
            
      // Add logs to the list
      if (newLogs.length > 0) {
        setLogs((prev: LogEntry[]) => {
          // Sort logs by timestamp in descending order (newest first)
          // This ensures consistent chronological ordering regardless of when logs are received
          const combined = [...newLogs, ...prev];
          const sorted = combined.sort((a, b) => b.timestamp - a.timestamp);
          
          // Limit the number of logs to prevent memory issues
          return sorted.slice(0, maxStoredLogs);
        });
        
        // If we're at the top (not scrolled), scroll to top to show new logs
        if (!userHasScrolled.current) {
          const logsListContainer = document.querySelector('.convex-panel-logs-list');
          if (logsListContainer) {
            requestAnimationFrame(() => {
              logsListContainer.scrollTop = 0;
            });
          }
        }
        
        if (onLogFetch) {
          onLogFetch(newLogs);
        }
        
        // Update the message to indicate we're watching logs (not an error)
        if (!useMockData) {
          setError(`Watching logs for ${response.hostname.split('.')[0]}...`);
        } else {
          // For mock data, don't show any error message
          setError(null);
        }
      } else if (logs.length === 0) {
        // If no logs were returned and we don't have any logs yet, update the message
        if (!useMockData) {
          setError(`Watching logs for ${response.hostname.split('.')[0]}...`);
        } else {
          // For mock data, don't show any error message
          setError(null);
        }
      }
    } catch (err) {
      // Skip error handling entirely for aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        setIsLoading(false);
        return;
      }
      
      // Only log non-abort errors
      console.error("Error fetching logs:", err);
      
      // Skip API-specific error handling when using mock data
      if (useMockData) {
        setIsLoading(false);
        return;
      }
      
      // Handle timeout errors
      if (err instanceof Error && err.message.includes('HTTP 504') && retryAttempts < INTERVALS.MAX_RETRY_ATTEMPTS) {
        setRetryAttempts((prev: number) => prev + 1);
        setError(`Request timed out. Retrying in ${INTERVALS.RETRY_DELAY/1000} seconds... (Attempt ${retryAttempts + 1}/${INTERVALS.MAX_RETRY_ATTEMPTS})`);
        
        setTimeout(() => {
          if (isOpen && !isPaused) {
            fetchLogs();
          }
        }, INTERVALS.RETRY_DELAY);
        return;
      }
      
      if (onError && err instanceof Error) {
        onError(err.message);
      }
      
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setConsecutiveErrors((prev: number) => prev + 1);
      
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
    logs.length,
    userHasScrolled,
    useMockData
  ]);

  /**
   * Auto-refresh logs when watching
   */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const scheduleNextFetch = () => {
      // For mock data, we only need to check if the panel is open and not paused
      // For real data, we also need to check if we're watching and not permanently disabled
      const shouldSchedule = useMockData 
        ? isOpen && !isPaused 
        : isOpen && !isPaused && isWatching && !isPermanentlyDisabled;
      
      if (shouldSchedule) {
        timeoutId = setTimeout(() => {
          fetchLogs().finally(() => {
            // Schedule next fetch only after current one completes
            scheduleNextFetch();
          });
        }, INTERVALS.MIN_FETCH_INTERVAL);
      }
    };
    
    // Initial fetch when watching starts
    // For mock data, we start fetching as soon as the panel is open
    // For real data, we wait until we're watching
    const shouldStartFetching = useMockData 
      ? isOpen && !isPaused 
      : isOpen && !isPaused && isWatching && !isPermanentlyDisabled;
    
    if (shouldStartFetching) {
      scheduleNextFetch();
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOpen, isPaused, isWatching, isPermanentlyDisabled, fetchLogs, useMockData]);

  /**
   * Set up polling interval for fetching logs
   */
  useEffect(() => {
    // Skip this effect entirely when using mock data
    // The auto-refresh effect above will handle mock data
    if (useMockData) return;
    
    if (!isOpen || isPaused || isPermanentlyDisabled) return;
    
    // Set up polling interval
    const intervalId = setInterval(() => {
      fetchLogs();
    }, INTERVALS.POLLING_INTERVAL);
    
    // Clean up interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen, isPaused, isPermanentlyDisabled, fetchLogs, INTERVALS.POLLING_INTERVAL, useMockData]);

  /**
   * Refresh logs when the container is opened
   */
  const refreshLogs = useCallback(() => {
    // For mock data, we only need to check if the panel is not paused
    // For real data, we also need to check if it's not permanently disabled
    const shouldRefresh = useMockData 
      ? !isPaused 
      : !isPaused && !isPermanentlyDisabled;
    
    if (shouldRefresh) {
      fetchLogs();
    }
  }, [fetchLogs, isPaused, isPermanentlyDisabled, useMockData]);

  // call refreshLogs when the container is opened
  useEffect(() => {
    if (isOpen) {
      // For mock data, we always want to refresh logs when the container is opened
      // For real data, we only refresh if we have the necessary API credentials
      if (useMockData || (convexUrl && accessToken)) {
        refreshLogs();
      }
    }
  }, [isOpen, refreshLogs, convexUrl, accessToken, useMockData]);

  /**
   * Toggle the pause state of the logs
   */
  const togglePause = useCallback(() => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
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
    const target = event.target as HTMLElement;
    if (target.closest('#convex-panel-header')) {
      dragControls.start(event);
    }
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
      setPosition((prev: { x: number; y: number }) => constrainPosition(prev));
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
  const renderErrorWithRetry = useCallback(() => {
    if (!error) return null;
    
    // Don't show any error message or retry button for mock data
    if (useMockData) {
      return null;
    }
    
    const handleRetry = () => {
      // Only reset API-specific states when not using mock data
      if (!useMockData) {
        setIsPermanentlyDisabled(false);
        setConsecutiveErrors(0);
      }
      refreshLogs();
    };
    
    return (
      <div className="convex-panel-error">
        <div className="convex-panel-error-message">{error}</div>
        {showRetryButton && (
          <button className="convex-panel-retry-button" onClick={handleRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }, [error, refreshLogs, showRetryButton, useMockData]);

  // Render a message when the panel is permanently disabled
  const renderPermanentlyDisabled = useCallback(() => {
    return (
      <div className="convex-panel-error">
        <div className="convex-panel-error-message">
          Connection to Convex has been permanently disabled due to too many errors.
        </div>
        <button 
          className="convex-panel-retry-button" 
          onClick={() => {
            setIsPermanentlyDisabled(false);
            setConsecutiveErrors(0);
            refreshLogs();
          }}
        >
          Retry
        </button>
      </div>
    );
  }, [refreshLogs]);

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
  const handleTabChange = useCallback((tab: TabTypes | DevToolsTabTypes) => {
    setActiveTab(tab as TabTypes);
    setStorageItem(STORAGE_KEYS.ACTIVE_TAB, tab as TabTypes);
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

  /**
   * Compare version strings (e.g., "0.1.33" vs "0.1.34")
   */
  const compareVersions = useCallback((current: string, latest: string): boolean => {
    const currentParts = current.replace(/^v/, '').split('.').map(Number);
    const latestParts = latest.replace(/^v/, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;
      
      if (latestPart > currentPart) {
        return true; // Update available
      } else if (latestPart < currentPart) {
        return false; // Current is newer
      }
    }
    
    return false; // Versions are equal
  }, []);


  const renderContent = () => {
    // If the panel is closed, don't render anything
    if (!isOpen) {
      return null;
    }

    // Handle different tabs
    switch (activeTab) {
      case 'logs':
        // This function only handles the logs tab content
        // If we're using mock data for logs, show the logs list
        if (useMockData) {
          return (
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
              settings={settings}
            />
          );
        }

        // For real data, handle various states
        if (isPermanentlyDisabled) {
          return renderPermanentlyDisabled();
        }

        if (error && showRetryButton) {
          return renderErrorWithRetry();
        }

        return (
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
            settings={settings}
          />
        );

      case 'data-tables':
        return (
          <DataTable
            key={`data-table-${JSON.stringify(settings)}-${useMockData}`}
            convexUrl={convexUrl}
            accessToken={accessToken}
            onError={onError}
            theme={theme}
            baseUrl={baseUrl || ''}
            convex={convex}
            adminClient={adminClient}
            settings={settings}
            useMockData={useMockData}
          />
        );
        
      case 'health':
        return (
          <HealthContainer 
            deploymentUrl={convexUrl}
            authToken={accessToken}
            useMockData={useMockData}
          />
        );

      case 'devtools':
        return (
          <DevToolsContainer
            mergedTheme={mergedTheme}
            settings={settings}
            containerSize={containerSize}
          />
        );

      case 'functions':
        return (
          <FunctionsProvider
            initialModules={new Map()}
            convexClient={adminClient}
            baseUrl={deployUrl || ''}
          >
            <FunctionsView theme={mergedTheme} authToken={accessToken} baseUrl={baseUrl} />
          </FunctionsProvider>
        );
        
      default:
        return null;
    }
  };

  return (
    <motion.div
      {...{
        ref: containerRef,
        className: "convex-panel-card",
        variants: cardVariants,
        initial: "hidden",
        animate: "visible",
        exit: "exit",
        drag: true,
        dragControls,
        dragMomentum: false,
        dragElastic: 0,
        dragListener: false,
        whileDrag: { cursor: 'grabbing' },
        onPointerDown: startDrag,
        onDragEnd: (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
          setPosition((prev: { x: number; y: number }) => {
            const newPos = {
              x: prev.x + info.offset.x,
              y: prev.y + info.offset.y
            };
            return constrainPosition(newPos);
          });
        },
        style: {
          x: position.x,
          y: position.y,
          width: containerSize.width,
        }
      } as any}
    >
      <div id="convex-panel-header" className="convex-panel-header-container">
        <div 
          className="convex-panel-header" 
          role="presentation"
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
                href={useMockData ? "https://convex.dev" : (convexUrl ? `https://${convexUrl.replace('https://', '')}` : "https://dashboard.convex.dev")}
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
      
      {activeTab === 'logs' && renderContent()}

      {activeTab === 'data-tables' && (
        <DataTable
          key={`data-table-${JSON.stringify(settings)}-${useMockData}`}
          convexUrl={convexUrl}
          accessToken={accessToken}
          onError={onError}
          theme={theme}
          baseUrl={baseUrl || ''}
          convex={convex}
          adminClient={adminClient}
          settings={settings}
          useMockData={useMockData}
        />
      )}
      
      {activeTab === 'health' && (
        <HealthContainer 
          deploymentUrl={convexUrl}
          authToken={accessToken}
          useMockData={useMockData}
        />
      )}

      {activeTab === 'devtools' && (
        <DevToolsContainer
          mergedTheme={mergedTheme}
          settings={settings}
          containerSize={containerSize}
        />
      )}

      {activeTab === 'functions' && (
        <FunctionsProvider
          initialModules={new Map()}
          convexClient={adminClient}
          baseUrl={deployUrl || ''}
        >
          <FunctionsView theme={mergedTheme} authToken={accessToken} baseUrl={baseUrl} />
        </FunctionsProvider>
      )}
    </motion.div>
  );
};

Container.displayName = 'Container';

export default Container; 