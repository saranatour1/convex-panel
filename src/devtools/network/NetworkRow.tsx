import { memo, useRef, useState, useEffect } from 'react';
import { InfoIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { NetworkRowProps } from '../../types';

const NetworkRow = memo(({
  /** 
   * Index of the row in the virtualized list.
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
   * Includes calls array, panel state, theme and handlers.
   * Passed through react-window's itemData prop.
   */
  data
}: NetworkRowProps) => {
  const { 
    calls, 
    isDetailPanelOpen, 
    mergedTheme, 
    handleCallSelect, 
    onRowMouseEnter, 
    onRowMouseLeave 
  } = data;
  const call = calls[index];
  if (!call) return null;
  
  const iconRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [showTooltip, setShowTooltip] = useState(false);

  /**
   * Function to position the tooltip.
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
   * Format the timestamp of the call.
   */
  const formattedTimestamp = new Date(call.timestamp).toLocaleString();

  /**
   * Get the URI path from the URL
   */
  const urlPath = (() => {
    try {
      return new URL(call.url, window.location.origin).pathname;
    } catch (e) {
      return call.url;
    }
  })();

  /**
   * Determine status color
   */
  const getStatusClass = (status: number): string => {
    if (status >= 200 && status < 300) {
      return 'convex-panel-success-text';
    } else if (status >= 400) {
      return 'convex-panel-error-text';
    } else if (status >= 300) {
      return 'convex-panel-warning-text';
    } else {
      return 'convex-panel-gray-text';
    }
  };
  
  const statusClass = getStatusClass(call.status);
  
  // Create a class for the row background based on status
  const rowBackgroundClass = call.isError ? 'convex-panel-error-background' : '';
  
  // Simplified format when detail panel is open
  if (isDetailPanelOpen) {
    return (
      <div 
        style={style} 
        className={`convex-panel-log-row-simplified ${mergedTheme.tableRow} ${rowBackgroundClass}`}
        onClick={() => handleCallSelect(call)}
        data-call-id={call.id}
      >
        <div className="convex-panel-log-network-row-content">
          <div className="convex-panel-log-network-name">
            <span className="convex-panel-log-network-method">{call.method}</span> {urlPath}
          </div>
          <div className="convex-panel-log-details convex-panel-log-details-truncated">
            <span className={`convex-panel-log-network-status ${statusClass}`}>
              {call.status} {call.statusText}
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  // Render tooltip in a portal
  const renderTooltip = () => {
    if (!showTooltip) return null;
    
    const headers = Object.entries(call.request.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    return createPortal(
      <div 
        className="convex-panel-tooltip-content" 
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="convex-panel-tooltip-line">URL: {call.url}</div>
        <div className="convex-panel-tooltip-line">Method: {call.method}</div>
        <div className="convex-panel-tooltip-line">Status: {call.status} {call.statusText}</div>
        <div className="convex-panel-tooltip-line">Headers:</div>
        {headers.split('\n').map((line, i) => (
          <div key={i} className="convex-panel-tooltip-line">  {line}</div>
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
      onClick={() => handleCallSelect(call)}
      onMouseEnter={(e) => onRowMouseEnter && onRowMouseEnter(call.id, e)}
      onMouseLeave={onRowMouseLeave}
      data-call-id={call.id}
    >
      <div className="convex-panel-log-row-full-content">
        <div className="convex-panel-log-network-name">
          <span className="convex-panel-log-network-method">{call.method}</span> {urlPath}
        </div>
        <div className={`convex-panel-log-network-status ${statusClass}`}>
          {call.status} {call.statusText}
        </div>
        <div className="convex-panel-log-network-type">{call.type}</div>
        <div className="convex-panel-log-network-size">{call.size}</div>
        <div className="convex-panel-log-network-time">{call.time}ms</div>
        <div className="convex-panel-log-details-container">
          <span className="convex-panel-log-details-text">{call.time}ms</span>
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
        </div>
      </div>
    </div>
  );
});

NetworkRow.displayName = 'NetworkRow';

export default NetworkRow; 