

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
      className={`w-1/2 ${mergedTheme.container} overflow-y-auto bg-[#121212]`}
      variants={detailPanelVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <div className="p-2 bg-[#2a2a2a] flex justify-between items-center sticky top-0 z-10">
        <h3 className={`text-xs font-semibold text-gray-400`}>LOG DETAILS</h3>
        <button 
          onClick={() => setIsDetailPanelOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Basic Info */}
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase">Basic Information</h4>
          <div className="space-y-1">
            <div className="flex">
              <span className="text-xs text-gray-400 w-24">Timestamp:</span>
              <span className="text-xs text-white font-mono">{timestamp}</span>
            </div>
            <div className="flex">
              <span className="text-xs text-gray-400 w-24">Request ID:</span>
              <span className="text-xs text-blue-400 font-mono">{selectedLog.function?.request_id || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="text-xs text-gray-400 w-24">Status:</span>
              <span className={`text-xs ${selectedLog.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {selectedLog.status || 'N/A'}
              </span>
            </div>
            <div className="flex">
              <span className="text-xs text-gray-400 w-24">Execution Time:</span>
              <span className="text-xs text-purple-400">{executionTime}</span>
            </div>
          </div>
        </div>
        
        {/* Function Info */}
        {selectedLog.function && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase">Function Information</h4>
            <div className="space-y-1">
              <div className="flex">
                <span className="text-xs text-gray-400 w-24">Type:</span>
                <span className="text-xs text-white">{selectedLog.function.type || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="text-xs text-gray-400 w-24">Path:</span>
                <span className="text-xs text-blue-400 font-mono">{selectedLog.function.path || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="text-xs text-gray-400 w-24">Cached:</span>
                <span className="text-xs text-white">{selectedLog.function.cached ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Log Lines */}
        {selectedLog.raw && selectedLog.raw.logLines && selectedLog.raw.logLines.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase">Log Output</h4>
            <div className="bg-[#1a1a1a] p-2 rounded-md">
              {selectedLog.raw.logLines.map((line: string, i: number) => (
                <div key={i} className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{line}</div>
              ))}
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {selectedLog.error_message && (
          <div>
            <h4 className="text-sm font-semibold text-red-400 mb-2 uppercase">Error</h4>
            <div className="bg-[#1a1a1a] p-2 rounded-md">
              <div className="text-xs text-red-400 font-mono whitespace-pre-wrap">{selectedLog.error_message}</div>
            </div>
          </div>
        )}
        
        {/* Raw Data */}
        <div>
          <h4 className="text-sm font-semibold text-gray-400 uppercase mb-2">Raw Data</h4>
          <div className="bg-[#1a1a1a] p-2 rounded-md overflow-x-auto relative group">
            <button
              className="absolute top-2 right-2 invisible group-hover:visible text-gray-400 hover:text-gray-300 transition-colors"
              onClick={() => navigator.clipboard.writeText(formatJson(selectedLog.raw))}
            >
              <CopyIcon className="w-4 h-4" />
            </button>
            <pre className="text-xs text-gray-300 font-mono">{formatJson(selectedLog.raw)}</pre>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default LogDetailPanel; 