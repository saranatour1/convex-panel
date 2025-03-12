import { motion } from 'framer-motion';
import { CopyIcon } from 'lucide-react';
import type { ThemeClasses } from '../types';
import { LogEntry } from './types';
import { formatJson } from '../utils';
import { detailPanelVariants } from '../theme';

interface LogDetailPanelProps {
  selectedLog: LogEntry;
  mergedTheme: ThemeClasses;
  setIsDetailPanelOpen: (isOpen: boolean) => void;
}

const LogDetailPanel = ({ selectedLog, mergedTheme, setIsDetailPanelOpen }: LogDetailPanelProps) => {
  if (!selectedLog) return null;
  
  const timestamp = new Date(selectedLog.timestamp * 1000).toLocaleString();
  const executionTime = selectedLog.execution_time_ms 
    ? `${selectedLog.execution_time_ms.toFixed(2)}ms` 
    : 'N/A';
  
  return (
    <motion.div 
      className={`convex-panel-detail-panel ${mergedTheme.container}`}
      variants={detailPanelVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      layout
    >
      <div className="convex-panel-detail-header">
        <h3 className="convex-panel-detail-title">LOG DETAILS</h3>
        <button 
          onClick={() => setIsDetailPanelOpen(false)}
          className="convex-panel-detail-close-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="convex-panel-detail-content">
        {/* Basic Info */}
        <div className="convex-panel-detail-section">
          <h4 className="convex-panel-detail-section-title">Basic Information</h4>
          <div className="convex-panel-detail-fields">
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Timestamp:</span>
              <span className="convex-panel-detail-timestamp">{timestamp}</span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Request ID:</span>
              <span className="convex-panel-detail-request-id">{selectedLog.function?.request_id || 'N/A'}</span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Status:</span>
              <span className={`convex-panel-detail-status ${selectedLog.status === 'success' ? 'convex-panel-success-text' : 'convex-panel-error-text'}`}>
                {selectedLog.status || 'N/A'}
              </span>
            </div>
            <div className="convex-panel-detail-field">
              <span className="convex-panel-detail-label">Execution Time:</span>
              <span className="convex-panel-detail-execution-time">{executionTime}</span>
            </div>
          </div>
        </div>
        
        {/* Function Info */}
        {selectedLog.function && (
          <div className="convex-panel-detail-section">
            <h4 className="convex-panel-detail-section-title">Function Information</h4>
            <div className="convex-panel-detail-fields">
              <div className="convex-panel-detail-field">
                <span className="convex-panel-detail-label">Type:</span>
                <span className="convex-panel-detail-function-type">{selectedLog.function.type || 'N/A'}</span>
              </div>
              <div className="convex-panel-detail-field">
                <span className="convex-panel-detail-label">Path:</span>
                <span className="convex-panel-detail-function-path">{selectedLog.function.path || 'N/A'}</span>
              </div>
              <div className="convex-panel-detail-field">
                <span className="convex-panel-detail-label">Cached:</span>
                <span className="convex-panel-detail-function-cached">{selectedLog.function.cached ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Log Lines */}
        {selectedLog.raw && selectedLog.raw.logLines && selectedLog.raw.logLines.length > 0 && (
          <div className="convex-panel-detail-section">
            <h4 className="convex-panel-detail-section-title">Log Output</h4>
            <div className="convex-panel-detail-log-output">
              {selectedLog.raw.logLines.map((line: string, i: number) => (
                <div key={i} className="convex-panel-detail-log-line">{line}</div>
              ))}
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {selectedLog.error_message && (
          <div className="convex-panel-detail-section">
            <h4 className="convex-panel-detail-error-title">Error</h4>
            <div className="convex-panel-detail-error-container">
              <div className="convex-panel-detail-error-message">{selectedLog.error_message}</div>
            </div>
          </div>
        )}
        
        {/* Raw Data */}
        <div className="convex-panel-detail-section">
          <h4 className="convex-panel-detail-section-title">Raw Data</h4>
          <div className="convex-panel-detail-raw-container">
            <button
              className="convex-panel-detail-copy-button"
              onClick={() => navigator.clipboard.writeText(formatJson(selectedLog.raw))}
            >
              <CopyIcon className="convex-panel-copy-icon" />
            </button>
            <pre className="convex-panel-detail-raw-json">{formatJson(selectedLog.raw)}</pre>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LogDetailPanel; 