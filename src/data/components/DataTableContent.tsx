import React, { useState, useRef, useEffect } from 'react';
import { DataTableContentProps, FilterClause, SortConfig, SortDirection } from '../../types';
import FilterMenu from './FilterMenu';
import { SortIcon, FilterIcon } from '../../components/icons';

const FilterIconWithState = ({ isActive }: { isActive: boolean }) => {
  return (
    <span className={`convex-panel-filter-icon ${isActive ? 'active' : ''}`}>
      <FilterIcon />
    </span>
  );
};

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
  tableName,
  
  /**
   * The currently selected document.
   * Used to highlight the selected row.
   */
  selectedDocument,
  
  /**
   * Callback to set the selected document.
   * Called when a row is clicked.
   */
  setSelectedDocument,

  /**
   * The current sort configuration.
   * Used to determine which column is sorted and in which direction.
   */
  sortConfig,
  
  /**
   * Callback function for sorting.
   * Called when a column header is clicked for sorting.
   * @param field The field to sort by
   */
  onSort
}) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
   * Handle row click to select a document
   */
  const handleRowClick = (doc: any) => {
    if (editingCell) return; // Don't select row if we're editing a cell
    
    if (selectedDocument && selectedDocument._id === doc._id) {
      // If clicking on already selected row, deselect it
      setSelectedDocument(null);
    } else {
      // Otherwise select the row
      setSelectedDocument(doc);
    }
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
   * Get sort direction for a column
   */
  const getSortDirection = (field: string): SortDirection | null => {
    if (!sortConfig || sortConfig.field !== field) {
      return null;
    }
    return sortConfig.direction;
  };
  
  /**
   * Handle column header click for sorting
   */
  const handleHeaderClick = (field: string): void => {
    if (onSort) {
      // Apply visual feedback immediately
      onSort(field);
    }
  };

  // Connect the observer to our loadMoreRef
  useEffect(() => {
    if (loadMoreRef.current && observerTarget) {
      observerTarget(loadMoreRef.current);
    }
  }, [observerTarget]);

  return (
    <>
      <div className="convex-panel-table-wrapper">
        {isLoading && documents.length === 0 ? (
          <div className="convex-panel-table-footer">
            <p className="convex-panel-loading-message">Loading data...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="convex-panel-table-footer">
            <p className="convex-panel-empty-message">No documents found in this table</p>
          </div>
        ) : (
          <>
            <table className="convex-panel-data-table" ref={tableRef}>
              <thead>
                <tr className="convex-panel-table-header-row">
                  {columnHeaders.map((header, index) => {
                    const sortDirection = getSortDirection(header);
                    const isSorted = sortDirection !== null;
                    return (
                      <th 
                        key={header} 
                        className={`convex-panel-column-header ${isSorted ? 'convex-panel-header-sorted' : ''} ${header === '_id' ? 'convex-panel-id-column' : ''}`}
                        style={{ 
                          backgroundColor: isSorted ? '#2a2a2a' : 
                                          hoveredHeader === index ? '#333' : undefined,
                          position: 'relative',
                          width: header === '_id' ? '220px' : 'auto'
                        }}
                        onMouseEnter={() => setHoveredHeader(index)}
                        onMouseLeave={() => setHoveredHeader(null)}
                      >
                        <div className="convex-panel-header-content">
                          <div 
                            className="convex-panel-header-label"
                            style={{ 
                              fontWeight: 'bold', 
                              display: 'flex', 
                              alignItems: 'center', 
                              cursor: 'pointer',
                              minHeight: '20px',
                              marginRight: '4px'
                            }}
                            onClick={() => handleHeaderClick(header)}
                          >
                            {header}
                            <SortIcon direction={sortDirection} isHovered={hoveredHeader === index} />
                          </div>
                          {(hoveredHeader === index || hasActiveFilter(header)) && (
                            <button
                              onClick={(e) => onFilterButtonClick(e, header)}
                              className="convex-panel-filter-button"
                              style={{ marginLeft: 'auto' }}
                              title={hasActiveFilter(header) ? "Edit filter" : "Add filter"}
                            >
                              <FilterIconWithState isActive={hasActiveFilter(header)} />
                            </button>
                          )}

                          {/* Original conditional rendering with improved styling */}
                          {filterMenuField === header && filterMenuPosition && (
                            <div 
                              style={{ 
                                position: 'absolute', 
                                zIndex: 1000,
                                top: '30px',
                                left: '0',
                                minWidth: '300px',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
                              }}
                            >
                              <FilterMenu
                                field={header}
                                position={{ top: 0, left: 0 }}
                                onApply={(filter) => {
                                  handleFilterApply(filter);
                                  onFilterMenuClose();
                                }}
                                onClose={() => {
                                  onFilterMenuClose();
                                }}
                                existingFilter={getExistingFilter(header)}
                              />
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const docId = doc._id?.toString() || '';
                  const isSelected = selectedDocument && selectedDocument._id === docId;
                  
                  return (
                    <tr 
                      key={docId} 
                      className={`convex-panel-table-row ${isSelected ? 'convex-panel-selected-row' : ''}`}
                      onClick={() => handleRowClick(doc)}
                    >
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
                            onDoubleClick={(e) => {
                              e.stopPropagation(); // Prevent row selection on double click
                              handleCellDoubleClick(doc, header);
                            }}
                          >
                            {isEditing ? (
                              <input
                                ref={inputRef}
                                className="convex-panel-cell-edit-input"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleInputKeyDown(e, docId, header)}
                                onBlur={() => handleSaveEdit(docId, header, editValue)}
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
            </table>
            
            {/* Intersection observer target */}
            <div ref={loadMoreRef} className="convex-panel-observer-target">
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
    </>
  );
};

export default DataTableContent; 