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
import { getStorageItem } from './data';

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
  maxStoredLogs = 500,
  convex,
  accessToken,
  deployKey,
}: ButtonProps) => {
  const mergedTheme = useMemo(() => ({ ...defaultTheme, ...theme }), [theme]);
  const [isMounted, setIsMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Only create adminClient if we have a URL and deployKey
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
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
    
    // If we're opening the container, load the saved tab
    if (newIsOpen && typeof window !== 'undefined') {
      const savedTab = getStorageItem<'logs' | 'data-tables' | 'health'>('convex-panel:activeTab', 'logs');
      // We'll pass this as a prop to Container
      setInitialTab(savedTab);
    }
    
    // Call the onToggle callback if provided
    if (onToggle) {
      onToggle(newIsOpen);
    }
  };

  // Add state for initial tab
  const [initialTab, setInitialTab] = useState<'logs' | 'data-tables' | 'health'>('logs');

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
            initialActiveTab={initialTab}
            accessToken={accessToken}
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
        <svg width="36" height="36" viewBox="0 0 184 188" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M108.092 130.021C126.258 128.003 143.385 118.323 152.815 102.167C148.349 142.128 104.653 167.385 68.9858 151.878C65.6992 150.453 62.8702 148.082 60.9288 145.034C52.9134 132.448 50.2786 116.433 54.0644 101.899C64.881 120.567 86.8748 132.01 108.092 130.021Z" fill="#F3B01C"/>
        <path d="M53.4012 90.1735C46.0375 107.191 45.7186 127.114 54.7463 143.51C22.9759 119.608 23.3226 68.4578 54.358 44.7949C57.2286 42.6078 60.64 41.3097 64.2178 41.1121C78.9312 40.336 93.8804 46.0225 104.364 56.6193C83.0637 56.831 62.318 70.4756 53.4012 90.1735Z" fill="#8D2676"/>
        <path d="M114.637 61.8552C103.89 46.8701 87.0686 36.6684 68.6387 36.358C104.264 20.1876 148.085 46.4045 152.856 85.1654C153.3 88.7635 152.717 92.4322 151.122 95.6775C144.466 109.195 132.124 119.679 117.702 123.559C128.269 103.96 126.965 80.0151 114.637 61.8552Z" fill="#EE342F"/>
        </svg>
      </motion.button>
    </div>
  );
};

export default ConvexPanel; 