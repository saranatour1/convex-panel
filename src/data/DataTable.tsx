import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { FilterClause, DataTableProps, RecentlyViewedTable, TableDocument, SortDirection } from '../types';
import { useTableData } from '../hooks/useTableData';
import { useFilters } from '../hooks/useFilters';
import { 
  DataTableSidebar, 
  DataTableContent, 
  ActiveFilters, 
  FilterDebug,
  StorageDebug,
  DetailPanel
} from './components';
import { getStorageItem, getRecentlyViewedTables, updateRecentlyViewedTable } from '../utils/storage';
import { ConvexPanelSettings } from '../settings';
import { defaultSettings } from '../utils/constants';
import { STORAGE_KEYS } from '../utils/constants';

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
  const [recentlyViewedTables, setRecentlyViewedTables] = useState<RecentlyViewedTable[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<TableDocument | null>(null);
  
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
    patchDocumentFields,
    sortConfig,
    setSortConfig
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

  // Ref to track when we're programmatically syncing to avoid loops
  const isSyncingToTableData = useRef(false);
  const lastSyncedFiltersRef = useRef('');

  /**
   * Sync filters from useFilters to useTableData with priority
   */
  useEffect(() => {
    // Convert current filters to string for comparison
    const currentFiltersJson = JSON.stringify(filters);
    
    // Skip if already synced these exact filters or if we're in the middle of syncing
    if (isSyncingToTableData.current || lastSyncedFiltersRef.current === currentFiltersJson) {
      return;
    }
    
    isSyncingToTableData.current = true;
    
    // Update the table filters
    setTableFilters(filters);
    
    // Store what we just synced
    lastSyncedFiltersRef.current = currentFiltersJson;
    
    // If filters are cleared, force a data refresh
    if (filters.clauses.length === 0) {
      fetchTableData(selectedTable, null);
    }
    
    // Reset the sync flag
    isSyncingToTableData.current = false;
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

          // Also update the selected document if it was modified
          if (selectedDocument && params.ids.includes(selectedDocument._id?.toString() || '')) {
            setSelectedDocument({ ...selectedDocument, ...params.fields });
          }
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
    [patchDocumentFields, fetchTableData, documents, setDocuments, selectedDocument]
  );

  /**
   * Load recently viewed tables from storage on initial render
   */
  useEffect(() => {
    const storedRecentTables = getRecentlyViewedTables();
    setRecentlyViewedTables(storedRecentTables);
  }, []);

  /**
   * Handle table selection and update recently viewed tables
   */
  const handleTableSelect = useCallback((tableName: string) => {
    setSelectedTable(tableName);
    
    // Update recently viewed tables
    updateRecentlyViewedTable(tableName);
    
    // Update state with the latest recently viewed tables
    setRecentlyViewedTables(getRecentlyViewedTables());

    // Clear any selected document when switching tables
    setSelectedDocument(null);
    
    // Clear sorting when switching tables
    setSortConfig(null);
  }, [setSelectedTable, setSortConfig]);

  /**
   * Get column headers
   */
  const columnHeaders = getColumnHeaders();

  // Determine if detail panel should be shown
  const showDetailPanel = !!selectedDocument;

  const onEditFilter = (e: React.MouseEvent, field: string) => {
    // We now use handleFilterButtonClick from useFilters
    handleFilterButtonClick(e, field);
  };
  
  /**
   * Handle sorting when a column header is clicked
   */
  const handleSort = useCallback((field: string) => {
    // Use a functional update to ensure we have the latest state
    setSortConfig(prevConfig => {
      const newConfig = !prevConfig || prevConfig.field !== field
        ? { field, direction: 'asc' as SortDirection }  // First click: sort ascending
        : prevConfig.direction === 'asc'
          ? { field, direction: 'desc' as SortDirection } // Second click: sort descending
          : null;                                      // Third click: clear sorting
      
      // Apply client-side sorting first for instant feedback
      if (documents && documents.length > 0) {
        const sortedDocs = newConfig 
          ? [...documents].sort((a, b) => {
              const aValue = a[field];
              const bValue = b[field];
              
              // Handle null/undefined values
              if (aValue === null || aValue === undefined) return 1;
              if (bValue === null || bValue === undefined) return -1;
              
              // Compare based on value type
              if (typeof aValue === 'string' && typeof bValue === 'string') {
                return newConfig.direction === 'asc' 
                  ? aValue.localeCompare(bValue) 
                  : bValue.localeCompare(aValue);
              }
              
              if (typeof aValue === 'number' && typeof bValue === 'number') {
                return newConfig.direction === 'asc' 
                  ? aValue - bValue 
                  : bValue - aValue;
              }
              
              if (aValue instanceof Date && bValue instanceof Date) {
                return newConfig.direction === 'asc' 
                  ? aValue.getTime() - bValue.getTime() 
                  : bValue.getTime() - aValue.getTime();
              }
              
              // Default comparison for other types
              const aStr = String(aValue);
              const bStr = String(bValue);
              return newConfig.direction === 'asc' 
                ? aStr.localeCompare(bStr) 
                : bStr.localeCompare(aStr);
            })
          : documents;
        
        // Update documents immediately for better UX
        setDocuments(sortedDocs);
      }
      
      // Refresh data with new sort
      setTimeout(() => {
        fetchTableData(selectedTable, null);
      }, 0);
      
      return newConfig;
    });
  }, [setSortConfig, fetchTableData, selectedTable, documents, setDocuments]);

  return (
    <div className="convex-panel-data-layout">
      <DataTableSidebar
        tables={tables}
        selectedTable={selectedTable}
        searchText={searchText}
        onSearchChange={setSearchText}
        onTableSelect={handleTableSelect}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        theme={theme}
        recentlyViewedTables={recentlyViewedTables}
      />

      <div className={`convex-panel-data-content ${showDetailPanel ? 'with-detail-panel' : ''}`}>          
        <div className="convex-panel-data-container">
            
          {!filters || filters.clauses.length === 0 ? null : (
            <div className="convex-panel-filters-bar">
                <ActiveFilters
                    filters={filters}
                    onRemove={handleFilterRemove}
                    onClearAll={clearFilters}
                    selectedTable={selectedTable}
                    theme={theme}
                    onEdit={onEditFilter}
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
              setDocuments={setDocuments}
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
              selectedDocument={selectedDocument}
              setSelectedDocument={setSelectedDocument}
              sortConfig={sortConfig}
              onSort={handleSort}
              adminClient={adminClient}
              />
          )}
        </div>
        
        {showDetailPanel && selectedTable && selectedDocument && (
          <DetailPanel
            document={selectedDocument}
            tableName={selectedTable}
            onClose={() => setSelectedDocument(null)}
            formatValue={formatValue}
            onUpdateDocument={handleUpdateDocument}
          />
        )}
      </div>
    </div>
  );
};

export default DataTable; 