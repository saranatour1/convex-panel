import { memo, useRef, useState } from 'react';
import { InfoIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { LogRowProps } from '../../types';

const LogRow = memo(({
  /** 
   * Index of the log row in the virtualized list.
   * Used by react-window for rendering optimization.
   */
  index,

  /**
   * Style object containing positioning for virtualized row.
   * Applied to row container for proper list virtualization.
   * Provided by react-window.
   */
  style,

  /**
   * Data object containing shared props for all rows.
   * Includes logs array, panel state, theme and handlers.
   * Passed through react-window's itemData prop.
   */
  data
}: LogRowProps) => {
  const { logs, isDetailPanelOpen, mergedTheme, handleLogSelect } = data;
  const log = logs[index];
  if (!log) return null;
  
  const iconRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [showTooltip, setShowTooltip] = useState(false);
  
  /**
   * Function to position the tooltip.
   * This is used for logs that have [INFO] in the log message.
   */
  const positionTooltip = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setTooltipStyle({
        position: 'fixed',
        top: rect.top - 10,
        left: rect.left + 20,
        zIndex: 99999,
      });
    }
  };
  
  /**
   * Function to update the tooltip position on hover.
   */
  const handleMouseEnter = () => {
    positionTooltip();
    setShowTooltip(true);
  };

  /**
   * Function to hide the tooltip when the mouse leaves the log row.
   */
  const handleMouseLeave = () => {
    setShowTooltip(false);
  };
  
  /**
   * Format the timestamp of the log.
   */
  const timestamp = new Date(log.timestamp * 1000).toLocaleString();

  /**
   * Format the request ID of the log.
   */
  const requestId = log.function?.request_id || '';

  /**
   * Format the execution time of the log.
   */
  const executionTime = log.execution_time_ms 
    ? log.execution_time_ms < 1 
      ? `${(log.execution_time_ms * 1000).toFixed(2)} μs` 
      : `${log.execution_time_ms.toFixed(2)} ms`
    : '';
  
  /**
   * Determine the log type and format accordingly.
   */
  let logType = '';
  let logDetails = '';
  
  if (log.function?.type === 'HttpAction') {
    // Format HTTP actions
    const identifier = log.function.path || '';
    logType = identifier.startsWith('GET') ? 'GET' : 
              identifier.startsWith('POST') ? 'POST' : 
              identifier.startsWith('PUT') ? 'PUT' : 
              identifier.startsWith('DELETE') ? 'DELETE' : 'H';
    
    // Extract path from identifier
    const path = identifier.split(' ')[1] || identifier;
    logDetails = path;
  } else if (log.function?.type === 'Query') {
    // Format queries
    logType = 'Q';
    logDetails = log.function.path || '';
  } else if (log.function?.type === 'Mutation') {
    // Format mutations
    logType = 'M';
    logDetails = log.function.path || '';
  } else if (log.function?.type === 'Action') {
    // Format actions
    logType = 'A';
    logDetails = log.function.path || '';
  } else {
    // Other log types
    logType = log.topic || '';
    logDetails = log.message || '';
  }

  // Determine status color
  const statusColor = log.status === 'success' ? 'convex-panel-success-text' :
                      log.status === 'error' ? 'convex-panel-error-text' :
                      'convex-panel-gray-text';
  
  // Format cached indicator
  const cachedIndicator = log.function?.cached ? '(cached)' : '';
  
  // Simplified format when detail panel is open
  if (isDetailPanelOpen) {
    // For simplified view, combine type and details for better context
    const isStandardLogType = logType === 'Q' || logType === 'M' || logType === 'A' || logType === 'GET' || logType === 'POST' || logType === 'PUT' || logType === 'DELETE';
    const logTypeDisplay = isStandardLogType ? logType : '';
    const logDetailsDisplay = isStandardLogType ? logDetails : logDetails;
      
    return (
      <div 
        style={style} 
        className={`convex-panel-log-row-simplified ${mergedTheme.tableRow}`}
        onClick={() => handleLogSelect(log)}
      >
        <div className="convex-panel-log-row-content">
          <div className="convex-panel-log-timestamp">{timestamp}</div>
          <div className="convex-panel-log-details">
            <span className="convex-panel-log-type-badge">{logTypeDisplay}</span> {logDetailsDisplay}
          </div>
        </div>
      </div>
    );
  }
  
  // Render tooltip in a portal
  const renderTooltip = () => {
    if (!showTooltip || !log.raw?.logLines?.length) return null;
    
    return createPortal(
      <div 
        className="convex-panel-tooltip-content" 
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {log.raw.logLines.map((line: string, i: number) => (
          <div key={i} className="convex-panel-tooltip-line">{line}</div>
        ))}
      </div>,
      document.body
    );
  };
  
  // Full format when detail panel is closed
  return (
    <div 
      style={style} 
      className={`convex-panel-log-row ${mergedTheme.tableRow}`}
      onClick={() => handleLogSelect(log)}
    >
      <div className="convex-panel-log-row-full-content">
        <div className="convex-panel-log-timestamp">{timestamp}</div>
        <div className="convex-panel-log-request-id">{requestId.substring(0, 8)}</div>
        <div className={`convex-panel-log-status ${statusColor}`}>
          {log.status === 'success' && <span className="convex-panel-success-text">success</span>}
          {!log.status && cachedIndicator && <span className="convex-panel-cached-text">{cachedIndicator}</span>}
        </div>
        <div className="convex-panel-log-execution-time">{executionTime}</div>
        <div className="convex-panel-log-type">{logType}</div>
        <div className="convex-panel-log-details-container">
          <span>{logDetails}</span>
          {log.raw && log.raw.logLines && log.raw.logLines.length > 0 && (
            <div 
              ref={iconRef}
              className="convex-panel-log-info-tooltip" 
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <InfoIcon className="convex-panel-info-icon" />
              {renderTooltip()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

LogRow.displayName = 'LogRow';

export default LogRow; 