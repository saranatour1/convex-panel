import React, { useEffect } from 'react';
import { DataTableSidebarProps, RecentlyViewedTable } from '../../types';
import { STORAGE_KEYS } from '../../utils/constants';
import { ChevronDownIcon, ChevronRightIcon, PanelCollapseIcon, PanelExpandIcon } from '../../components/icons';

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
  theme = {},
  
  /**
   * Recently viewed tables with timestamps
   * Used to display a list of recently accessed tables
   */
  recentlyViewedTables = []
}) => {
  // Add state for section collapse
  const [isRecentCollapsed, setIsRecentCollapsed] = React.useState(false);
  const [isAllTablesCollapsed, setIsAllTablesCollapsed] = React.useState(false);

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

  /**
   * Sort recently viewed tables by timestamp (most recent first)
   */
  const sortedRecentlyViewed = [...recentlyViewedTables]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5); // Limit to 5 most recent

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
        {!isSidebarCollapsed && sortedRecentlyViewed.length > 0 && (
          <div className="convex-panel-sidebar-recent-container">
            <div 
              className="convex-panel-sidebar-section-header"
              onClick={() => setIsRecentCollapsed(!isRecentCollapsed)}
              style={{ cursor: 'pointer' }}
            >
              <div className="convex-panel-sidebar-section-title">
                <span className="section-collapse-icon">
                  {isRecentCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
                </span>
                Recently Viewed
              </div>
            </div>
            {!isRecentCollapsed && (
              <>
                {sortedRecentlyViewed.map(table => (
                  <button
                    key={`recent-${table.name}`}
                    className={`convex-panel-sidebar-table-button ${
                      selectedTable === table.name ? 'convex-panel-sidebar-table-selected' : 'convex-panel-sidebar-table-unselected'
                    }`}
                    onClick={() => onTableSelect(table.name)}
                    title={`${table.name} (viewed ${new Date(table.timestamp).toLocaleString()})`}
                  >
                    {table.name}
                  </button>
                ))}
                <div className="convex-panel-sidebar-divider"></div>
              </>
            )}
          </div>
        )}
        
        {!isSidebarCollapsed && filteredTables.length > 0 && (
          <div className="convex-panel-sidebar-all-tables-container">
            <div 
              className="convex-panel-sidebar-section-header"
              onClick={() => setIsAllTablesCollapsed(!isAllTablesCollapsed)}
              style={{ cursor: 'pointer' }}
            >
              <div className="convex-panel-sidebar-section-title">
                <span className="section-collapse-icon">
                  {isAllTablesCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
                </span>
                All Tables
              </div>
            </div>
          </div>
        )}
        
        {!isSidebarCollapsed && !isAllTablesCollapsed && filteredTables.sort().map(tableName => (
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