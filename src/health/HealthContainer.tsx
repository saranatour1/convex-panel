import React, { useState, useEffect } from 'react';
import FailureRateChart from './components/FailureRateChart';
import CacheHitRateChart from './components/CacheHitRateChart';
import SchedulerLagChart from './components/SchedulerLagChart';
import SchedulerStatus from './components/SchedulerStatus';

interface HealthContainerProps {
  deploymentUrl: string;
  authToken: string;
  convexVersion?: string; // Optional prop for version
}

const HealthContainer: React.FC<HealthContainerProps> = ({
  deploymentUrl,
  authToken,
  convexVersion = "1.18.0" // Default if not provided
}) => {
  const [showDetailedSchedulerView, setShowDetailedSchedulerView] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [currentVersion, setCurrentVersion] = useState<string>(`v${convexVersion.replace(/^\^v?/, '')}`);
  const [latestVersion, setLatestVersion] = useState<string>("");
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [isCheckingVersion, setIsCheckingVersion] = useState<boolean>(false);

  const toggleSchedulerView = () => {
    setShowDetailedSchedulerView(!showDetailedSchedulerView);
  };

  // Compare version strings (e.g., "v1.18.2" vs "v1.20.0")
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

  // Fetch latest version from npm registry
  const fetchLatestVersion = async () => {
    setIsCheckingVersion(true);
    try {
      // Query npm registry for latest convex package version
      const response = await fetch('https://registry.npmjs.org/convex/latest');
      
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

  // Check for latest version when component mounts
  useEffect(() => {
    fetchLatestVersion();
    
    // Set up periodic checking (every hour)
    const intervalId = setInterval(fetchLatestVersion, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleUpdateClick = () => {
    // Open the Convex changelog in a new tab
    window.open('https://github.com/get-convex/convex-js/blob/main/CHANGELOG.md', '_blank');
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
        />
        <FailureRateChart 
          deploymentUrl={deploymentUrl}
          authToken={authToken}
          refreshInterval={60000}
        />
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
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
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.85355 2.14645C5.04882 2.34171 5.04882 2.65829 4.85355 2.85355L3.70711 4H9C11.4853 4 13.5 6.01472 13.5 8.5C13.5 10.9853 11.4853 13 9 13H5C4.72386 13 4.5 12.7761 4.5 12.5C4.5 12.2239 4.72386 12 5 12H9C10.933 12 12.5 10.433 12.5 8.5C12.5 6.567 10.933 5 9 5H3.70711L4.85355 6.14645C5.04882 6.34171 5.04882 6.65829 4.85355 6.85355C4.65829 7.04882 4.34171 7.04882 4.14645 6.85355L2.14645 4.85355C1.95118 4.65829 1.95118 4.34171 2.14645 4.14645L4.14645 2.14645C4.34171 1.95118 4.65829 1.95118 4.85355 2.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                  </path>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.5 1C11.7761 1 12 1.22386 12 1.5V13.5C12 13.7761 11.7761 14 11.5 14C11.2239 14 11 13.7761 11 13.5V1.5C11 1.22386 11.2239 1 11.5 1ZM9.5 3C9.77614 3 10 3.22386 10 3.5V13.5C10 13.7761 9.77614 14 9.5 14C9.22386 14 9 13.7761 9 13.5V3.5C9 3.22386 9.22386 3 9.5 3ZM13.5 3C13.7761 3 14 3.22386 14 3.5V13.5C14 13.7761 13.7761 14 13.5 14C13.2239 14 13 13.7761 13 13.5V3.5C13 3.22386 13.2239 3 13.5 3ZM5.5 4C5.77614 4 6 4.22386 6 4.5V13.5C6 13.7761 5.77614 14 5.5 14C5.22386 14 5 13.7761 5 13.5V4.5C5 4.22386 5.22386 4 5.5 4ZM1.5 5C1.77614 5 2 5.22386 2 5.5V13.5C2 13.7761 1.77614 14 1.5 14C1.22386 14 1 13.7761 1 13.5V5.5C1 5.22386 1.22386 5 1.5 5ZM7.5 5C7.77614 5 8 5.22386 8 5.5V13.5C8 13.7761 7.77614 14 7.5 14C7.22386 14 7 13.7761 7 13.5V5.5C7 5.22386 7.22386 5 7.5 5ZM3.5 7C3.77614 7 4 7.22386 4 7.5V13.5C4 13.7761 3.77614 14 3.5 14C3.22386 14 3 13.7761 3 13.5V7.5C3 7.22386 3.22386 7 3.5 7Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                  </path>
                </svg>
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