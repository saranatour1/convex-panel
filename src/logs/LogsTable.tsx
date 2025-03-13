import React, { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import { ThemeClasses } from '../types';
import { LogEntry } from './types';
import LogRow from './LogRow';
import LogDetailPanel from './LogDetailPanel';

interface LogsTableProps {
  mergedTheme: ThemeClasses;
  filteredLogs: LogEntry[];
  containerSize: { width: number; height: number };
  isDetailPanelOpen: boolean;
  selectedLog: LogEntry | null;
  setIsDetailPanelOpen: (isOpen: boolean) => void;
  handleLogSelect: (log: LogEntry) => void;
  error: string | null;
  renderErrorWithRetry: () => React.ReactNode;
  isPaused: boolean;
}

const LogsTable = ({
  mergedTheme,
  filteredLogs,
  containerSize,
  isDetailPanelOpen,
  selectedLog,
  setIsDetailPanelOpen,
  handleLogSelect,
  error,
  renderErrorWithRetry,
  isPaused
}: LogsTableProps) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Determine if we should show the status message
  // based on "waiting for logs" or "watching for logs"
  const showStatusMessage = error && (
    error.includes("Waiting for logs") || 
    error.includes("Watching for logs")
  );

  // Determine if we should show the error message
  const showErrorMessage = error && !showStatusMessage;
  
  // Only show status message if there are no logs or we're waiting for logs
  const shouldShowStatusMessage = showStatusMessage && 
    (filteredLogs.length === 0 || error.includes("Waiting for logs" ) || error.includes("Watching for logs"));
  
  // If we have logs and are watching, don't show the status message
  const shouldHideStatusWhenWatching = showStatusMessage && 
    filteredLogs.length > 0 && 
    error.includes("Watching logs");

  return (
    <div className={`convex-panel-logs-container ${isPaused ? 'convex-panel-logs-paused' : ''}`}>
      <div className={`convex-panel-logs-main ${isDetailPanelOpen ? 'convex-panel-logs-with-detail' : 'convex-panel-logs-full'}`}>
        {/* Show a small indicator when watching logs with logs available */}
        {shouldHideStatusWhenWatching && (
          <div className="convex-panel-live-indicator">
            <svg className="convex-panel-live-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Live
          </div>
        )}
        
        {/* Error message with retry button */}
        {showErrorMessage && renderErrorWithRetry()}
        
        <div className={`convex-panel-table-header ${mergedTheme.tableHeader}`}>
          <div className="convex-panel-header-row">
            {isDetailPanelOpen ? (
              <>
                <div className="convex-panel-header-timestamp">Timestamp</div>
                <div className="convex-panel-header-details">Details</div>
              </>
            ) : (
              <>
                <div className="convex-panel-header-timestamp">Timestamp</div>
                <div className="convex-panel-header-id">ID</div>
                <div className="convex-panel-header-status">Status</div>
                <div className="convex-panel-header-time">Time</div>
                <div className="convex-panel-header-type">Type</div>
                <div className="convex-panel-header-details">Details</div>
              </>
            )}
          </div>
        </div>
        
        {/* Empty state when waiting for logs */}
        {filteredLogs.length === 0 && showStatusMessage && (
          <div className="convex-panel-empty-logs">
            <div className="convex-panel-empty-message">
              <p>{error.includes("Waiting") ? "Waiting for logs..." : "No logs yet. Watching for new logs..."}</p>
            </div>
          </div>
        )}
        
        {/* Log list */}
        {(filteredLogs.length > 0 || !showStatusMessage) && (
          <div className="convex-panel-logs-list-container">
            <List
              height={containerSize.height - (
                shouldShowStatusMessage ? 40 : 
                shouldHideStatusWhenWatching ? 30 : 
                20
              )}
              itemCount={filteredLogs.length}
              itemSize={isDetailPanelOpen ? 35 : 35}
              width={isDetailPanelOpen ? containerSize.width / 2 - 10 : containerSize.width}
              itemData={{ 
                logs: filteredLogs, 
                isDetailPanelOpen,
                mergedTheme,
                handleLogSelect
              }}
              className="convex-panel-logs-list"
            >
              {LogRow}
            </List>
          </div>
        )}
      </div>
      
      {/* Detail Panel */}
      {isDetailPanelOpen && selectedLog && (
        <AnimatePresence>
          <LogDetailPanel 
            selectedLog={selectedLog} 
            mergedTheme={mergedTheme} 
            setIsDetailPanelOpen={setIsDetailPanelOpen} 
          />
        </AnimatePresence>
      )}
    </div>
  );
};

export default LogsTable; 