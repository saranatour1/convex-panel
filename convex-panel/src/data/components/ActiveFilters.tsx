

import React, { useCallback } from 'react';
import { ActiveFiltersProps } from '../types';

const ActiveFilters: React.FC<ActiveFiltersProps> = ({ 
  filters, 
  onRemove, 
  onClearAll, 
  selectedTable, 
  theme,
  onEdit
}) => {
  // Only show filters if there are any and we have a selected table
  if (!selectedTable || filters.clauses.length === 0) return null;

  // Handle edit click
  const handleEditClick = useCallback((e: React.MouseEvent, field: string) => {
    if (onEdit) {
      e.stopPropagation();
      onEdit(e, field);
    }
  }, [onEdit]);

  return (
    <div className="flex flex-wrap gap-2 w-full">
      {filters.clauses.map((filter, index) => (
        <div 
          key={`${filter.field}-${index}`}
          className={`px-3 py-1.5 rounded-md hover:bg-[#3a3a3a90] transition-colors text-xs flex items-center ${theme?.input}`}
          onClick={(e) => {
            handleEditClick(e, filter.field)
          }}
        >
          <span>
            <span className="font-semibold border-r border-neutral-700 pr-2">{filter.field}</span>
            {' '}
            <span className="opacity-80 font-mono border-r border-neutral-700 px-2">{filter.op}</span>
            {' '}
            <span className="font-mono pl-2">{JSON.stringify(filter.value)}</span>
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onRemove) {
                onRemove(filter.field);
                setTimeout(() => {
                  const forceUpdate = new Event('forceUpdate');
                  window.dispatchEvent(forceUpdate);
                }, 0);
              }
            }}
            className="ml-2 hover:text-red-300 text-red-500 bg-neutral-800 rounded-md"
            title="Remove filter"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      
      <button
        onClick={(e) => {
          onClearAll();
          setTimeout(() => {
            const forceUpdate = new Event('forceUpdate');
            window.dispatchEvent(forceUpdate);
          }, 0);
        }}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-[#3a3a3a90] transition-colors text-xs ml-auto ${theme?.input}`}
        title="Clear all filters"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Clear all
      </button>
    </div>
  );
};

export default ActiveFilters; 