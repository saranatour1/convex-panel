import React, { useState, useEffect } from 'react';
import { clearAllStorage, getStorageItem, STORAGE_KEYS } from '../utils/storage';
import { FilterExpression } from '../types';

interface StorageDebugProps {
  visible?: boolean;
  selectedTable?: string;
  filters?: FilterExpression;
}

const StorageDebug: React.FC<StorageDebugProps> = ({ 
  visible = false, 
  selectedTable = '',
  filters
}) => {
  if (!visible && process.env.NODE_ENV === 'production') return null;
  
  // Add state to force re-render
  const [, setForceUpdate] = useState(0);
  
  // Force re-render when filters change
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [filters]);
  
  const handleClearStorage = () => {
    clearAllStorage();
    window.location.reload();
  };
  
  // Get fresh data from storage each render
  const activeTable = getStorageItem(STORAGE_KEYS.ACTIVE_TABLE, '');
  const tableFilters = getStorageItem<Record<string, FilterExpression>>(STORAGE_KEYS.TABLE_FILTERS, {});
  
  return (
    <div className="convex-panel-storage-debug">
      <details>
        <summary className="convex-panel-debug-summary">Storage Debug</summary>
        <div className="convex-panel-debug-content">
          <div>
            <strong>Active Table:</strong> {activeTable || 'none'}
          </div>
          <div className="convex-panel-debug-section">
            <strong>Table Filters:</strong>
            <pre className="convex-panel-debug-pre">
              {JSON.stringify(tableFilters, null, 2)}
            </pre>
          </div>
          {selectedTable && tableFilters[selectedTable] && (
            <div className="convex-panel-debug-current-table">
              <strong>Current Table Filters:</strong>
              <pre className="convex-panel-debug-pre">
                {JSON.stringify(tableFilters[selectedTable], null, 2)}
              </pre>
            </div>
          )}
          <button
            onClick={handleClearStorage}
            className="convex-panel-debug-clear-button"
          >
            Clear All Storage
          </button>
        </div>
      </details>
    </div>
  );
};

export default StorageDebug; 