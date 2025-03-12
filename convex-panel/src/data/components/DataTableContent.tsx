

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
    <div className="min-w-max">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-neutral-800">
            <th className="sticky left-0 z-10 bg-neutral-800 w-8 p-2">
              <input type="checkbox" className="rounded" disabled />
            </th>
            {columnHeaders.map(header => (
              <th 
                key={header} 
                className="text-left p-2 font-medium border-r border-neutral-700 min-w-[150px]"
                onMouseEnter={() => setHoveredHeader(header)}
                onMouseLeave={() => setHoveredHeader(null)}
              >
                <div className="flex items-center gap-2">
                  <span>{header}</span>
                  <button
                    onClick={(e) => onFilterButtonClick(e, header)}
                    className={`p-1 rounded filter-menu-button ${
                      hasActiveFilter(header) 
                        ? 'hover:bg-[#3f529599] bg-[#3f5295]' 
                        : hoveredHeader === header
                          ? 'bg-neutral-700 hover:bg-neutral-600'
                          : 'hover:bg-neutral-700 opacity-0 group-hover:opacity-100'
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
                className="border-b border-neutral-700 hover:bg-neutral-800"
              >
                <td className="sticky left-0 z-10 bg-neutral-800 p-2 text-center">
                  <input type="checkbox" className="rounded" />
                </td>
                {columnHeaders.map(header => {
                  const value = doc[header];
                  const isId = header === '_id' || header === 'userId' || header.endsWith('Id');
                  
                  return (
                    <td key={`${doc._id}-${header}`} className="p-2 border-r border-neutral-700">
                      {isId ? (
                        <span className="text-blue-400 cursor-pointer">
                          {formatValue(value)}
                        </span>
                      ) : (
                        <span className={value === undefined ? "text-neutral-500 italic" : ""}>
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
      <div className="py-4 text-center text-sm">
        {isLoading && documents.length === 0 ? (
          <p className="text-neutral-400">Loading data...</p>
        ) : !documents.length ? (
          <p className="text-neutral-400">No documents found in this table</p>
        ) : (
          <>
            {/* Intersection observer target */}
            <div ref={observerTarget} className="h-8 flex items-center justify-center">
              {isLoadingMore ? (
                <p className="text-neutral-400">Loading more...</p>
              ) : hasMore ? (
                <p className="text-neutral-400">Scroll for more</p>
              ) : (
                <p className="text-neutral-400">End of documents</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataTableContent; 