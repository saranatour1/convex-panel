

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
    <div className={`flex-1 overflow-hidden flex ${isPaused ? 'opacity-50' : ''}`}>
      <div className={`flex-1 flex flex-col ${isDetailPanelOpen ? 'w-1/2' : 'w-full'}`}>
        {/* Status message (Waiting/Watching) */}
        {/* {shouldShowStatusMessage && (
          <div className="px-4 py-2 bg-neutral-800 text-neutral-300 text-sm border-b border-neutral-700">
            <div className="flex items-center">
              {error.includes("Waiting") ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {error}
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {error}
                </>
              )}
            </div>
          </div>
        )} */}
        
        {/* Show a small indicator when watching logs with logs available */}
        {shouldHideStatusWhenWatching && (
          <div className="px-4 py-1 bg-green-900 bg-opacity-20 text-green-400 text-xs border-b border-green-900 flex items-center">
            <svg className="mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Live
          </div>
        )}
        
        {/* Error message with retry button */}
        {showErrorMessage && renderErrorWithRetry()}
        
        <div className={`px-4 py-2 ${mergedTheme.tableHeader} border-b border-[#333333] sticky top-0 bg-[#1a1a1a] uppercase`}>
          <div className="flex items-center">
            {isDetailPanelOpen ? (
              <>
                <div className="text-xs font-semibold text-gray-400 w-48">Timestamp</div>
                <div className="text-xs font-semibold text-gray-400 flex-1">Details</div>
              </>
            ) : (
              <>
                <div className="text-xs font-semibold text-gray-400 w-48">Timestamp</div>
                <div className="text-xs font-semibold text-gray-400 w-24">ID</div>
                <div className="text-xs font-semibold text-gray-400 w-24">Status</div>
                <div className="text-xs font-semibold text-gray-400 w-24">Time</div>
                <div className="text-xs font-semibold text-gray-400 w-12">Type</div>
                <div className="text-xs font-semibold text-gray-400 flex-1">Details</div>
              </>
            )}
          </div>
        </div>
        
        {/* Empty state when waiting for logs */}
        {filteredLogs.length === 0 && showStatusMessage && (
          <div className="flex-1 flex items-center justify-center bg-[#121212] text-neutral-400">
            <div className="text-center p-8">
              <p>{error.includes("Waiting") ? "Waiting for logs..." : "No logs yet. Watching for new logs..."}</p>
            </div>
          </div>
        )}
        
        {/* Log list */}
        {(filteredLogs.length > 0 || !showStatusMessage) && (
          <div className="flex-1 overflow-hidden">
            <List
              height={containerSize.height - (
                shouldShowStatusMessage ? 190 : 
                shouldHideStatusWhenWatching ? 160 : 
                150
              )}
              itemCount={filteredLogs.length}
              itemSize={isDetailPanelOpen ? 35 : 35}
              width={isDetailPanelOpen ? containerSize.width / 2 : containerSize.width}
              itemData={{ 
                logs: filteredLogs, 
                isDetailPanelOpen,
                mergedTheme,
                handleLogSelect
              }}
              className="bg-[#121212]"
            >
              {LogRow}
            </List>
          </div>
        )}
      </div>
      
      {/* Detail Panel */}
      <AnimatePresence>
        {isDetailPanelOpen && selectedLog && (
          <LogDetailPanel 
            selectedLog={selectedLog} 
            mergedTheme={mergedTheme} 
            setIsDetailPanelOpen={setIsDetailPanelOpen} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LogsTable; 