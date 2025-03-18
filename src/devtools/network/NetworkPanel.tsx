import React, { useState, useEffect, useRef } from 'react';
import { NetworkPanelProps, NetworkCall } from '../../types';
import NetworkTable from './NetworkTable';

export const NetworkPanel: React.FC<NetworkPanelProps> = ({
  mergedTheme,
  settings,
  containerSize,
}) => {
  const [networkCalls, setNetworkCalls] = useState<NetworkCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<NetworkCall | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  const [filterText, setFilterText] = useState('');
  
  // Network interceptor
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const originalFetch = window.fetch;
    const networkRequests = new Map<string, NetworkCall>();
    
    // Intercept fetch requests
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      // Create a unique ID for this request
      const id = Math.random().toString(36).substring(2, 15);
      
      // Get the URL and method properly based on input type
      let url: string;
      let method: string;
      
      if (typeof input === 'string') {
        url = input;
        method = init?.method || 'GET';
      } else if (input instanceof URL) {
        url = input.toString();
        method = init?.method || 'GET';
      } else {
        // input is a Request object
        url = input.url;
        method = input.method || 'GET';
      }
      
      // Capture request start time
      const startTime = performance.now();
      const timestamp = Date.now();
      
      // Store initial request info
      const requestHeaders: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, name) => {
            requestHeaders[name] = value;
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([name, value]) => {
            requestHeaders[name] = value;
          });
        } else {
          Object.entries(init.headers).forEach(([name, value]) => {
            requestHeaders[name] = String(value);
          });
        }
      }
      
      // Create network call object
      const networkCall: NetworkCall = {
        id,
        url,
        method: method || 'GET',
        status: 0,
        statusText: '',
        size: '0 B',
        time: 0,
        type: 'fetch',
        initiator: 'fetch',
        timestamp,
        startTime,
        endTime: 0,
        duration: 0,
        isError: false,
        request: {
          headers: requestHeaders,
          body: init?.body ? JSON.stringify(init.body) : undefined
        },
        response: {
          headers: {},
          body: undefined
        }
      };
      
      // Add to tracking map
      networkRequests.set(id, networkCall);
      
      // Add to state if recording
      if (isRecording) {
        setNetworkCalls(prev => [networkCall, ...prev]);
      }
      
      try {
        // Make the actual fetch request
        const response = await originalFetch(input, init);
        
        // Capture end time
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Get response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, name) => {
          responseHeaders[name] = value;
        });
        
        // Clone the response so we can read its body
        const clonedResponse = response.clone();
        
        // Try to get response body based on content type
        let responseBody;
        const contentType = clonedResponse.headers.get('content-type');
        
        try {
          if (contentType?.includes('application/json')) {
            responseBody = await clonedResponse.json();
          } else if (contentType?.includes('text/')) {
            responseBody = await clonedResponse.text();
          }
        } catch (e) {
          // Ignore body parsing errors
        }
        
        // Update network call with response data
        const updatedCall: NetworkCall = {
          ...networkCall,
          status: response.status,
          statusText: response.statusText,
          size: getResponseSize(response),
          time: Math.round(duration),
          endTime,
          duration,
          isError: !response.ok,
          response: {
            headers: responseHeaders,
            body: responseBody
          }
        };
        
        // Update in map
        networkRequests.set(id, updatedCall);
        
        // Update in state if recording
        if (isRecording) {
          setNetworkCalls(prev => 
            prev.map(call => call.id === id ? updatedCall : call)
          );
        }
        
        return response;
      } catch (error) {
        // Capture end time for error
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Update network call with error data
        const errorCall: NetworkCall = {
          ...networkCall,
          status: 0,
          statusText: error instanceof Error ? error.message : 'Network Error',
          time: Math.round(duration),
          endTime,
          duration,
          isError: true,
          response: {
            headers: {},
            body: error instanceof Error ? error.toString() : 'Network Error'
          }
        };
        
        // Update in map
        networkRequests.set(id, errorCall);
        
        // Update in state if recording
        if (isRecording) {
          setNetworkCalls(prev => 
            prev.map(call => call.id === id ? errorCall : call)
          );
        }
        
        throw error;
      }
    };
    
    // Clean up
    return () => {
      window.fetch = originalFetch;
    };
  }, [isRecording]);
  
  // Helper function to format response size
  const getResponseSize = (response: Response): string => {
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const bytes = parseInt(contentLength, 10);
      if (bytes < 1024) {
        return `${bytes} B`;
      } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
      } else {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      }
    }
    return 'Unknown';
  };
  
  // Filter network calls based on filter text
  const filteredCalls = networkCalls.filter(call => {
    if (!filterText) return true;
    const lowerFilter = filterText.toLowerCase();
    return (
      call.url.toLowerCase().includes(lowerFilter) || 
      call.method.toLowerCase().includes(lowerFilter) ||
      call.status.toString().includes(lowerFilter) ||
      call.statusText.toLowerCase().includes(lowerFilter) ||
      call.type.toLowerCase().includes(lowerFilter)
    );
  });
  
  // Clear all captured network calls
  const clearNetworkCalls = () => {
    setNetworkCalls([]);
    setSelectedCall(null);
    setIsDetailPanelOpen(false);
  };
  
  // Toggle recording of network calls
  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };
  
  // Handle network call selection
  const handleCallSelect = (call: NetworkCall) => {
    if (selectedCall && selectedCall.id === call.id) {
      setSelectedCall(null);
      setIsDetailPanelOpen(false);
    } else {
      setSelectedCall(call);
      setIsDetailPanelOpen(true);
    }
  };
  
  // Handle row mouse events
  const onRowMouseEnter = (callId: string, event: React.MouseEvent) => {
    // Could implement hover behavior here if needed
  };
  
  const onRowMouseLeave = () => {
    // Could implement hover behavior here if needed
  };
  
  return (
    <div className="convex-panel-network-container">
      <div className="convex-panel-toolbar">
        <button 
          className="convex-panel-clear-button"
          onClick={clearNetworkCalls}
        >
          Clear
        </button>
        <button 
          className={`convex-panel-live-button ${isRecording ? 'convex-panel-live-button-active' : ''}`}
          onClick={toggleRecording}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
        <div className="convex-panel-filter-container">
          <input
            type="text"
            placeholder="Filter network requests..."
            className="convex-panel-filter-input"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
      </div>
      
      <div className="convex-panel-network-content" style={{ height: containerSize.height - 44 }}>
        <NetworkTable 
          mergedTheme={mergedTheme}
          filteredCalls={filteredCalls}
          containerSize={{ width: containerSize.width, height: containerSize.height - 44 }}
          isDetailPanelOpen={isDetailPanelOpen}
          selectedCall={selectedCall}
          setIsDetailPanelOpen={setIsDetailPanelOpen}
          handleCallSelect={handleCallSelect}
          onRowMouseEnter={onRowMouseEnter}
          onRowMouseLeave={onRowMouseLeave}
        />
      </div>
    </div>
  );
};

export default NetworkPanel; 