import { useState, useEffect, useMemo, ErrorInfo } from 'react';
import Image from 'next/image';
import { AnimatePresence, useDragControls } from 'framer-motion';
import { motion } from 'framer-motion';
import { ButtonProps } from './types';
import { LogType } from './utils/constants';
import { defaultTheme, buttonVariants } from './theme';
import Container from './Container';
import { ConvexReactClient } from 'convex/react';
import { ConvexClient } from 'convex/browser';
// @ts-ignore
import cssText from './styles/convex-panel.css';
import { STORAGE_KEYS, TabTypes } from './utils/constants';
import { getStorageItem } from './utils/storage';
import { ConvexLogo } from './components/icons';
import ErrorBoundary from './ErrorBoundary';

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

  /**
   * Position of the ConvexPanel button.
   * Controls where the button appears on the screen.
   * @default 'bottom-right'
   */
  buttonPosition = 'bottom-right',

  /**
   * Whether to use mock data instead of real API data.
   * Useful for development, testing, and demos.
   * When true, the component will use mock data instead of making API calls.
   * @default false
   */
  useMockData = false,
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

  // Get button position styles based on buttonPosition prop
  const getButtonPositionStyles = () => {
    const baseStyles = {
      position: 'fixed',
      margin: '20px',
      zIndex: 9999,
    } as const;

    switch (buttonPosition) {
      case 'bottom-left':
        return {
          ...baseStyles,
          bottom: 0,
          left: 0,
        };
      case 'bottom-center':
        return {
          ...baseStyles,
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'bottom-right':
        return {
          ...baseStyles,
          bottom: 0,
          right: 0,
        };
      case 'right-center':
        return {
          ...baseStyles,
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)',
        };
      case 'top-right':
        return {
          ...baseStyles,
          top: 0,
          right: 0,
        };
      default:
        return {
          ...baseStyles,
          bottom: 0,
          right: 0,
        };
    }
  };

  // Don't render anything on the server
  if (!isMounted) {
    return null;
  }

  // Render the button and container separately
  // The button should always be visible, even if there's an error with the Container
  return (
    <div className="convex-panel-container" style={{ zIndex: 99999 }}>
      <AnimatePresence>
        {isOpen && (
          <ErrorBoundary fallback={
            <div className="convex-panel-error-container" style={{
              position: 'fixed',
              top: position.y,
              left: position.x,
              width: containerSize.width,
              height: 'auto',
              backgroundColor: '#1e1e1e',
              color: '#ff5555',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>Convex Panel Error</h3>
                <button 
                  onClick={toggleOpen}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#fff', 
                    fontSize: '18px',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </div>
              <p>An error occurred while loading the Convex Panel. Please check the console for more details.</p>
            </div>
          }>
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
              useMockData={useMockData}
            />
          </ErrorBoundary>
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
        style={getButtonPositionStyles()}
      >
        <ConvexLogo />
      </motion.button>
    </div>
  );
};

ConvexPanel.displayName = 'ConvexPanel';

export default ConvexPanel; 