

import React from 'react';
import { clearAllStorage, getStorageItem, STORAGE_KEYS } from '../utils/storage';
import { FilterExpression } from '../types';

interface StorageDebugProps {
  visible?: boolean;
  selectedTable?: string;
}

const StorageDebug: React.FC<StorageDebugProps> = ({ visible = false, selectedTable = '' }) => {
  if (!visible && process.env.NODE_ENV === 'production') return null;
  
  const handleClearStorage = () => {
    clearAllStorage();
    window.location.reload();
  };
  
  const activeTable = getStorageItem(STORAGE_KEYS.ACTIVE_TABLE, '');
  const tableFilters = getStorageItem<Record<string, FilterExpression>>(STORAGE_KEYS.TABLE_FILTERS, {});
  
  return (
    <div className="p-2 border-t border-neutral-700 text-xs font-mono">
      <details>
        <summary className="cursor-pointer text-neutral-400">Storage Debug</summary>
        <div className="mt-2 text-neutral-300">
          <div>
            <strong>Active Table:</strong> {activeTable || 'none'}
          </div>
          <div className="mt-1">
            <strong>Table Filters:</strong>
            <pre className="mt-1 text-xs overflow-auto max-h-40">
              {JSON.stringify(tableFilters, null, 2)}
            </pre>
          </div>
          {selectedTable && tableFilters[selectedTable] && (
            <div className="mt-1 p-2 border border-blue-700 rounded bg-blue-900 bg-opacity-20">
              <strong>Current Table Filters:</strong>
              <pre className="mt-1 text-xs overflow-auto max-h-40">
                {JSON.stringify(tableFilters[selectedTable], null, 2)}
              </pre>
            </div>
          )}
          <button
            onClick={handleClearStorage}
            className="mt-2 px-2 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs"
          >
            Clear All Storage
          </button>
        </div>
      </details>
    </div>
  );
};

export default StorageDebug; 