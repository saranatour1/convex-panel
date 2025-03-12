import React from 'react';
import { DataTableSidebarProps } from '../types';

const DataTableSidebar: React.FC<DataTableSidebarProps> = ({
  tables,
  selectedTable,
  searchText,
  onSearchChange,
  onTableSelect,
  isSidebarCollapsed,
  onToggleSidebar,
  theme = {}
}) => {
  // Store sidebar state in localStorage when it changes
  React.useEffect(() => {
    localStorage.setItem('datatable-sidebar-collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const filteredTables = Object.keys(tables).filter(tableName =>
    tableName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div 
      className={`convex-panel-sidebar ${
        isSidebarCollapsed ? 'convex-panel-sidebar-collapsed' : 'convex-panel-sidebar-expanded'
      }`}
    >
      <div className={`convex-panel-sidebar-header ${isSidebarCollapsed ? 'convex-panel-sidebar-header-collapsed' : 'convex-panel-sidebar-header-expanded'}`}>
        {!isSidebarCollapsed ? (
          <>
            <div className="convex-panel-sidebar-title-container">
              <div className="convex-panel-sidebar-title-wrapper">
                <h3 className="convex-panel-sidebar-title">Tables</h3>
                <button
                  onClick={onToggleSidebar}
                  className="convex-panel-sidebar-toggle-button"
                >
                  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M6 3.5H13M6 7.5H13M6 11.5H13M4 3.5L2 5.5L4 7.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search tables..."
              className={`convex-panel-sidebar-search ${theme?.input}`}
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </>
        ) : (
          <button
            onClick={onToggleSidebar}
            className="convex-panel-sidebar-expand-button"
          >
            <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
              d="M9 3.5H2M9 7.5H2M9 11.5H2M11 3.5L13 5.5L11 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="convex-panel-sidebar-content">
        {filteredTables.map(tableName => (
          <button
            key={tableName}
            className={`convex-panel-sidebar-table-button ${
              selectedTable === tableName ? 'convex-panel-sidebar-table-selected' : 'convex-panel-sidebar-table-unselected'
            } ${isSidebarCollapsed ? 'convex-panel-sidebar-table-collapsed' : ''}`}
            onClick={() => onTableSelect(tableName)}
            title={tableName}
          >
            {isSidebarCollapsed ? tableName.charAt(0).toUpperCase() : tableName}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DataTableSidebar; 