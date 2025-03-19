import React, { useState, useEffect } from 'react';
import { FilterDebugProps } from '../../types';

const FilterDebug: React.FC<FilterDebugProps> = ({ filters, selectedTable }) => {
  if (process.env.NODE_ENV === 'production' || !selectedTable) return null;
  
  // Add state to force re-render
  const [, setForceUpdate] = useState(0);
  
  // Force re-render when filters change
  useEffect(() => {
    setForceUpdate((prev: number) => prev + 1);
  }, [filters]);
  
  return (
    <div className="convex-panel-filter-debug">
      <details>
        <summary className="convex-panel-debug-summary">Debug Filters</summary>
        <pre className="convex-panel-debug-pre">
          {JSON.stringify(filters, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default FilterDebug; 