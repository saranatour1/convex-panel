

import React from 'react';
import { FilterDebugProps } from '../types';

const FilterDebug: React.FC<FilterDebugProps> = ({ filters, selectedTable }) => {
  if (process.env.NODE_ENV === 'production' || !selectedTable) return null;
  
  return (
    <div className="p-2 border-t border-neutral-700 text-xs font-mono">
      <details>
        <summary className="cursor-pointer text-neutral-400">Debug Filters</summary>
        <pre className="mt-2 text-neutral-300">
          {JSON.stringify(filters, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default FilterDebug; 