import { motion } from 'framer-motion';
import { CopyIcon } from 'lucide-react';
import { formatJson } from '../../utils';
import { detailPanelVariants } from '../../theme';
import { ThemeClasses } from '../../types';
import { XIcon } from '../../components/icons';

interface NetworkCall {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  size: string;
  time: number;
  type: string;
  initiator: string;
  timestamp: number;
  startTime: number;
  endTime: number;
  duration: number;
  isError: boolean;
  request: {
    headers: Record<string, string>;
    body?: any;
  };
  response: {
    headers: Record<string, string>;
    body?: any;
  };
}

interface NetworkDetailPanelProps {
  /**
   * The network call to display in the detail panel.
   */
  selectedCall: NetworkCall;
  
  /**
   * The theme to use for the detail panel.
   */
  mergedTheme: ThemeClasses; 
  
  /**
   * The function to call when the detail panel is closed.
   */
  setIsDetailPanelOpen: (isOpen: boolean) => void;
}

const NetworkDetailPanel = ({ 
  /**
   * The network call to display in the detail panel.
   */
  selectedCall,
  
  /**
   * The theme to use for the detail panel.
   */
  mergedTheme, 
  
  /**
   * The function to call when the detail panel is closed.
   */
  setIsDetailPanelOpen 
}: NetworkDetailPanelProps) => {
  if (!selectedCall) return null;
  
  const timestamp = new Date(selectedCall.timestamp).toLocaleString();
  
  // Format the URL for display
  let url = selectedCall.url;
  let hostname = "";
  let pathname = "";
  
  try {
    const parsedUrl = new URL(selectedCall.url, window.location.origin);
    hostname = parsedUrl.hostname;
    pathname = parsedUrl.pathname;
    url = selectedCall.url; // Keep the full URL
  } catch (e) {
    // If URL parsing fails, just use the raw URL
    url = selectedCall.url;
  }
  
  // Format request and response as JSON
  const requestJson = {
    headers: selectedCall.request.headers,
    body: selectedCall.request.body
  };
  
  const responseJson = {
    headers: selectedCall.response.headers,
    body: selectedCall.response.body
  };
  
  return (
    <motion.div 
      {...{
        className: `convex-panel-detail-panel ${mergedTheme.container}`,
        variants: detailPanelVariants,
        initial: "hidden",
        animate: "visible",
        exit: "hidden",
        style: { width: '50%', height: '100%' }
      } as any}
    >
      <div className="convex-panel-detail-header">
        <h3 className="convex-panel-detail-title">REQUEST DETAILS</h3>
        <button 
          onClick={() => setIsDetailPanelOpen(false)}
          className="convex-panel-detail-close-button"
        >
          <XIcon />
        </button>
      </div>
      
      <div className="convex-panel-detail-content">
        {/* Basic Info */}
        <div className="convex-panel-detail-section">
          <h4 className="convex-panel-detail-section-title">General Information</h4>
          <div className="convex-panel-detail-fields">
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">URL:</span>
              <span className="convex-panel-detail-url">{url}</span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Method:</span>
              <span className="convex-panel-detail-method">{selectedCall.method}</span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Status:</span>
              <span className={`convex-panel-detail-status ${selectedCall.status >= 200 && selectedCall.status < 300 ? 'convex-panel-success-text' : 'convex-panel-error-text'}`}>
                {selectedCall.status} {selectedCall.statusText}
              </span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Timestamp:</span>
              <span className="convex-panel-detail-timestamp">{timestamp}</span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Size:</span>
              <span className="convex-panel-detail-size">{selectedCall.size}</span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Time:</span>
              <span className="convex-panel-detail-time">{selectedCall.time}ms</span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Type:</span>
              <span className="convex-panel-detail-type">{selectedCall.type}</span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Initiator:</span>
              <span className="convex-panel-detail-initiator">{selectedCall.initiator}</span>
            </div>
          </div>
        </div>
        
        {/* Request Headers */}
        <div className="convex-panel-detail-section">
          <h4 className="convex-panel-detail-section-title">Request Headers</h4>
          <div className="convex-panel-detail-headers">
            {Object.entries(selectedCall.request.headers).map(([key, value]) => (
              <div key={key} className="convex-panel-detail-header-item">
                <span className="convex-panel-detail-header-key">{key}:</span>
                <span className="convex-panel-detail-header-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Request Body */}
        {selectedCall.request.body && (
          <div className="convex-panel-detail-section">
            <h4 className="convex-panel-detail-section-title">Request Payload</h4>
            <div className="convex-panel-detail-raw-container">
              <button
                className="convex-panel-detail-copy-button"
                onClick={() => navigator.clipboard.writeText(
                  typeof selectedCall.request.body === 'string' 
                    ? selectedCall.request.body 
                    : JSON.stringify(selectedCall.request.body, null, 2)
                )}
              >
                <CopyIcon className="convex-panel-copy-icon" />
              </button>
              <pre className="convex-panel-detail-raw-json">
                {typeof selectedCall.request.body === 'string' 
                  ? selectedCall.request.body 
                  : formatJson(selectedCall.request.body)}
              </pre>
            </div>
          </div>
        )}
        
        {/* Response Headers */}
        <div className="convex-panel-detail-section">
          <h4 className="convex-panel-detail-section-title">Response Headers</h4>
          <div className="convex-panel-detail-headers">
            {Object.entries(selectedCall.response.headers).map(([key, value]) => (
              <div key={key} className="convex-panel-detail-header-item">
                <span className="convex-panel-detail-header-key">{key}:</span>
                <span className="convex-panel-detail-header-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Response Body */}
        {selectedCall.response.body && (
          <div className="convex-panel-detail-section">
            <h4 className="convex-panel-detail-section-title">Response Body</h4>
            <div className="convex-panel-detail-raw-container">
              <button
                className="convex-panel-detail-copy-button"
                onClick={() => navigator.clipboard.writeText(
                  typeof selectedCall.response.body === 'string' 
                    ? selectedCall.response.body 
                    : JSON.stringify(selectedCall.response.body, null, 2)
                )}
              >
                <CopyIcon className="convex-panel-copy-icon" />
              </button>
              <pre className="convex-panel-detail-raw-json">
                {typeof selectedCall.response.body === 'string' 
                  ? selectedCall.response.body 
                  : formatJson(selectedCall.response.body)}
              </pre>
            </div>
          </div>
        )}
        
        {/* Raw Data */}
        <div className="convex-panel-detail-section">
          <h4 className="convex-panel-detail-section-title">Raw Data</h4>
          <div className="convex-panel-detail-raw-container">
            <button
              className="convex-panel-detail-copy-button"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedCall, null, 2))}
            >
              <CopyIcon className="convex-panel-copy-icon" />
            </button>
            <pre className="convex-panel-detail-raw-json">{formatJson(selectedCall)}</pre>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

NetworkDetailPanel.displayName = 'NetworkDetailPanel';

export default NetworkDetailPanel; 