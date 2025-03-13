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
import { STORAGE_KEYS, TabTypes } from './utils/constants';
import { getStorageItem } from './data';
import { ConvexLogo } from './components/icons';

/**
 * Injects the CSS styles into the document head
 */
const injectStyles = () => {
  // Check if the style element already exists
  const styleId = 'convex-panel-styles';
  if (document.getElementById(styleId)) {
    return; // Already injected
  }

  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = cssText;
  
  // Append to head
  document.head.appendChild(styleElement);
};

/**
 * The main ConvexPanel component
 */
const ConvexPanel = ({
  /** 
   * Initial number of logs to fetch and display.
   * Controls the initial page size when loading logs.
   * @default 100
   */
  initialLimit = 100,

  /**
   * Whether to show successful logs in the initial view.
   * Can be toggled by the user in the UI.
   * @default true
   */
  initialShowSuccess = true,

  /**
   * Initial log type filter to apply when panel first loads.
   * Options include: ALL, SUCCESS, FAILURE, DEBUG, LOGINFO, WARNING, ERROR, HTTP
   * Controls which types of operations are displayed.
   * Can be changed by the user via dropdown.
   * @default LogType.ALL
   */
  initialLogType = LogType.ALL,

  /**
   * Callback fired whenever new logs are fetched.
   * Receives array of log entries as parameter.
   * Useful for external monitoring or processing of logs.
   * @param logs Array of LogEntry objects
   */
  onLogFetch,

  /**
   * Error handling callback.
   * Called when errors occur during log fetching or processing.
   * Receives error message string as parameter.
   * @param error Error message
   */
  onError,

  /**
   * Theme customization object to override default styles.
   * Supports customizing colors, spacing, and component styles.
   * See ThemeClasses interface for available options.
   * @default {}
   */
  theme = {},

  /**
   * Maximum number of logs to keep in memory.
   * Prevents memory issues from storing too many logs.
   * Older logs are removed when limit is reached.
   * @default 500
   */
  maxStoredLogs = 500,

  /**
   * Convex React client instance.
   * Required for making API calls to your Convex backend.
   * Must be initialized and configured before passing.
   * @required
   */
  convex,

  /**
   * Authentication token for accessing Convex API.
   * Required for securing access to logs and data.
   * Should be kept private and not exposed to clients.
   * @required
   */
  accessToken,

  /**
   * Optional deploy key for admin-level access.
   * Enables additional admin capabilities when provided.
   * Should be kept secure and only used in protected environments.
   * @optional
   */
  deployKey,

  /**
   * Optional deploy URL for the Convex deployment.
   * Used to configure the admin client connection.
   * Default is the environment variable CONVEX_DEPLOYMENT.
   * @optional
   */
  deployUrl,
}: ButtonProps) => {
  const dragControls = useDragControls();
  const mergedTheme = useMemo(() => ({ ...defaultTheme, ...theme }), [theme]);
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 500 });
  const [initialTab, setInitialTab] = useState<TabTypes>('logs');

  /**
   * Create admin client
   */
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const adminClient = convexUrl && deployKey ? new ConvexClient(convexUrl) : null;
  
  /**
   * Set admin auth
   */
  if (adminClient && deployKey) {
    (adminClient as any).setAdminAuth(deployKey);
  }

  /**
   * Set mounted state
   */
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
    
    const savedPosition = localStorage.getItem(STORAGE_KEYS.POSITION);
    const savedSize = localStorage.getItem(STORAGE_KEYS.SIZE);
    
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
    
    localStorage.setItem(STORAGE_KEYS.POSITION, JSON.stringify(position));
    localStorage.setItem(STORAGE_KEYS.SIZE, JSON.stringify(containerSize));
  }, [position, containerSize, isMounted]);

  /**
   * Toggle the open state of the container
   */
  const toggleOpen = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // If we're opening the container, load the saved tab
    if (newIsOpen && typeof window !== 'undefined') {
      const savedTab = getStorageItem<TabTypes>(STORAGE_KEYS.ACTIVE_TAB, 'logs');
      // We'll pass this as a prop to Container
      setInitialTab(savedTab);
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
            deployUrl={deployUrl}
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
        <ConvexLogo />
      </motion.button>
    </div>
  );
};

ConvexPanel.displayName = 'ConvexPanel';

export default ConvexPanel; 