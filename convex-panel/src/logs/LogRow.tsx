

import { memo } from 'react';
import { InfoIcon } from 'lucide-react';
import { ThemeClasses } from '../types';
import { LogEntry } from './types';

interface LogRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    logs: LogEntry[];
    isDetailPanelOpen: boolean;
    mergedTheme: ThemeClasses;
    handleLogSelect: (log: LogEntry) => void;
  };
}

const LogRow = memo(({ index, style, data }: LogRowProps) => {
  const { logs, isDetailPanelOpen, mergedTheme, handleLogSelect } = data;
  const log = logs[index];
  if (!log) return null;
  const timestamp = new Date(log.timestamp * 1000).toLocaleString();
  const requestId = log.function?.request_id || '';
  
  // Format execution time to be more readable
  const executionTime = log.execution_time_ms 
    ? log.execution_time_ms < 1 
      ? `${(log.execution_time_ms * 1000).toFixed(2)} μs` 
      : `${log.execution_time_ms.toFixed(2)} ms`
    : '';
  
  // Determine log type and format accordingly
  let logType = '';
  let logDetails = '';
  
  if (log.function?.type === 'HttpAction') {
    // Format HTTP actions
    const identifier = log.function.path || '';
    logType = identifier.startsWith('GET') ? 'GET' : 
              identifier.startsWith('POST') ? 'POST' : 
              identifier.startsWith('PUT') ? 'PUT' : 
              identifier.startsWith('DELETE') ? 'DELETE' : 'H';
    
    // Extract path from identifier
    const path = identifier.split(' ')[1] || identifier;
    logDetails = path;
  } else if (log.function?.type === 'Query') {
    // Format queries
    logType = 'Q';
    logDetails = log.function.path || '';
  } else if (log.function?.type === 'Mutation') {
    // Format mutations
    logType = 'M';
    logDetails = log.function.path || '';
  } else if (log.function?.type === 'Action') {
    // Format actions
    logType = 'A';
    logDetails = log.function.path || '';
  } else {
    // Other log types
    logType = log.topic || '';
    logDetails = log.message || '';
  }

  // Determine status color
  const statusColor = log.status === 'success' ? 'text-green-400' :
                      log.status === 'error' ? 'text-red-400' :
                      'text-gray-400';
  
  // Format cached indicator
  const cachedIndicator = log.function?.cached ? '(cached)' : '';
  
  // Simplified format when detail panel is open
  if (isDetailPanelOpen) {
    // For simplified view, combine type and details for better context
    const isStandardLogType = logType === 'Q' || logType === 'M' || logType === 'A' || logType === 'GET' || logType === 'POST' || logType === 'PUT' || logType === 'DELETE';
    const logTypeDisplay = isStandardLogType ? logType : '';
    const logDetailsDisplay = isStandardLogType ? logDetails : logDetails;
      
    return (
      <div 
        style={style} 
        className={`px-4 py-2 ${mergedTheme.tableRow} hover:bg-[#1e1e1e] cursor-pointer border-b border-[#222222] bg-[#121212] flex items-center`}
        onClick={() => handleLogSelect(log)}
      >
        <div className="flex items-center">
          <div className="text-xs text-gray-400 w-48 font-mono">{timestamp}</div>
          <div className="text-xs text-white flex-1 font-mono truncate">
            <span className="border p-1 bg-[#2a2a2a] rounded">{logTypeDisplay}</span> {logDetailsDisplay}
          </div>
        </div>
      </div>
    );
  }
  
  // Full format when detail panel is closed
  return (
    <div 
      style={style} 
      className={`px-4 py-2 flex flex-col ${mergedTheme.tableRow} hover:bg-[#1e1e1e] cursor-pointer border-b border-[#222222] bg-[#121212]`}
      onClick={() => handleLogSelect(log)}
    >
      <div className="flex items-center gap-2">
        <div className="text-xs text-gray-400 w-48 font-mono">{timestamp}</div>
        <div className="text-xs text-blue-400 w-24 font-mono truncate">{requestId.substring(0, 8)}</div>
        <div className={`text-xs ${statusColor} w-16`}>
          {log.status === 'success' && <span className="text-green-400">success</span>}
          {!log.status && cachedIndicator && <span className="text-gray-500">{cachedIndicator}</span>}
        </div>
        <div className="text-xs text-purple-400 w-24">{executionTime}</div>
        <div className="text-xs text-blue-400 w-12">{logType}</div>
        <div className="text-xs text-white flex-1 font-mono truncate flex items-center gap-2">
          <span>{logDetails}</span>
          {log.raw && log.raw.logLines && log.raw.logLines.length > 0 && (
            <div className="relative group">
              <InfoIcon className="h-4 w-4 text-gray-400 hover:text-gray-300" />
              <div className="absolute left-0 mt-2 w-96 bg-[#1e1e1e] border border-[#333333] rounded p-2 invisible group-hover:visible z-50">
                {log.raw.logLines.map((line: string, i: number) => (
                  <div key={i} className="text-xs text-gray-400 font-mono truncate">{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

LogRow.displayName = 'LogRow';

export default LogRow; 