import React, { useState, useEffect } from 'react';
import { clearAllStorage, getStorageItem } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/constants';
import { FilterExpression, StorageDebugProps } from '../../types';

const StorageDebug: React.FC<StorageDebugProps> = ({ 
  /**
   * Whether the storage debug panel is visible.
   * Controls the rendering of the debug panel.
   * @default false
   */
  visible = false, 

  /**
   * The currently selected table.
   * Used to display filters for the selected table.
   * @default ''
   */
  selectedTable = '',

  /**
   * The current filter expression.
   * Used to force re-render when filters change.
   */
  filters
}) => {
  /**
   * If the debug panel is not visible and the environment is production,
   * return null to prevent rendering.
   */
  if (!visible && process.env.NODE_ENV === 'production') return null;
  
  /**
   * State to force re-render when filters change.
   */
  const [, setForceUpdate] = useState(0);
  
  /**
   * Force re-render when filters change.
   */
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [filters]);
  
  /**
   * Handle clear storage.
   */
  const handleClearStorage = () => {
    clearAllStorage();
    window.location.reload();
  };
  
  /**
   * Get fresh data from storage each render.
   */
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