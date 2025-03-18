import React, { useCallback, useMemo, memo } from 'react';
import { FilterClause } from '../../types';
import { RedXIcon } from '../../components/icons';

const FilterTag = memo(({ 
  /**
   * The filter clause object.
   * Represents the filter applied to the data.
   * @required
   */
  filter, 

  /**
   * Theme customization object to override default styles.
   * Supports customizing colors, spacing, and component styles.
   * @optional
   */
  theme, 

  /**
   * Callback function to remove a filter.
   * Called when the remove button is clicked.
   * @param field The field of the filter to remove
   * @required
   */
  onRemove, 

  /**
   * Callback function to edit a filter.
   * Called when the filter tag is clicked.
   * @param e The mouse event
   * @param field The field of the filter to edit
   * @required
   */
  onEdit 
}: { 
  filter: FilterClause; 
  theme?: any; 
  onRemove: (field: string) => void;
  onEdit: (e: React.MouseEvent, field: string) => void;
}) => {
  /**
   * Handles the removal of a filter.
   * Prevents default behavior and stops event propagation.
   * Calls the onRemove callback with the filter's field.
   * @param e The mouse event
   * @required
   */
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Filter removed before:', filter.field);
    onRemove(filter.field);
    console.log('Filter removed after:', filter.field);
  }, [filter.field, onRemove]);

  /**
   * Handles the editing of a filter.
   * Prevents default behavior and stops event propagation.
   * Calls the onEdit callback with the filter's field.
   * @param e The mouse event
   * @required
   */
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(e, filter.field);
  }, [filter.field, onEdit]);

  /**
   * Displays the value of the filter.
   * @returns The value of the filter.
   * @required
   */
  const displayValue = useMemo(() => {
    if (filter.op === 'isType' || filter.op === 'isNotType') {
      return filter.value;
    }
    return JSON.stringify(filter.value);
  }, [filter.op, filter.value]);

  /**
   * Displays the operator of the filter.
   * @returns The operator of the filter.
   * @required
   */
  const displayOperator = useMemo(() => {
    switch (filter.op) {
      case 'eq': return '=';
      case 'neq': return '≠';
      case 'gt': return '>';
      case 'gte': return '≥';
      case 'lt': return '<';
      case 'lte': return '≤';
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
        <RedXIcon />
      </button>
    </div>
  );
});

FilterTag.displayName = 'FilterTag';

export default FilterTag;