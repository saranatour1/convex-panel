import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { FilterClause, DataTableProps } from '../types';
import { useTableData } from '../hooks/useTableData';
import { useFilters } from '../hooks/useFilters';
import { 
  DataTableSidebar, 
  DataTableContent, 
  ActiveFilters, 
  FilterDebug,
  StorageDebug,
  FilterMenu
} from './components';
import { getStorageItem } from '../utils/storage';
import { ConvexPanelSettings } from '../settings';
import '../styles/DataTable.css';
import { defaultSettings } from '../utils/constants';
import { STORAGE_KEYS } from '../utils/constants';
import { FilterMenuState } from '../types';

const DataTable: React.FC<DataTableProps> = ({
  /**
   * URL for the Convex backend.
   * Used to configure the Convex client connection.
   * @required
   */
  convexUrl,

  /**
   * Authentication token for accessing Convex API.
   * Required for securing access to data.
   * Should be kept private and not exposed to clients.
   * @required
   */
  accessToken,

  /**
   * Error handling callback.
   * Called when errors occur during data fetching or processing.
   * Receives error message string as parameter.
   * @param error Error message
   */
  onError,

  /**
   * Theme customization object to override default styles.
   * Supports customizing colors, spacing, and component styles.
   * See ThemeClasses interface for available options.
   * @default {}
   */
  theme = {},

  /**
   * Base URL for the API.
   * Used to configure the API client connection.
   * @required
   */
  baseUrl,

  /**
   * Convex React client instance.
   * Required for making API calls to your Convex backend.
   * Must be initialized and configured before passing.
   * @required
   */
  convex,

  /**
   * Convex admin client instance.
   * Optional client for admin-level access.
   * Enables additional admin capabilities when provided.
   * Should be kept secure and only used in protected environments.
   * @optional
   */
  adminClient,
  settings: externalSettings,
  
  /**
   * Whether to use mock data instead of real API data.
   * Useful for development, testing, and demos.
   * @default false
   */
  useMockData = false,
}) => {
  
  const [searchText, setSearchText] = React.useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const [filterMenuState, setFilterMenuState] = useState<FilterMenuState>({
    isOpen: false,
    position: { top: 0, left: 0 }
  });
  
  const [settings, setSettings] = useState<ConvexPanelSettings>(() => {
    if (externalSettings) {
      return externalSettings;
    }

    if (typeof window !== 'undefined') {
      return getStorageItem<ConvexPanelSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
    }
    return defaultSettings;
  });
  
  const {
    tables,
    selectedTable,
    setSelectedTable,
    documents,
    setDocuments,
    isLoading,
    hasMore,
    isLoadingMore,
    fetchTableData,
    formatValue,
    getColumnHeaders,
    observerTarget,
    filters: tableFilters,
    setFilters: setTableFilters,
    patchDocumentFields
  } = useTableData({
    convexUrl,
    accessToken,
    baseUrl,
    adminClient,
    onError,
    useMockData
  });

  /**
   * Fetch table data when a filter is applied
   */
  const onFilterApply = useCallback((filter: FilterClause) => {
    fetchTableData(selectedTable, null);
  }, [selectedTable, fetchTableData]);

  const {
    filters,
    filterMenuField,
    filterMenuPosition,
    handleFilterButtonClick,
    handleFilterApply,
    handleFilterRemove,
    clearFilters,
    closeFilterMenu,
    setFilters
  } = useFilters({
    onFilterApply,
    onFilterRemove: (field) => {
      fetchTableData(selectedTable, null);
    },
    onFilterClear: () => {
      fetchTableData(selectedTable, null);
    },
    selectedTable,
    initialFilters: tableFilters
  });

  /**
   * Sync filters from useFilters to useTableData with priority
   */
  useEffect(() => {
    // Always update tableFilters when filters change
    setTableFilters(filters);
    
    // If filters are cleared, force a data refresh
    if (filters.clauses.length === 0) {
      fetchTableData(selectedTable, null);
    }
  }, [filters, setTableFilters, fetchTableData, selectedTable]);

  /**
   * Create a wrapper function for patchDocumentFields to match the expected interface
   */
  const handleUpdateDocument = useCallback(
    async (params: { table: string; ids: string[]; fields: Record<string, any> }) => {
      try {
        // Patch the document fields on the server
        await patchDocumentFields(params.table, params.ids, params.fields);
        
        // If setDocuments is available, update the documents locally
        if (setDocuments && documents) {
          // Create updated documents by replacing the modified fields
          const updatedDocuments = documents.map(doc => {
            // Check if this document is one of the ones being updated
            if (params.ids.includes(doc._id?.toString() || '')) {
              // Return a new document with merged fields
              return { ...doc, ...params.fields };
            }
            // Return unchanged document
            return doc;
          });
          
          // Update the documents state
          setDocuments(updatedDocuments);
        } else {
          // Fall back to refetching if local update is not possible
          fetchTableData(params.table, null);
        }
      } catch (error) {
        // If there's an error, refetch to ensure data consistency
        console.error('Error updating document:', error);
        fetchTableData(params.table, null);
      }
    },
    [patchDocumentFields, fetchTableData, documents, setDocuments]
  );

  /**
   * Get column headers
   */
  const columnHeaders = getColumnHeaders();

  return (
    <div className="convex-panel-data-layout">
      <DataTableSidebar
        tables={tables}
        selectedTable={selectedTable}
        searchText={searchText}
        onSearchChange={setSearchText}
        onTableSelect={setSelectedTable}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        theme={theme}
      />

      <div className="convex-panel-data-content">          
        <div className="convex-panel-data-container">
            
          {!filters || filters.clauses.length === 0 ? null : (
            <div className="convex-panel-filters-bar">
                <ActiveFilters
                    filters={filters}
                    onRemove={handleFilterRemove}
                    onClearAll={clearFilters}
                    selectedTable={selectedTable}
                    theme={theme}
                    onEdit={(e: React.MouseEvent, field: string) => {
                      // Find the existing filter
                      const existingFilter = filters.clauses.find((f: FilterClause) => f.field === field);
                      if (existingFilter) {
                        // Open the filter menu with the existing filter values
                        setFilterMenuState({
                        isOpen: true,
                        position: {
                            top: e.clientY,
                            left: e.clientX
                        },
                        editingFilter: existingFilter
                        });
                    }
                    }}
                />
            </div>
          )}
          {settings.showDebugFilters && (
            <FilterDebug 
              filters={filters} 
              selectedTable={selectedTable}
            />
          )}
          
          {settings.showStorageDebug && (
            <StorageDebug 
              visible={true}
              selectedTable={selectedTable}
              filters={filters}
            />
          )}
          
          {selectedTable && (
            <DataTableContent
              documents={documents}
              columnHeaders={columnHeaders}
              isLoading={isLoading}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              observerTarget={observerTarget}
              onFilterButtonClick={handleFilterButtonClick}
              filterMenuField={filterMenuField}
              filterMenuPosition={filterMenuPosition}
              handleFilterApply={handleFilterApply}
              onFilterMenuClose={closeFilterMenu}
              formatValue={formatValue}
              activeFilters={filters}
              onUpdateDocument={handleUpdateDocument}
              tableName={selectedTable}
            />
          )}
        </div>
      </div>
      {filterMenuState.isOpen && (
        <FilterMenu
          field={filterMenuState.editingFilter?.field || ''}
          position={filterMenuState.position}
          onClose={() => setFilterMenuState(prev => ({ ...prev, isOpen: false }))}
          onApply={(filter: FilterClause) => {
            handleFilterApply(filter);
            setFilterMenuState(prev => ({ ...prev, isOpen: false }));
          }}
          existingFilter={filterMenuState.editingFilter}
          theme={theme}
        />
      )}
    </div>
  );
};

export default DataTable; 