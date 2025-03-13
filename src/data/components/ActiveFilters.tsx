import React, { useCallback, memo } from 'react';
import { ActiveFiltersProps } from '../../types';
import FilterTag from './FilterTag';
import { TrashIcon } from 'src/components/icons';

const ActiveFilters: React.FC<ActiveFiltersProps> = memo(({ 
  /**
   * Array of filter clauses applied to the data.
   * Each clause represents a filter condition.
   * @required
   */
  filters, 

  /**
   * Callback function to remove a filter.
   * Called when the remove button is clicked.
   * @param field The field of the filter to remove
   * @required
   */
  onRemove, 

  /**
   * Callback function to clear all filters.
   * Called when the clear all button is clicked.
   * @required
   */
  onClearAll, 

  /**
   * The currently selected table.
   * Filters are only shown if a table is selected.
   * @required
   */
  selectedTable, 

  /**
   * Theme customization object to override default styles.
   * Supports customizing colors, spacing, and component styles.
   * @optional
   */
  theme,

  /**
   * Callback function to edit a filter.
   * Called when the filter tag is clicked.
   * @param e The mouse event
   * @param field The field of the filter to edit
   * @optional
   */
  onEdit
}) => {
  // Only show filters if there are any and we have a selected table
  if (!selectedTable || filters.clauses.length === 0) return null;

  /**
   * Handles the clearing of all filters.
   * Prevents default behavior and stops event propagation.
   * Calls the onClearAll callback.
   * @param e The mouse event
   * @required
   */
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
        <TrashIcon />
        Clear all
      </button>
    </div>
  );
});

ActiveFilters.displayName = 'ActiveFilters';

export default ActiveFilters; 