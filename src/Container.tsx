import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import debounce from 'debounce';
import { ThemeClasses } from "./types";
import { LogType, LogEntry } from './logs/types';
import { cardVariants } from './theme';
import { getLogId } from './utils';
import LogsToolbar from './logs/LogsToolbar';
import LogsTable from './logs/LogsTable';
import DataTable from './data/DataTable';
import { ConvexReactClient } from 'convex/react';
import { ConvexClient } from 'convex/browser';
import { SettingsButton, ConvexPanelSettings } from './settings';
import { getStorageItem, setStorageItem } from './data/utils/storage';
import { HealthContainer } from './health';

interface LogsContainerProps {
  isOpen: boolean;
  toggleOpen: () => void;
  onToggle?: (isOpen: boolean) => void;
  initialLimit?: number;
  initialShowSuccess?: boolean;
  initialLogType?: LogType;
  onLogFetch?: (logs: LogEntry[]) => void;
  onError?: (error: string) => void;
  theme?: ThemeClasses;
  maxStoredLogs?: number;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  containerSize: { width: number; height: number };
  setContainerSize: (size: { width: number; height: number }) => void;
  dragControls: any;
  convex: ConvexReactClient;
  adminClient: ConvexClient | null;
  initialActiveTab: 'logs' | 'data-tables' | 'health';
  accessToken: string;
  deployUrl?: string;
}

// Define settings storage key
const SETTINGS_STORAGE_KEY = 'convex-panel:settings';
const ACTIVE_TAB_STORAGE_KEY = 'convex-panel:activeTab';

// Default settings
const defaultSettings = {
  showDebugFilters: false,
  showStorageDebug: false,
  logLevel: 'info' as const,
  healthCheckInterval: 60, // seconds
  showRequestIdInput: true,
  showLimitInput: true,
  showSuccessCheckbox: true,
};

const Container = ({
  isOpen,
  toggleOpen,
  onToggle,
  initialLimit = 100,
  initialShowSuccess = true,
  initialLogType = LogType.ALL,
  onLogFetch,
  onError,
  theme = {},
  maxStoredLogs = 500,
  position,
  setPosition,
  containerSize,
  setContainerSize,
  dragControls,
  convex,
  adminClient,
  initialActiveTab,
  accessToken,
  deployUrl,
}: LogsContainerProps) => {
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
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 2000;
  const MAX_CONSECUTIVE_ERRORS = 5;
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [logIds] = useState(() => new Set<string>());
  const pendingRequest = useRef<AbortController | null>(null);
  const [filterText, setFilterText] = useState('');
  const [debouncedFilterText, setDebouncedFilterText] = useState('');
  const [requestIdFilter, setRequestIdFilter] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartPosition = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const [cursor, setCursor] = useState<number | string>(0);
  const lastFetchTime = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 1000;
  const [excludeViewerQueries, setExcludeViewerQueries] = useState(true);
  const [convexUrl, setConvexUrl] = useState<string>(deployUrl || '');
  const [activeTab, setActiveTab] = useState<'logs' | 'data-tables' | 'health'>(() => {
    // Initialize from localStorage if available, otherwise use initialActiveTab
    if (typeof window !== 'undefined') {
      return getStorageItem<'logs' | 'data-tables' | 'health'>(ACTIVE_TAB_STORAGE_KEY, initialActiveTab);
    }
    return initialActiveTab;
  });
  const [settings, setSettings] = useState<ConvexPanelSettings>(() => {
    
    // Initialize from localStorage if available, otherwise use defaults
    if (typeof window !== 'undefined') {
      return getStorageItem<ConvexPanelSettings>(SETTINGS_STORAGE_KEY, defaultSettings);
    }
    return defaultSettings;
  });
  
  let baseUrl;

  // Merge theme with default theme
  const mergedTheme = useMemo(() => theme, [theme]);

  // Add a ref to the container element
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Get Convex URL from environment if not provided as prop
   */
  useEffect(() => {
    if (!convexUrl && typeof window !== 'undefined') {
      const envUrl = (window as any).ENV?.NEXT_PUBLIC_CONVEX_URL || 
                     process.env.NEXT_PUBLIC_CONVEX_URL;
      
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
    
    // Prevent frequent polling
    const now = Date.now();
    if (now - lastFetchTime.current < MIN_FETCH_INTERVAL) {
      return;
    }
    lastFetchTime.current = now;
    
    // Cancel pending requests
    if (pendingRequest.current) {
      pendingRequest.current.abort();
    }
    
    // Create abort controller
    pendingRequest.current = new AbortController();
    
    setIsLoading(true);
    
    // Only show "Waiting for logs" if we're not already watching
    if (!isWatching || !error || error.includes('Failed to fetch logs') || error.includes('Request timed out')) {
      setError("Waiting for logs...");
    }
    
    try {
      // Create URL object based on convex url
      const urlObj = new URL(convexUrl);
      baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
      
      // Fetch logs from Convex API
      const response = await fetch(`${baseUrl}/api/app_metrics/stream_function_logs?cursor=${cursor}`, {
        headers: {
          "authorization": `Convex ${accessToken}`
        },
        signal: pendingRequest.current.signal,
      });
      
      if (!response.ok) {
        if (response.status === 504 && retryAttempts < MAX_RETRY_ATTEMPTS) {
          
          // Increment retry attempts
          setRetryAttempts(prev => prev + 1);
          setError(`Request timed out. Retrying in ${RETRY_DELAY/1000} seconds... (Attempt ${retryAttempts + 1}/${MAX_RETRY_ATTEMPTS})`);
          
          // Schedule timeout for retry
          setTimeout(() => {
            if (isOpen && !isPaused) {
              fetchLogs();
            }
          }, RETRY_DELAY);
          return;
        }
        
        throw new Error(`Failed to fetch logs: HTTP ${response.status}`);
      }
      
      // Reset retry attempts on success
      setRetryAttempts(0);
      
      const data = await response.json();
      
      // Check if request was aborted after json parsing
      if (pendingRequest.current?.signal.aborted) {
        return;
      }
      
      setConsecutiveErrors(0);
      setShowRetryButton(false);
      
      // Update cursor for next poll if available and different from current
      if (data.newCursor && data.newCursor !== cursor) {
        setCursor(data.newCursor);
      }
      
      // Set watching state
      setIsWatching(true);
      
      // Update the message to indicate we're watching logs (not an error)
      // Only update the message if we don't have logs yet
      if (logs.length === 0) {
        setError(`Watching logs for ${urlObj.hostname.split('.')[0]}...`);
      }
      
      // Filter the logs
      if (data.entries && data.entries.length > 0) {        
        // Convert to our log format
        const formattedLogs: LogEntry[] = data.entries.map((entry: any) => ({
          timestamp: entry.timestamp || Date.now(),
          topic: entry.topic || 'console',
          function: {
            type: entry.udfType,
            path: entry.identifier,
            cached: entry.cachedResult,
            request_id: entry.requestId
          },
          log_level: entry.level || 'INFO',
          message: entry.message || JSON.stringify(entry),
          execution_time_ms: entry.executionTime ? entry.executionTime * 1000 : undefined,
          status: entry.success !== null ? (entry.success ? 'success' : 'error') : undefined,
          error_message: entry.error,
          raw: entry
        }));
        
        // Filter out duplicate logs
        const newLogs = formattedLogs.filter((log: LogEntry) => {
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
          setError(`Watching logs for ${urlObj.hostname.split('.')[0]}...`);
        }
      } else if (logs.length === 0) {
        // If no logs were returned and we don't have any logs yet, update the message
        setError(`Watching logs for ${urlObj.hostname.split('.')[0]}...`);
      }
    } catch (err) {
      // Don't handle aborted requests as errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      if (onError && err instanceof Error) {
        onError(err.message);
      }
      
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setConsecutiveErrors(prev => prev + 1);
      
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
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
  }, [isOpen, isPaused, cursor, logIds, maxStoredLogs, onLogFetch, retryAttempts, getLogId, MAX_RETRY_ATTEMPTS, excludeViewerQueries, convexUrl, accessToken, consecutiveErrors, MAX_CONSECUTIVE_ERRORS, onError, error, isWatching, logs.length]);

  // Fetch logs when the container is initially opened or when convexUrl/accessToken changes
  useEffect(() => {
    if (isOpen && !isPaused && convexUrl && accessToken) {
      // Set initial message
      setError("Waiting for logs...");
      fetchLogs();
    }
  }, [isOpen, isPaused, convexUrl, accessToken, fetchLogs]);

  /**
   * Abort pending requests on unmount
   */
  useEffect(() => {
    return () => {
      if (pendingRequest.current) {
        pendingRequest.current.abort();
      }
    };
  }, []);

  /**
   * Refresh logs when the container is opened
   */
  const refreshLogs = useCallback(() => {
    if (!isPaused && !isPermanentlyDisabled) {
      fetchLogs();
    }
  }, [fetchLogs, isPaused, isPermanentlyDisabled, isOpen]);

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
   * Start resize
   */
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    resizeStartPosition.current = { x: e.clientX, y: e.clientY };
    resizeStartSize.current = { ...containerSize };
    
    // Add event listeners to document for move and up events
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [containerSize]);

  /**
   * Handle resize move with boundary constraints
   */
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
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
   * Constrain container position to stay within viewport
   */
  const constrainPosition = useCallback((pos: { x: number; y: number }) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const containerWidth = containerSize.width;
    const containerHeight = containerSize.height;
    
    // Ensure at least 40px of the container is always visible
    return {
      x: Math.min(Math.max(pos.x, -containerWidth + 40), windowWidth - 40),
      y: Math.min(Math.max(pos.y, -containerHeight + 40), windowHeight - 40)
    };
  }, [containerSize.width, containerSize.height]);

  // Add window resize handler to keep container in bounds when window is resized
  useEffect(() => {
    const handleWindowResize = () => {
      setPosition(prev => constrainPosition(prev));
      
      // Also constrain container size if window gets smaller
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

  // Remove the old event listeners setup since we're now adding/removing them in startResize and handleResizeEnd
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
        <div className="convex-panel-error mb-4">{error}</div>
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

  // Add auto-refresh functionality
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (isOpen && !isPaused && isWatching && !isPermanentlyDisabled) {
      // Refresh logs every 2 seconds when watching
      refreshInterval = setInterval(() => {
        fetchLogs();
      }, 2000);
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isOpen, isPaused, isWatching, isPermanentlyDisabled, fetchLogs]);

  /**
   * Optimized filtering logic
   */
  const filteredLogs = useMemo(() => {
    // Apply all filters: search text, request ID, log type, and success status
    return logs.filter(log => {
      // Filter by log type
      if (logType !== LogType.ALL) {
        // Handle specific log types
        switch (logType) {
          case LogType.HTTP:
            // Filter HTTP actions
            if (log.function?.type !== 'HttpAction') return false;
            break;
          case LogType.SUCCESS:
            // Filter successful logs
            if (log.status !== 'success') return false;
            break;
          case LogType.FAILURE:
            // Filter failed logs
            if (log.status !== 'error') return false;
            break;
          case LogType.DEBUG:
          case LogType.LOGINFO:
          case LogType.WARNING:
          case LogType.ERROR:
            // Filter by log level or topic
            const logLevelLower = log.log_level?.toLowerCase() || '';
            const topicLower = log.topic?.toLowerCase() || '';
            const filterValue = logType.toLowerCase();
            
            // Check if either log level or topic matches the filter
            if (logLevelLower !== filterValue && topicLower !== filterValue) {
              return false;
            }
            break;
          default:
            // For other types (Query, Mutation, Action), check function type
            if (log.function?.type !== logType) return false;
            break;
        }
      }
      
      // Filter by request ID if specified
      if (requestIdFilter && log.function?.request_id !== requestIdFilter) return false;
      
      // Filter by success status if showSuccess is false
      if (!showSuccess && log.status === 'success') return false;
      
      // Filter by search text
      if (debouncedFilterText) {
        const searchText = debouncedFilterText.toLowerCase();
        const searchableText = [
          log.function?.path,
          log.message,
          log.function?.request_id,
          log.error_message
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchText);
      }
      
      return true;
    });
  }, [logs, logType, requestIdFilter, debouncedFilterText, showSuccess]);

  // Handle settings changes
  const handleSettingsChange = useCallback((newSettings: ConvexPanelSettings) => {
    // Update settings state
    setSettings(newSettings);
    
    // Save settings to localStorage
    if (typeof window !== 'undefined') {
      setStorageItem(SETTINGS_STORAGE_KEY, newSettings);
    }
    
    // Force re-render of the current tab content
    const currentTab = activeTab;
    
    // Use requestAnimationFrame to ensure the state change is processed
    // before setting back to the original tab
    requestAnimationFrame(() => {
      setActiveTab('logs');
      setStorageItem(ACTIVE_TAB_STORAGE_KEY, 'logs');
      
      // Use another requestAnimationFrame to switch back to the original tab
      requestAnimationFrame(() => {
        setActiveTab(currentTab);
        setStorageItem(ACTIVE_TAB_STORAGE_KEY, currentTab);
      });
    });
  }, [activeTab]);

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
                  <svg className="w-6" width="100%" height="100%" viewBox="0 0 367 370" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1,0,0,1,-129.225,-127.948)">
                      <g transform="matrix(4.16667,0,0,4.16667,0,0)">
                        <g transform="matrix(1,0,0,1,86.6099,107.074)">
                          <path d="M0,-6.544C13.098,-7.973 25.449,-14.834 32.255,-26.287C29.037,2.033 -2.48,19.936 -28.196,8.94C-30.569,7.925 -32.605,6.254 -34.008,4.088C-39.789,-4.83 -41.69,-16.18 -38.963,-26.48C-31.158,-13.247 -15.3,-5.131 0,-6.544" fill="rgb(245,176,26)" fillRule="nonzero" />
                        </g>
                        <g transform="matrix(1,0,0,1,47.1708,74.7779)">
                          <path d="M0,-2.489C-5.312,9.568 -5.545,23.695 0.971,35.316C-21.946,18.37 -21.692,-17.876 0.689,-34.65C2.754,-36.197 5.219,-37.124 7.797,-37.257C18.41,-37.805 29.19,-33.775 36.747,-26.264C21.384,-26.121 6.427,-16.446 0,-2.489" fill="rgb(141,37,118)" fillRule="nonzero" />
                        </g>
                        <g transform="matrix(1,0,0,1,91.325,66.4152)">
                          <path d="M0,-14.199C-7.749,-24.821 -19.884,-32.044 -33.173,-32.264C-7.482,-43.726 24.112,-25.143 27.557,2.322C27.877,4.876 27.458,7.469 26.305,9.769C21.503,19.345 12.602,26.776 2.203,29.527C9.838,15.64 8.889,-1.328 0,-14.199" fill="rgb(238,52,47)" fillRule="nonzero" />
                        </g>
                      </g>
                    </g>
                  </svg>
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
          <button 
            type="button"
            role="tab"
            aria-selected={activeTab === 'logs'}
            aria-controls="tab-content-logs"
            data-state={activeTab === 'logs' ? 'active' : 'inactive'}
            id="tab-trigger-logs"
            className="convex-panel-tab-button"
            tabIndex={activeTab === 'logs' ? 0 : -1}
            data-orientation="horizontal"
            onClick={() => {
              setActiveTab('logs');
              setStorageItem(ACTIVE_TAB_STORAGE_KEY, 'logs');
            }}
          >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="convex-panel-tab-icon"><path d="M3.89949 5.50002C3.89949 5.27911 3.7204 5.10003 3.49949 5.10003C3.27857 5.10003 3.09949 5.27911 3.09949 5.50002L3.09949 12.5343L1.78233 11.2172C1.62612 11.061 1.37285 11.061 1.21664 11.2172C1.06043 11.3734 1.06043 11.6267 1.21664 11.7829L3.21664 13.7829C3.29166 13.8579 3.3934 13.9 3.49949 13.9C3.60557 13.9 3.70732 13.8579 3.78233 13.7829L5.78233 11.7829C5.93854 11.6267 5.93854 11.3734 5.78233 11.2172C5.62612 11.061 5.37285 11.061 5.21664 11.2172L3.89949 12.5343L3.89949 5.50002ZM8.49998 13C8.22383 13 7.99998 12.7762 7.99998 12.5C7.99998 12.2239 8.22383 12 8.49998 12H14.5C14.7761 12 15 12.2239 15 12.5C15 12.7762 14.7761 13 14.5 13H8.49998ZM8.49998 10C8.22383 10 7.99998 9.77617 7.99998 9.50002C7.99998 9.22388 8.22383 9.00002 8.49998 9.00002H14.5C14.7761 9.00002 15 9.22388 15 9.50002C15 9.77617 14.7761 10 14.5 10H8.49998C8.22383 10 7.99998 9.77617 7.99998 9.50002ZM7.99998 6.50002C7.99998 6.77617 8.22383 7.00002 8.49998 7.00002H14.5C14.7761 7.00002 15 6.77617 15 6.50002C15 6.22388 14.7761 6.00002 14.5 6.00002H8.49998C8.22383 6.00002 7.99998 6.22388 7.99998 6.50002Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            <span>
              <span className="convex-panel-tab-text">Logs</span>
            </span>
          </button>

          <button
            disabled={false}
            type="button"
            role="tab" 
            aria-selected={activeTab === 'data-tables'}
            aria-controls="tab-content-data-tables"
            data-state={activeTab === 'data-tables' ? 'active' : 'inactive'}
            id="tab-trigger-data-tables"
            className="convex-panel-tab-button"
            tabIndex={activeTab === 'data-tables' ? 0 : -1}
            data-orientation="horizontal"
            onClick={() => {
              setActiveTab('data-tables');
              setStorageItem(ACTIVE_TAB_STORAGE_KEY, 'data-tables');
            }}
          >
            <div className="flex items-center gap-1">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="convex-panel-tab-data-icon"><path d="M8 2H12.5C12.7761 2 13 2.22386 13 2.5V5H8V2ZM7 5V2H2.5C2.22386 2 2 2.22386 2 2.5V5H7ZM2 6V9H7V6H2ZM8 6H13V9H8V6ZM8 10H13V12.5C13 12.7761 12.7761 13 12.5 13H8V10ZM2 12.5V10H7V13H2.5C2.22386 13 2 12.7761 2 12.5ZM1 2.5C1 1.67157 1.67157 1 2.5 1H12.5C13.3284 1 14 1.67157 14 2.5V12.5C14 13.3284 13.3284 14 12.5 14H2.5C1.67157 14 1 13.3284 1 12.5V2.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            <span>
              <span className="convex-panel-tab-text">Data</span>
            </span>
            </div>
          </button>

          <button
            disabled={false}
            type="button"
            role="tab" 
            aria-selected={activeTab === 'health'}
            aria-controls="tab-content-health"
            data-state={activeTab === 'health' ? 'active' : 'inactive'}
            id="tab-trigger-health"
            className="convex-panel-tab-button"
            tabIndex={activeTab === 'health' ? 0 : -1}
            data-orientation="horizontal"
            onClick={() => {
              setActiveTab('health');
              setStorageItem(ACTIVE_TAB_STORAGE_KEY, 'health');
            }}
          >
            <div className="flex items-center gap-1">
            <svg className="convex-panel-tab-health-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M9.002 2.5a.75.75 0 01.691.464l6.302 15.305 2.56-6.301a.75.75 0 01.695-.468h4a.75.75 0 010 1.5h-3.495l-3.06 7.532a.75.75 0 01-1.389.004L8.997 5.21l-3.054 7.329A.75.75 0 015.25 13H.75a.75.75 0 010-1.5h4l3.558-8.538a.75.75 0 01.694-.462z"></path></svg>
            <span>
              <span className="convex-panel-tab-text">Health</span>
            </span>
            </div>
          </button>
        </div>
        
        {/* Settings button on the far right */}
        <div className="convex-panel-settings-container">
          <SettingsButton 
            onSettingsChange={handleSettingsChange}
            theme={theme}
          />
        </div>
      </div>
      
      {activeTab === 'logs' && (
        <>
          <LogsToolbar
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
          />
          
          <LogsTable
            mergedTheme={mergedTheme}
            filteredLogs={filteredLogs}
            containerSize={containerSize}
            isDetailPanelOpen={isDetailPanelOpen}
            selectedLog={selectedLog}
            setIsDetailPanelOpen={setIsDetailPanelOpen}
            handleLogSelect={handleLogSelect}
            error={error}
            renderErrorWithRetry={renderErrorWithRetry}
            isPaused={isPaused}
          />
        </>
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

export default Container; 