import LogsTable from "./components/LogsTable";
import LogsToolbar from "./components/LogsToolbar";
import { LogsContainerProps } from "../types";

const LogsContainer = ({
  /** 
   * Theme customization object with merged default and custom styles.
   * Controls visual appearance of logs container components.
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
   * Array of logs after filtering is applied.
   * The actual logs displayed in the table.
   */
  filteredLogs,

  /**
   * Current size of the container element.
   * Controls dimensions of the logs view.
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
   * @param open Whether to show detail panel
   */
  setIsDetailPanelOpen,

  /**
   * Function called when a log is selected.
   * @param log The selected log entry
   */
  handleLogSelect,

  /**
   * Current error state if any.
   * Error object when fetch fails.
   */
  error,

  /**
   * Function to render error with retry option.
   * Displays error message and retry button.
   */
  renderErrorWithRetry,
}: LogsContainerProps) => {
  return (
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
        error={error ? error.message : null}
        renderErrorWithRetry={renderErrorWithRetry}
        isPaused={isPaused}
      />
    </>
  );
};

LogsContainer.displayName = 'LogsContainer';

export default LogsContainer;