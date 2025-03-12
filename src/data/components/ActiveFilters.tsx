import React, { useCallback, useMemo, memo } from 'react';
import { ActiveFiltersProps, FilterClause } from '../types';

const FilterTag = memo(({ 
  filter, 
  theme, 
  onRemove, 
  onEdit 
}: { 
  filter: FilterClause; 
  theme?: any; 
  onRemove: (field: string) => void;
  onEdit: (e: React.MouseEvent, field: string) => void;
}) => {
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(filter.field);
  }, [filter.field, onRemove]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(e, filter.field);
  }, [filter.field, onEdit]);

  const displayValue = useMemo(() => {
    if (filter.op === 'isType' || filter.op === 'isNotType') {
      return filter.value;
    }
    return JSON.stringify(filter.value);
  }, [filter.op, filter.value]);

  const displayOperator = useMemo(() => {
    switch (filter.op) {
      case 'eq': return '=';
      case 'neq': return '≠';
      case 'gt': return '>';
      case 'gte': return '≥';
      case 'lt': return '<';
      case 'lte': return '≤';
      case 'anyOf': return 'in';
      case 'noneOf': return 'not in';
      case 'isType': return 'is type';
      case 'isNotType': return 'is not type';
      default: return filter.op;
    }
  }, [filter.op]);

  return (
    <div 
      className={`convex-panel-filter-tag ${theme?.input}`}
      onClick={handleEdit}
    >
      <span>
        <span className="convex-panel-filter-field">{filter.field}</span>
        {' '}
        <span className="convex-panel-filter-operator">{displayOperator}</span>
        {' '}
        <span className="convex-panel-filter-value">{displayValue}</span>
      </span>
      <button
        onClick={handleRemove}
        className="convex-panel-filter-remove-button"
        title="Remove filter"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="convex-panel-filter-remove-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
});

FilterTag.displayName = 'FilterTag';

const ActiveFilters: React.FC<ActiveFiltersProps> = memo(({ 
  filters, 
  onRemove, 
  onClearAll, 
  selectedTable, 
  theme,
  onEdit
}) => {
  // Only show filters if there are any and we have a selected table
  if (!selectedTable || filters.clauses.length === 0) return null;

  const handleClearAll = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClearAll();
  }, [onClearAll]);

  return (
    <div className="convex-panel-active-filters">
      {filters.clauses.map((filter) => (
        <FilterTag
          key={`${filter.field}-${filter.op}-${JSON.stringify(filter.value)}`}
          filter={filter}
          theme={theme}
          onRemove={onRemove}
          onEdit={onEdit || (() => {})}
        />
      ))}
      
      <button
        onClick={handleClearAll}
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
});

ActiveFilters.displayName = 'ActiveFilters';

export default ActiveFilters; 