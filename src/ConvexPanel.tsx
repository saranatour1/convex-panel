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
import cssText from './styles/convex-panel.css';

// Function to inject CSS with a unique ID to avoid conflicts
const injectStyles = () => {
  // Check if the style element already exists
  const styleId = 'convex-panel-styles';
  if (document.getElementById(styleId)) {
    return; // Already injected
  }

  // Create a new style element
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = cssText;
  
  // Append to head
  document.head.appendChild(styleElement);
};

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
    
    // Inject styles when component mounts
    if (typeof window !== 'undefined') {
      injectStyles();
    }
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