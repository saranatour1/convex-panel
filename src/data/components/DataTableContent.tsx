import React, { useState } from 'react';
import { DataTableContentProps, FilterClause } from '../types';
import FilterMenu from './FilterMenu';

const DataTableContent: React.FC<DataTableContentProps> = ({
  documents,
  columnHeaders,
  isLoading,
  hasMore,
  isLoadingMore,
  observerTarget,
  onFilterButtonClick,
  filterMenuField,
  filterMenuPosition,
  handleFilterApply,
  onFilterMenuClose,
  formatValue,
  activeFilters
}) => {
  const [hoveredHeader, setHoveredHeader] = useState<string | null>(null);
  
  // Find existing filter for a column
  const getExistingFilter = (field: string): FilterClause | undefined => {
    return activeFilters.clauses.find(clause => clause.field === field);
  };
  
  // Check if a column has an active filter
  const hasActiveFilter = (header: string) => {
    return activeFilters.clauses.some((filter) => filter.field === header);
  };

  return (
    <div className="convex-panel-table-wrapper">
      <table className="convex-panel-data-table">
        <thead>
          <tr className="convex-panel-table-header-row">
            <th className="convex-panel-checkbox-header">
              <input type="checkbox" className="convex-panel-checkbox" disabled />
            </th>
            {columnHeaders.map(header => (
              <th 
                key={header} 
                className="convex-panel-column-header"
                onMouseEnter={() => setHoveredHeader(header)}
                onMouseLeave={() => setHoveredHeader(null)}
              >
                <div className="convex-panel-header-content">
                  <span style={{ fontStyle: 'bold' }}>{header}</span>
                  <button
                    onClick={(e) => onFilterButtonClick(e, header)}
                    className={`convex-panel-filter-button ${
                      hoveredHeader === header
                        ? 'convex-panel-filter-hovered'
                        : 'convex-panel-filter-hidden'
                    }`}
                    title={hasActiveFilter(header) ? "Edit filter" : "Add filter"}
                  >
                    <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M1 1L6 8V13L9 14V8L14 1H1Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
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
            {documents.map((doc, rowIndex) => (
              <tr 
                key={doc._id || rowIndex} 
                className="convex-panel-table-row"
              >
                <td className="convex-panel-checkbox-cell">
                  <input type="checkbox" className="convex-panel-checkbox" />
                </td>
                {columnHeaders.map(header => {
                  const value = doc[header];
                  const isId = header === '_id' || header === 'userId' || header.endsWith('Id');
                  
                  return (
                    <td key={`${doc._id}-${header}`} className="convex-panel-table-cell">
                      {isId ? (
                        <span className="convex-panel-id-value">
                          {formatValue(value)}
                        </span>
                      ) : (
                        <span className={value === undefined ? "convex-panel-empty-value" : ""}>
                          {formatValue(value)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        )}
      </table>
      
      {/* Loading and end of content indicators */}
      <div className="convex-panel-table-footer">
        {isLoading && documents.length === 0 ? (
          <p className="convex-panel-loading-message">Loading data...</p>
        ) : !documents.length ? (
          <p className="convex-panel-empty-message">No documents found in this table</p>
        ) : (
          <>
            {/* Intersection observer target */}
            <div ref={observerTarget} className="convex-panel-observer-target">
              {isLoadingMore ? (
                <p className="convex-panel-loading-more-message">Loading more...</p>
              ) : hasMore ? (
                <p className="convex-panel-scroll-message">Scroll for more</p>
              ) : (
                <p className="convex-panel-end-message">End of documents</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataTableContent; 