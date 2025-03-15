import React, { useState, useEffect } from 'react';
import FailureRateChart from './components/FailureRateChart';
import CacheHitRateChart from './components/CacheHitRateChart';
import SchedulerLagChart from './components/SchedulerLagChart';
import { HealthContainerProps } from 'src/types';
import { ROUTES } from 'src/utils/constants';
import { ChartIcon, RevertIcon } from 'src/components/icons';

const HealthContainer: React.FC<HealthContainerProps> = ({
  /**
   * URL of the deployment.
   * Used to configure the connection to the deployment.
   * @required
   */
  deploymentUrl,

  /**
   * Authentication token for accessing the deployment.
   * Required for securing access to the deployment.
   * Should be kept private and not exposed to clients.
   * @required
   */
  authToken,

  /**
   * Version of the Convex package.
   * Used to determine if an update is available.
   * @default "1.18.0"
   */
  convexVersion = "1.18.0",

  /**
   * Whether to use mock data instead of real API data.
   * Useful for development, testing, and demos.
   * @default false
   */
  useMockData = false
}) => {
  const [showDetailedSchedulerView, setShowDetailedSchedulerView] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>(`v${convexVersion.replace(/^\^v?/, '')}`);
  const [latestVersion, setLatestVersion] = useState<string>("");
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [isCheckingVersion, setIsCheckingVersion] = useState<boolean>(false);

  /**
   * Toggles the detailed scheduler view.
   */
  const toggleSchedulerView = () => {
    setShowDetailedSchedulerView(!showDetailedSchedulerView);
  };

  /**
   * Compares version strings (e.g., "v1.18.2" vs "v1.20.0").
   * @param current - The current version string.
   * @param latest - The latest version string.
   * @returns True if the latest version is greater than the current version, false otherwise.
   */
  const compareVersions = (current: string, latest: string): boolean => {
    // Remove 'v' prefix if present
    const currentClean = current.replace(/^v/, '');
    const latestClean = latest.replace(/^v/, '');
    
    const currentParts = currentClean.split('.').map(Number);
    const latestParts = latestClean.split('.').map(Number);
    
    // Compare major, minor, and patch versions
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;
      
      if (latestPart > currentPart) {
        return true; // Update available
      } else if (latestPart < currentPart) {
        return false; // Current is newer (shouldn't happen normally)
      }
    }
    
    return false; // Versions are equal
  };

  /**
   * Fetches the latest version of the Convex package from the npm registry.
   * Updates the latest version and checks if an update is available.
   */
  const fetchLatestVersion = async () => {
    // Skip version check if using mock data
    if (useMockData) {
      setLatestVersion("v1.20.0");
      setIsUpdateAvailable(true);
      return;
    }

    setIsCheckingVersion(true);
    try {
      // Query npm registry for latest convex package version
      const response = await fetch(ROUTES.NPM_CONVEX);
      
      if (!response.ok) {
        throw new Error('Failed to fetch latest version from npm');
      }
      
      const data = await response.json();
      const fetchedVersion = data.version;
      
      if (fetchedVersion) {
        setLatestVersion(`v${fetchedVersion}`);
        setIsUpdateAvailable(compareVersions(currentVersion, `v${fetchedVersion}`));
      } else {
        console.warn('Could not get version information from npm');
      }
    } catch (error) {
      console.error('Error fetching version information:', error);
    } finally {
      setIsCheckingVersion(false);
    }
  };

  /**
   * Fetches the latest version of the Convex package from the npm registry.
   * Updates the latest version and checks if an update is available.
   */
  useEffect(() => {
    fetchLatestVersion();
    
    // Set up periodic checking (every hour)
    const intervalId = setInterval(fetchLatestVersion, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  /**
   * Opens the Convex changelog in a new tab.
   */
  const handleUpdateClick = () => {
    // Open the Convex changelog in a new tab 
    window.open(ROUTES.CONVEX_CHANGELOG, '_blank');
  };

  return (
    <div className="health-container" style={{ overflow: 'auto' }}>      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        marginBottom: '20px'
      }}>
        <CacheHitRateChart 
          deploymentUrl={deploymentUrl}
          authToken={authToken}
          refreshInterval={60000}
          useMockData={useMockData}
        />
        <FailureRateChart 
          deploymentUrl={deploymentUrl}
          authToken={authToken}
          refreshInterval={60000}
          useMockData={useMockData}
        />
      </div>
      
      <div style={{
        display: 'grid',
      }}>
        <div style={{
          backgroundColor: '#1e1e1e',
          borderRadius: '8px',
          position: 'relative'
        }}>
          <SchedulerLagChart
            deploymentUrl={deploymentUrl}
            authToken={authToken}
            refreshInterval={60000}
            showChart={showDetailedSchedulerView}
            useMockData={useMockData}
          />
          <div style={{
            position: 'absolute',
            top: '25px',
            right: '25px',
            zIndex: 2
          }}>
            <button
              onClick={toggleSchedulerView}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#cccccc',
                fontSize: '18px',
                padding: '4px'
              }}
            >
              {showDetailedSchedulerView ? (
                <ChartIcon />
              ) : (
                <RevertIcon />
              )}
            </button>
          </div>
        </div>
        <div style={{
          backgroundColor: '#1e1e1e',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 className="convex-panel-health-header convex-panel-table-header-theme">Last Deployed</h3>
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Convex {currentVersion}</span>
              {isUpdateAvailable ? (
                <button
                  onClick={handleUpdateClick}
                  className={`convex-panel-live-button`}
                >
                  Update Available: {latestVersion}
                </button>
              ) : isCheckingVersion ? (
                <span style={{ color: '#cccccc', fontSize: '14px' }}>Checking for updates...</span>
              ) : (
                <span style={{ color: '#4caf50', fontSize: '14px' }}>Up to date</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthContainer;