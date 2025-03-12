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
    <div className="convex-panel-active-filters">
      {filters.clauses.map((filter, index) => (
        <div 
          key={`${filter.field}-${index}`}
          className={`convex-panel-filter-tag ${theme?.input}`}
          onClick={(e) => {
            handleEditClick(e, filter.field)
          }}
        >
          <span>
            <span className="convex-panel-filter-field">{filter.field}</span>
            {' '}
            <span className="convex-panel-filter-operator">{filter.op}</span>
            {' '}
            <span className="convex-panel-filter-value">{JSON.stringify(filter.value)}</span>
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onRemove) {
                onRemove(filter.field);
              }
            }}
            className="convex-panel-filter-remove-button"
            title="Remove filter"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="convex-panel-filter-remove-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      
      <button
        onClick={(e) => {
          onClearAll();
        }}
        className={`convex-panel-clear-filters-button ${theme?.input}`}
        title="Clear all filters"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="convex-panel-clear-filters-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Clear all
      </button>
    </div>
  );
};

export default ActiveFilters; 