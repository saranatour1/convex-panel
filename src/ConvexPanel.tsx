import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { AnimatePresence, useDragControls } from 'framer-motion';
import { motion } from 'framer-motion';
import { ButtonProps } from './types';
import { LogType } from './logs/types';
import { defaultTheme, buttonVariants } from './theme';
import Container from './Container';
import { ConvexReactClient } from 'convex/react';
import { ConvexClient } from 'convex/browser';
// CSS is injected directly in the component

const ConvexPanel = ({
  children,
  initialLimit = 100,
  initialShowSuccess = true,
  initialLogType = LogType.ALL,
  onLogFetch,
  onError,
  onToggle,
  theme = {},
  buttonIcon = "/convex.png",
  maxStoredLogs = 500,
  convex,
  deployKey,
  cloudUrl,
}: ButtonProps) => {
  const mergedTheme = useMemo(() => ({ ...defaultTheme, ...theme }), [theme]);
  const [isMounted, setIsMounted] = useState(false);
  const [logoSrc, setLogoSrc] = useState<string>(buttonIcon);
  const [logoError, setLogoError] = useState(false);

  // Only create adminClient if we have a URL and deployKey
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || cloudUrl;
  const adminClient = convexUrl && deployKey ? new ConvexClient(convexUrl) : null;
  
  // Only set admin auth if we have an adminClient and deployKey
  if (adminClient && deployKey) {
    (adminClient as any).setAdminAuth(deployKey);
  }
  
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 500 });
  const dragControls = useDragControls();

  // Only render on client-side to avoid hydration errors
  useEffect(() => {
    setIsMounted(true);
    
    // Inject CSS into the document head
    const styleId = 'convex-panel-styles';
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.innerHTML = `
        /* Base styles for Convex Panel */
        .convex-panel-container {
          position: fixed !important;
          bottom: 20px !important;
          right: 12px !important;
          z-index: 50 !important;
          display: flex !important;
          align-items: flex-end !important;
        }
        
        .convex-panel-button {
          border-radius: 9999px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          background-color: #2a2825 !important;
          width: 36px !important;
          height: 36px !important;
        }
        
        .convex-panel-logo {
          width: 36px !important;
          height: 36px !important;
          border-radius: 9999px !important;
          overflow: hidden !important;
          object-fit: contain !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        .convex-panel-card {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          background-color: #1e1e1e !important;
          border-radius: 0.75rem !important;
          border: 1px solid #333 !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
          height: calc(100vh - var(--header-height, 64px) - 3rem) !important;
          max-height: 40rem !important;
          padding: 0.5rem !important;
          position: relative !important;
          margin-right: 1rem !important;
        }
        
        .convex-panel-header-container {
          border-radius: 0.5rem !important;
        }
        
        .convex-panel-header {
          border-radius: 0.375rem 0.375rem 0 0 !important;
          padding: 0 0.75rem !important;
          height: 2rem !important;
          flex-shrink: 0 !important;
          display: flex !important;
          width: 100% !important;
          position: relative !important;
          border-bottom: 1px solid #444 !important;
          background-color: #38383A !important;
          user-select: none !important;
        }
        
        .convex-panel-tabs {
          display: flex !important;
          width: 100% !important;
          user-select: none !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 0.25rem !important;
          border-bottom: 1px solid #444 !important;
          background-color: #141414 !important;
          font-size: 0.75rem !important;
        }
        
        .convex-panel-tab {
          padding: 0 0.75rem !important;
          height: 2.25rem !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.25rem !important;
          border-bottom: 4px solid transparent !important;
          color: #fff !important;
        }
        
        .convex-panel-tab[data-state="active"] {
          border-bottom-color: rgb(141, 38, 118) !important;
          background-color: rgba(141, 38, 118, 0.5) !important;
        }
        
        .convex-panel-tab[data-state="inactive"] {
          background-color: #141414 !important;
        }
        
        .convex-panel-content {
          flex: 1 !important;
          overflow: auto !important;
        }
        
        .convex-panel-table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        
        .convex-panel-table th {
          background-color: #2a2a2a !important;
          padding: 0.5rem !important;
          text-align: left !important;
          font-weight: 500 !important;
          border-bottom: 1px solid #444 !important;
        }
        
        .convex-panel-table td {
          padding: 0.5rem !important;
          border-bottom: 1px solid #333 !important;
        }
        
        .convex-panel-table tr:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        
        /* Toolbar styles */
        .convex-panel-toolbar {
          display: flex !important;
          align-items: center !important;
          padding: 0.5rem !important;
          gap: 0.5rem !important;
          border-bottom: 1px solid #444 !important;
          background-color: #1a1a1a !important;
        }
        
        .convex-panel-input {
          background-color: #2a2a2a !important;
          border: 1px solid #444 !important;
          border-radius: 0.25rem !important;
          padding: 0.25rem 0.5rem !important;
          color: #fff !important;
          font-size: 0.875rem !important;
        }
        
        .convex-panel-button-sm {
          background-color: #3f5295 !important;
          border-radius: 0.25rem !important;
          padding: 0.25rem 0.5rem !important;
          color: white !important;
          cursor: pointer !important;
        }
        
        .convex-panel-button-sm:hover {
          background-color: rgba(63, 82, 149, 0.6) !important;
        }
        
        /* Window controls */
        .convex-panel-window-control {
          width: 10px !important;
          height: 10px !important;
          border-radius: 50% !important;
          cursor: pointer !important;
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .convex-panel-close {
          background-color: #FF5F57 !important;
        }
        
        .convex-panel-close:hover {
          background-color: #b33e3a !important;
        }
        
        .convex-panel-minimize {
          background-color: #FFBD2E !important;
        }
        
        .convex-panel-minimize:hover {
          background-color: #b38420 !important;
        }
        
        .convex-panel-maximize {
          background-color: #28C840 !important;
        }
        
        .convex-panel-maximize:hover {
          background-color: #1a8f2a !important;
        }
        
        /* Success/Error states */
        .convex-panel-success {
          color: #4caf50 !important;
        }
        
        .convex-panel-error {
          color: #f44336 !important;
        }
        
        .convex-panel-warning {
          color: #ff9800 !important;
        }
        
        /* Container component specific styles */
        .convex-panel-header-content {
          padding-left: 3.5rem !important;
          padding-right: 3.5rem !important;
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          position: relative !important;
        }
        
        .convex-panel-window-controls {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.375rem !important;
        }
        
        .convex-panel-window-control-icon {
          position: absolute !important;
          opacity: 0 !important;
          font-size: 8px !important;
          font-weight: 700 !important;
        }
        
        .convex-panel-window-control-icon:hover {
          opacity: 1 !important;
        }
        
        .convex-panel-close-icon {
          color: #4a1917 !important;
        }
        
        .convex-panel-minimize-icon {
          color: #4a3917 !important;
        }
        
        .convex-panel-maximize-icon {
          color: #1a4a1e !important;
        }
        
        .convex-panel-url-container {
          display: flex !important;
          align-items: center !important;
          border: 1px solid #27272a !important;
          font-size: 0.75rem !important;
          color: #a1a1aa !important;
          text-align: center !important;
          border-radius: 0.125rem !important;
          background-color: #18181b !important;
          width: 100% !important;
          max-width: 18rem !important;
          padding-top: 0.125rem !important;
          padding-bottom: 0.125rem !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          cursor: pointer !important;
        }
        
        .convex-panel-url-icon {
          display: inline-block !important;
          width: 0.75rem !important;
          height: 0.75rem !important;
        }
        
        .convex-panel-url-text {
          flex-grow: 1 !important;
          min-width: 0 !important;
          text-align: center !important;
        }
        
        /* Tab styles */
        .convex-panel-tab-list {
          display: flex !important;
          overflow-x: auto !important;
          cursor: pointer !important;
          outline: none !important;
        }
        
        .convex-panel-tab-button {
          padding-left: 0.75rem !important;
          padding-right: 0.75rem !important;
          height: 2.25rem !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.25rem !important;
          border-bottom: 4px solid transparent !important;
        }
        
        .convex-panel-tab-button[data-state="inactive"] {
          background-color: #141414 !important;
        }
        
        .convex-panel-tab-button[data-state="active"] {
          border-bottom-color: rgb(141, 38, 118) !important;
          background-color: rgba(141, 38, 118, 0.5) !important;
        }
        
        .convex-panel-tab-icon {
          width: 1.125rem !important;
          height: 1.125rem !important;
          flex-shrink: 0 !important;
          color: #a1a1aa !important;
          margin-top: -4px !important;
        }
        
        .convex-panel-tab-data-icon {
          width: 0.75rem !important;
          height: 0.75rem !important;
          flex-shrink: 0 !important;
          color: #a1a1aa !important;
        }
        
        .convex-panel-tab-health-icon {
          width: 1.125rem !important;
          height: 1.125rem !important;
          flex-shrink: 0 !important;
          color: #a1a1aa !important;
        }
        
        .convex-panel-tab-text {
          color: #f5f5f5 !important;
        }
        
        .convex-panel-settings-container {
          padding-right: 0.5rem !important;
        }
        
        /* Additional utility classes */
        .flex {
          display: flex !important;
        }
        
        .flex-col {
          display: flex !important;
          flex-direction: column !important;
        }
        
        .items-center {
          align-items: center !important;
        }
        
        .justify-center {
          justify-content: center !important;
        }
        
        .gap-1 {
          gap: 0.25rem !important;
        }
        
        .gap-2 {
          gap: 0.5rem !important;
        }
        
        .h-full {
          height: 100% !important;
        }
        
        .p-4 {
          padding: 1rem !important;
        }
        
        .mb-4 {
          margin-bottom: 1rem !important;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .convex-panel-card {
            width: calc(100vw - 2rem) !important;
            height: calc(100vh - 6rem) !important;
          }
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    // Cleanup function to remove the style when component unmounts
    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // Handle image error by using a fallback URL
  const handleImageError = () => {
    // If the image fails to load, use the Convex logo SVG as fallback
    setLogoError(true);
    // Use the Convex logo SVG as fallback
    setLogoSrc("data:image/svg+xml,%3Csvg width='36' height='36' viewBox='0 0 367 370' version='1.1' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform='matrix(1,0,0,1,-129.225,-127.948)'%3E%3Cg transform='matrix(4.16667,0,0,4.16667,0,0)'%3E%3Cg transform='matrix(1,0,0,1,86.6099,107.074)'%3E%3Cpath d='M0,-6.544C13.098,-7.973 25.449,-14.834 32.255,-26.287C29.037,2.033 -2.48,19.936 -28.196,8.94C-30.569,7.925 -32.605,6.254 -34.008,4.088C-39.789,-4.83 -41.69,-16.18 -38.963,-26.48C-31.158,-13.247 -15.3,-5.131 0,-6.544' fill='rgb(245,176,26)' fill-rule='nonzero'%3E%3C/path%3E%3C/g%3E%3Cg transform='matrix(1,0,0,1,47.1708,74.7779)'%3E%3Cpath d='M0,-2.489C-5.312,9.568 -5.545,23.695 0.971,35.316C-21.946,18.37 -21.692,-17.876 0.689,-34.65C2.754,-36.197 5.219,-37.124 7.797,-37.257C18.41,-37.805 29.19,-33.775 36.747,-26.264C21.384,-26.121 6.427,-16.446 0,-2.489' fill='rgb(141,37,118)' fill-rule='nonzero'%3E%3C/path%3E%3C/g%3E%3Cg transform='matrix(1,0,0,1,91.325,66.4152)'%3E%3Cpath d='M0,-14.199C-7.749,-24.821 -19.884,-32.044 -33.173,-32.264C-7.482,-43.726 24.112,-25.143 27.557,2.322C27.877,4.876 27.458,7.469 26.305,9.769C21.503,19.345 12.602,26.776 2.203,29.527C9.838,15.64 8.889,-1.328 0,-14.199' fill='rgb(238,52,47)' fill-rule='nonzero'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  };

  /**
   * Load saved position and container size from localStorage on component mount
   */
  useEffect(() => {
    if (!isMounted) return;
    
    const savedPosition = localStorage.getItem('convex-panel:position');
    const savedSize = localStorage.getItem('convex-panel:size');
    
    if (savedPosition) {
      try {
        setPosition(JSON.parse(savedPosition));
      } catch (e) {
        console.error('Failed to parse saved position', e);
      }
    }
    
    if (savedSize) {
      try {
        setContainerSize(JSON.parse(savedSize));
      } catch (e) {
        console.error('Failed to parse saved size', e);
      }
    }
  }, [isMounted]);

  /**
   * Save position and container size to localStorage when they change
   */
  useEffect(() => {
    if (!isMounted) return;
    
    localStorage.setItem('convex-panel:position', JSON.stringify(position));
    localStorage.setItem('convex-panel:size', JSON.stringify(containerSize));
  }, [position, containerSize, isMounted]);

  /**
   * Toggle the open state of the container
   */
  const toggleOpen = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // Call the onToggle callback if provided
    if (onToggle) {
      onToggle(newIsOpen);
    }
  };

  // Don't render anything on the server
  if (!isMounted) {
    return null;
  }

  return (
    <div className="convex-panel-container">
      <AnimatePresence>
        {isOpen && (
          <Container
            convex={convex as ConvexReactClient}
            isOpen={isOpen}
            toggleOpen={toggleOpen}
            onToggle={onToggle}
            initialLimit={initialLimit}
            initialShowSuccess={initialShowSuccess}
            initialLogType={initialLogType}
            onLogFetch={onLogFetch}
            onError={onError}
            theme={mergedTheme}
            maxStoredLogs={maxStoredLogs}
            position={position}
            setPosition={setPosition}
            containerSize={containerSize}
            setContainerSize={setContainerSize}
            dragControls={dragControls}
            adminClient={adminClient}
          />
        )}
      </AnimatePresence>
      
      <motion.button
        className="convex-panel-button"
        onClick={toggleOpen}
        variants={buttonVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        animate={isOpen ? { rotate: 180 } : { rotate: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Image 
          src={logoSrc}
          alt="Convex Logo" 
          width={36} 
          height={36} 
          className="convex-panel-logo rounded-full"
          unoptimized={true}
          onError={handleImageError}
          style={{ width: '36px', height: '36px' }}
        />
      </motion.button>
    </div>
  );
};

export default ConvexPanel; 