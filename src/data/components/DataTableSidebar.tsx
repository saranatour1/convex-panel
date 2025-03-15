import React, { useEffect } from 'react';
import { DataTableSidebarProps } from '../../types';
import { STORAGE_KEYS } from '../../utils/constants';
import { PanelCollapseIcon, PanelExpandIcon } from '../../components/icons';

const DataTableSidebar: React.FC<DataTableSidebarProps> = ({
  /**
   * A collection of tables available for selection.
   * Used to display the list of tables in the sidebar.
   * @required
   */
  tables,

  /**
   * The currently selected table.
   * Used to highlight the active table in the sidebar.
   * @required
   */
  selectedTable,

  /**
   * The current search text for filtering tables.
   * Used to filter the list of tables based on user input.
   * @required
   */
  searchText,

  /**
   * Callback function to handle search text changes.
   * Called when the user types in the search input.
   * Receives the new search text as a parameter.
   * @param searchText string
   */
  onSearchChange,

  /**
   * Callback function to handle table selection.
   * Called when the user selects a table from the list.
   * Receives the selected table name as a parameter.
   * @param tableName string
   */
  onTableSelect,

  /**
   * Whether the sidebar is collapsed.
   * Controls the collapsed or expanded state of the sidebar.
   * @required
   */
  isSidebarCollapsed,

  /**
   * Callback function to toggle the sidebar state.
   * Called when the user clicks the toggle button.
   */
  onToggleSidebar,

  /**
   * Theme customization object to override default styles.
   * Supports customizing colors, spacing, and component styles.
   * See ThemeClasses interface for available options.
   * @default {}
   */
  theme = {}
}) => {
  /**
   * Save sidebar state in localStorage
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  /**
   * Filtered tables
   */
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
                  <PanelCollapseIcon />
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
            <PanelExpandIcon />
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