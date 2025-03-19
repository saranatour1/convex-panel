import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);

  const positionTooltip = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const tooltipWidth = 200; // Approximate width of tooltip
      
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
        maxWidth: '200px',
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

  const handleMouseEnter = () => {
    positionTooltip();
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div 
      ref={triggerRef}
      className={`convex-panel-tooltip ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {showTooltip && createPortal(
        <div 
          className="convex-panel-tooltip-content" 
          style={tooltipStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>,
        document.body
      )}
    </div>
  );
}; 