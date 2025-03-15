import { memo, useRef, useState, useEffect } from 'react';
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
  const { 
    logs, 
    isDetailPanelOpen, 
    mergedTheme, 
    handleLogSelect, 
    onLogRowMouseEnter, 
    onLogRowMouseLeave 
  } = data;
  const log = logs[index];
  if (!log) return null;
  
  const iconRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [showTooltip, setShowTooltip] = useState(false);

  /**
   * Function to position the tooltip.
   * This is used for logs that have additional information to display.
   */
  const positionTooltip = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      
      // Calculate position to avoid going off-screen
      const windowWidth = window.innerWidth;
      const tooltipWidth = 300; // Approximate width of tooltip
      
      // Position tooltip to the right of the icon by default
      let left = rect.right + 10;
      
      // If tooltip would go off the right edge, position it to the left of the icon
      if (left + tooltipWidth > windowWidth - 20) {
        left = rect.left - tooltipWidth - 10;
      }
      
      setTooltipStyle({
        position: 'fixed',
        top: rect.top - 5,
        left: left,
        zIndex: 99999,
        maxWidth: '300px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        fontSize: '12px',
        lineHeight: '1.4',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        pointerEvents: 'auto'
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
   * Function to hide the tooltip when the mouse leaves.
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
  
  if (log.function?.type) {
    // Use the type directly from the log data (Q, M, A, H)
    logType = log.function.type;
    
    // For details, check if we have a raw.details field first (for mock data)
    if (log.raw?.details) {
      logDetails = log.raw.details;
    } else {
      // Otherwise just use the function path without appending the type
      logDetails = log.function.path || '';
    }
  } else {
    // Other log types
    logType = log.topic || '';
    logDetails = log.message || '';
  }

  // Determine if this is an error log
  const isError = 
    // Check explicit status values
    log.status === 'error' || 
    log.status === 'failure' ||
    // Check for error message
    !!log.error_message ||
    // Check for error in raw data
    (log.raw && (
      // Check for error object in raw data
      !!log.raw.error ||
      // Check for failure in raw data
      log.raw.failure === true ||
      // Check for success being false
      log.raw.success === false
    ));
  
  // Determine status color
  const statusColor = log.status === 'success' ? 'convex-panel-success-text' :
                     log.status === 'error' || log.status === 'failure' || isError ? 'convex-panel-error-text' :
                     'convex-panel-gray-text';
  
  // Format cached indicator
  const cachedIndicator = log.function?.cached ? '(cached)' : '';
  
  // Create a class for the row background based on status
  const rowBackgroundClass = isError ? 'convex-panel-error-background' : '';
  
  // Get a unique ID for the log - use function request_id, timestamp + index, or just index
  const logId = log.function?.request_id || 
                `${log.timestamp}-${index}` || 
                index.toString();
  
  // Simplified format when detail panel is open
  if (isDetailPanelOpen) {
    // For simplified view, combine type and details for better context
    const isStandardLogType = logType === 'Q' || logType === 'M' || logType === 'A' || logType === 'GET' || logType === 'POST' || logType === 'PUT' || logType === 'DELETE';
    const logTypeDisplay = isStandardLogType ? logType : '';
    
    // Truncate the details when detail panel is open
    // This will show just the function name without the full path
    let logDetailsDisplay = '';
    if (isStandardLogType && logDetails) {
      // For function paths, extract just the function name
      const parts = logDetails.split(':');
      if (parts.length > 1) {
        // If it has a module:function format, just show the function name
        logDetailsDisplay = parts[1];
      } else if (logDetails.includes('/')) {
        // If it's a path, show just the last part
        const pathParts = logDetails.split('/');
        logDetailsDisplay = pathParts[pathParts.length - 1];
      } else {
        // Otherwise show the whole thing if it's short, or truncate
        logDetailsDisplay = logDetails.length > 20 ? logDetails.substring(0, 20) + '...' : logDetails;
      }
    } else {
      // For non-standard logs, truncate if too long
      logDetailsDisplay = logDetails.length > 20 ? logDetails.substring(0, 20) + '...' : logDetails;
    }
      
    return (
      <div 
        style={style} 
        className={`convex-panel-log-row-simplified ${mergedTheme.tableRow} ${rowBackgroundClass}`}
        onClick={() => handleLogSelect(log)}
        data-log-id={logId}
      >
        <div className="convex-panel-log-row-content">
          <div className="convex-panel-log-timestamp">{timestamp}</div>
          <div className="convex-panel-log-details convex-panel-log-details-truncated">
            <span className="convex-panel-log-type-badge">{logTypeDisplay}</span> {logDetailsDisplay}
          </div>
        </div>
      </div>
    );
  }
  
  // Extract tooltip content from log data
  const getTooltipContent = () => {
    // Check for logLines in raw data
    if (log.raw?.logLines?.length) {
      return log.raw.logLines;
    }
    
    // Check for [LOG] message in details
    if (typeof logDetails === 'string' && logDetails.includes('[LOG]')) {
      const match = logDetails.match(/\[LOG\](.*)/);
      if (match && match[1]) {
        return [match[1].trim()];
      }
    }
    
    // Check for any additional info in the log
    if (log.message && log.message !== logDetails) {
      return [log.message];
    }
    
    // Fallback to showing raw data as JSON
    if (log.raw) {
      try {
        return [JSON.stringify(log.raw, null, 2)];
      } catch (e) {
        return ['[Could not parse log data]'];
      }
    }
    
    return ['No additional information available'];
  };
  
  // Render tooltip in a portal
  const renderTooltip = () => {
    if (!showTooltip) return null;
    
    const tooltipContent = getTooltipContent();
    
    return createPortal(
      <div 
        className="convex-panel-tooltip-content" 
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {tooltipContent.map((line: string, i: number) => (
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
      className={`convex-panel-log-row ${mergedTheme.tableRow} ${rowBackgroundClass}`}
      onClick={() => handleLogSelect(log)}
      onMouseEnter={(e) => onLogRowMouseEnter && onLogRowMouseEnter(logId, e)}
      onMouseLeave={onLogRowMouseLeave}
      data-log-id={logId}
    >
      <div className="convex-panel-log-row-full-content">
        <div className="convex-panel-log-timestamp">{timestamp}</div>
        <div className="convex-panel-log-request-id">{requestId ? requestId.substring(0, 8) : '-'}</div>
        <div className={`convex-panel-log-status ${statusColor}`}>
          {log.status === 'success' && <span className="convex-panel-success-text">success</span>}
          {(log.status === 'error' || log.status === 'failure') && 
            <span className="convex-panel-error-text">
              {log.status === 'failure' ? 'failure' : 'error'}
            </span>
          }
          {!log.status && isError && <span className="convex-panel-error-text">failure</span>}
          {!log.status && !isError && cachedIndicator && <span className="convex-panel-cached-text">{cachedIndicator}</span>}
          {!log.status && !isError && !cachedIndicator && <span className="convex-panel-gray-text">-</span>}
        </div>
        <div className="convex-panel-log-execution-time">{executionTime || '-'}</div>
        <div className="convex-panel-log-type">{logType || '-'}</div>
        <div className="convex-panel-log-details-container">
          <span className="convex-panel-log-details-text">{logDetails || '-'}</span>
          {(log.raw?.logLines?.length > 0 || logDetails.includes('[LOG]')) && (
            <div 
              ref={iconRef}
              className="convex-panel-log-info-tooltip" 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <InfoIcon size={16} />
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