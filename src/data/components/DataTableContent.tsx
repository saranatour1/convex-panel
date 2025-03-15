import React, { useState, useRef, useEffect } from 'react';
import { DataTableContentProps, FilterClause } from '../../types';
import FilterMenu from './FilterMenu';
import { FilterIcon } from '../../components/icons';

const DataTableContent: React.FC<DataTableContentProps> = ({
  /**
   * Array of document objects to be displayed in the table.
   * Each document represents a row in the table.
   * @required
   */
  documents,

  /**
   * Array of column header strings.
   * Used to define the columns of the table.
   * @required
   */
  columnHeaders,

  /**
   * Loading state for the table data.
   * Indicates whether the table data is currently being loaded.
   * @required
   */
  isLoading,

  /**
   * Indicates if there are more documents to load.
   * Used for infinite scrolling or pagination.
   * @required
   */
  hasMore,

  /**
   * Loading state for additional data.
   * Indicates whether more data is currently being loaded.
   * @required
   */
  isLoadingMore,

  /**
   * Target element for the intersection observer.
   * Used to detect when more data should be loaded.
   * @required
   */
  observerTarget,

  /**
   * Callback function for filter button click.
   * Called when the filter button is clicked.
   * @param field The field to filter
   */
  onFilterButtonClick,

  /**
   * Field name for the filter menu.
   * Used to determine which field is being filtered.
   * @required
   */
  filterMenuField,

  /**
   * Position of the filter menu.
   * Used to position the filter menu relative to the table.
   * @required
   */
  filterMenuPosition,

  /**
   * Callback function to apply filters.
   * Called when filters are applied.
   * @param filters The applied filters
   */
  handleFilterApply,

  /**
   * Callback function to close the filter menu.
   * Called when the filter menu is closed.
   */
  onFilterMenuClose,

  /**
   * Function to format cell values.
   * Used to format the values displayed in the table cells.
   * @param value The value to format
   * @returns The formatted value
   */
  formatValue,

  /**
   * Active filters applied to the table.
   * Used to filter the table data.
   * @required
   */
  activeFilters,

  /**
   * Callback function to update a document.
   * Called when a document is updated.
   * @param docId The ID of the document to update
   * @param field The field to update
   * @param value The new value
   */
  onUpdateDocument,

  /**
   * The name of the table.
   * Used to identify the table being displayed.
   * @required
   */
  tableName
}) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [hoveredHeader, setHoveredHeader] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{docId: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [updatingCells, setUpdatingCells] = useState<{[key: string]: boolean}>({});
  
  /**
   * Focus the input element when editing starts
   */
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at the end of text
      inputRef.current.selectionStart = inputRef.current.value.length;
      inputRef.current.selectionEnd = inputRef.current.value.length;
    }
  }, [editingCell]);
  
  /**
   * Find existing filter for a column
   */
  const getExistingFilter = (field: string): FilterClause | undefined => {
    return activeFilters.clauses.find(clause => clause.field === field);
  };
  
  /**
   * Check if a column has an active filter
   */
  const hasActiveFilter = (header: string) => {
    return activeFilters.clauses.some((filter) => filter.field === header);
  };

  /**
   * Handle double click on a cell to enter edit mode
   */
  const handleCellDoubleClick = (doc: any, header: string) => {
    // Don't allow editing _id fields, fields that end with Id, or fields that start with _
    if (header === '_id' || header === 'userId' || header.endsWith('Id') || header.startsWith('_')) {
      return;
    }
    
    const docId = doc._id;
    if (!docId) return;
    
    setEditingCell({ docId, field: header });
    setEditValue(doc[header]?.toString() || '');
  };

  /**
   * Handle saving the edited cell value
   */
  const handleSaveEdit = async (docId: string, field: string, newValue: string) => {
    if (!docId || !field || !tableName || !onUpdateDocument) return;
    
    const cellKey = `${docId}-${field}`;
    setUpdatingCells(prev => ({ ...prev, [cellKey]: true }));
    
    try {
      // Find the document and get the original value to determine its type
      const document = documents.find(doc => doc._id === docId);
      if (!document) {
        throw new Error(`Document with ID ${docId} not found`);
      }
      
      const originalValue = document[field];
      let parsedValue: any = newValue;
      
      // Convert the edited value to the appropriate type based on the original value
      if (typeof originalValue === 'number') {
        parsedValue = parseFloat(newValue) || 0;
      } else if (typeof originalValue === 'boolean') {
        parsedValue = newValue.toLowerCase() === 'true';
      } else if (originalValue === null) {
        parsedValue = null;
      } else if (Array.isArray(originalValue)) {
        try {
          parsedValue = JSON.parse(newValue);
          if (!Array.isArray(parsedValue)) {
            parsedValue = [parsedValue];
          }
        } catch (e) {
          // If parsing fails, treat as a single-item array with the string
          parsedValue = [newValue];
        }
      } else if (originalValue !== undefined && typeof originalValue === 'object') {
        try {
          parsedValue = JSON.parse(newValue);
        } catch (e) {
          // If parsing fails, keep as string
          console.warn('Could not parse JSON:', e);
        }
      }
      
      // Call the API to update the document
      await onUpdateDocument({
        table: tableName,
        ids: [docId],
        fields: { [field]: parsedValue }
      });
      
      // Clear editing state after successful update
      setEditingCell(null);
    } catch (error) {
      console.error('Failed to update document:', error);
    } finally {
      setUpdatingCells(prev => ({ ...prev, [cellKey]: false }));
    }
  };

  /**
   * Handle key press in edit input
   */
  const handleInputKeyDown = (e: React.KeyboardEvent, docId: string, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(docId, field, editValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
    }
  };

  /**
   * Handle clicking outside of an editing cell
   */
  const handleClickOutside = (e: React.MouseEvent) => {
    if (editingCell && inputRef.current && !inputRef.current.contains(e.target as Node)) {
      handleSaveEdit(editingCell.docId, editingCell.field, editValue);
    }
  };

  return (
    <div className="convex-panel-table-wrapper" onClick={handleClickOutside}>
      <table className="convex-panel-data-table" ref={tableRef}>
        <thead>
          <tr className="convex-panel-table-header-row">
            <th className="convex-panel-checkbox-header">
              <input type="checkbox" className="convex-panel-checkbox" disabled />
            </th>
            {columnHeaders.map((header, index) => (
              <th 
                key={index} 
                className={`convex-panel-column-header`}
                style={{ backgroundColor: hoveredHeader === index ? '#333' : 'transparent' }}
                onMouseEnter={() => setHoveredHeader(index)}
                onMouseLeave={() => setHoveredHeader(null)}
              >
                <div className="convex-panel-header-content">
                  <span style={{ fontStyle: 'bold' }}>
                    {header}
                  </span>
                  <button
                    onClick={(e) => {
                      onFilterButtonClick(e, header);
                    }}
                    className="convex-panel-filter-button"
                    style={{ visibility: hoveredHeader === index || filterMenuField === header ? 'visible' : 'hidden' }}
                    title={hasActiveFilter(header) ? "Edit filter" : "Add filter"}
                  >
                    <FilterIcon />
                  </button>
                  {filterMenuField === header && filterMenuPosition && (
                    <FilterMenu
                      field={header}
                      position={filterMenuPosition}
                      onApply={(filter) => {
                        handleFilterApply(filter);
                        onFilterMenuClose();
                      }}
                      onClose={onFilterMenuClose}
                      existingFilter={getExistingFilter(header)}
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        {documents.length > 0 && (
          <tbody>
            {documents.map((doc, rowIndex) => {
              const docId = doc._id?.toString() || '';
              
              return (
                <tr 
                  key={docId || rowIndex} 
                  className="convex-panel-table-row"
                >
                  <td className="convex-panel-checkbox-cell">
                    <input type="checkbox" className="convex-panel-checkbox" />
                  </td>
                  {columnHeaders.map(header => {
                    const value = doc[header];
                    const isId = header === '_id' || header === 'userId' || header.endsWith('Id');
                    const isEditing = editingCell && 
                                     editingCell.docId === docId && 
                                     editingCell.field === header;
                    const isUpdating = updatingCells[`${docId}-${header}`];
                    const cellClassName = `convex-panel-table-cell ${isEditing ? 'editing' : ''} ${isUpdating ? 'updating' : ''}`;
                    
                    return (
                      <td 
                        key={`${docId}-${header}`} 
                        className={cellClassName}
                        onDoubleClick={() => handleCellDoubleClick(doc, header)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            className="convex-panel-cell-edit-input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleInputKeyDown(e, docId, header)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : isId ? (
                          <span className="convex-panel-id-value">
                            {formatValue(value, header)}
                          </span>
                        ) : (
                          <span 
                            className={`${value === undefined ? "convex-panel-empty-value" : ""} ${!isId ? "convex-panel-editable-cell" : ""}`}
                            title={!isId ? "Double-click to edit" : ""}
                          >
                            {isUpdating ? 'Saving...' : formatValue(value, header)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        )}
      </table>
      
      {/* Loading and end of content indicators */}
      {isLoading && documents.length === 0 ? (
        <div className="convex-panel-table-footer">
          <p className="convex-panel-loading-message">Loading data...</p>
        </div>
      ) : !documents.length ? (
        <div className="convex-panel-table-footer">
          <p className="convex-panel-empty-message">No documents found in this table</p>
        </div>
      ) : (
        <>
          {/* Intersection observer target */}
          <div ref={observerTarget} className="convex-panel-observer-target">
            {isLoadingMore ? (
              <p className="convex-panel-loading-more-message">Loading more...</p>
            ) : hasMore ? (
              <p className="convex-panel-has-more-message">Scroll down to load more</p>
            ) : (
              <p className="convex-panel-end-message">End of table data</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DataTableContent; 