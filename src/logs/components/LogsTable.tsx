import { AnimatePresence } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import { LogsTableProps, ThemeClasses } from '../../types';
import LogRow from './LogRow';
import LogDetailPanel from './LogDetailPanel';
import { LiveIndicator } from '../../components/LiveIndicator';
import { EmptyState } from '../../components/EmptyState';

const TableHeader = ({ 
  /** Whether the log detail panel is open. Controls visibility of expanded log view. */
  isDetailPanelOpen,
  /** Theme customization object with merged default and custom styles. Controls visual appearance of table components. */
  mergedTheme
}: { 
  isDetailPanelOpen: boolean, 
  mergedTheme: ThemeClasses 
}) => (
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
);

const LogsTable = ({
  /** 
   * Theme customization object with merged default and custom styles.
   * Controls visual appearance of logs table components.
   */
  mergedTheme,

  /**
   * Array of logs after filtering is applied.
   * The actual logs displayed in the table.
   */
  filteredLogs,

  /**
   * Current size of the container element.
   * Controls dimensions of the logs table.
   */
  containerSize,

  /**
   * Whether the log detail panel is open.
   * Controls visibility of expanded log view.
   */
  isDetailPanelOpen,

  /**
   * Currently selected log entry.
   * Log displayed in detail panel when open.
   */
  selectedLog,

  /**
   * Function to toggle detail panel visibility.
   * @param isOpen Whether to show detail panel
   */
  setIsDetailPanelOpen,

  /**
   * Function called when a log is selected.
   * @param log The selected log entry
   */
  handleLogSelect,

  /**
   * Current error message if any.
   * Error string when fetch fails.
   */
  error,

  /**
   * Function to render error with retry option.
   * Displays error message and retry button.
   */
  renderErrorWithRetry,

  /**
   * Whether log streaming is currently paused.
   * Controls if new logs are being fetched and displayed.
   */
  isPaused,

  /**
   * Function called when mouse enters a log row
   * @param logId ID of the log being hovered
   * @param event Mouse event
   */
  onLogRowMouseEnter,
  
  /**
   * Function called when mouse leaves a log row
   */
  onLogRowMouseLeave
}: LogsTableProps) => {
  /**
   * Whether the user is waiting for logs to appear.
   */
  const isWaitingForLogs = error?.includes("Waiting for logs");
  const isWatchingLogs = error?.includes("Watching for logs");
  const hasStatusMessage = error && (isWaitingForLogs || isWatchingLogs);
  const shouldShowError = error && !hasStatusMessage;
  
  const showStatusMessage = hasStatusMessage && (
    filteredLogs.length === 0 || 
    isWaitingForLogs || 
    isWatchingLogs
  );
  
  const showLiveIndicator = hasStatusMessage && 
    filteredLogs.length > 0 && 
    error.includes("Watching logs");

  const getListHeight = () => {
    // Calculate the height of the table header and any status messages
    const headerHeight = 40; // Height of the table header
    const statusMessageHeight = showStatusMessage ? 40 : 0;
    const liveIndicatorHeight = showLiveIndicator ? 30 : 0;
    
    // Subtract these heights from the container height
    return containerSize.height - headerHeight - statusMessageHeight - liveIndicatorHeight;
  };

  return (
    <div className={`convex-panel-logs-container`} style={{ height: containerSize.height }}>
      <div className={`convex-panel-logs-main ${isDetailPanelOpen ? 'convex-panel-logs-with-detail' : 'convex-panel-logs-full'}`}>
        {showLiveIndicator && <LiveIndicator />}
        {shouldShowError && renderErrorWithRetry()}
        
        <TableHeader isDetailPanelOpen={isDetailPanelOpen} mergedTheme={mergedTheme} />
        
        {filteredLogs.length === 0 && hasStatusMessage && (
          <EmptyState 
            message={isWaitingForLogs ? "Waiting for logs..." : "No logs yet. Watching for new logs..."} 
          />
        )}
        
        {(filteredLogs.length > 0 || !hasStatusMessage) && (
          <div className="convex-panel-logs-list-container">
            <List
              height={getListHeight()}
              itemCount={filteredLogs.length}
              itemSize={35}
              width={isDetailPanelOpen ? (containerSize.width / 2) - 10 : containerSize.width - 10}
              itemData={{ 
                logs: filteredLogs, 
                isDetailPanelOpen,
                mergedTheme,
                handleLogSelect,
                onLogRowMouseEnter,
                onLogRowMouseLeave
              }}
              className="convex-panel-logs-list"
            >
              {LogRow}
            </List>
          </div>
        )}
      </div>
      
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

LogsTable.displayName = 'LogsTable';

export default LogsTable; 