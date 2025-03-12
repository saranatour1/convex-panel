

import React, { useCallback, useEffect, useState } from 'react';
import { FilterClause, MenuPosition, DataTableProps } from './types';
import { useTableData, useFilters } from './hooks';
import { 
  DataTableSidebar, 
  DataTableContent, 
  ActiveFilters, 
  FilterDebug,
  StorageDebug,
  FilterMenu
} from './components';
import { getStorageItem, STORAGE_KEYS } from './utils/storage';
import { ConvexPanelSettings } from '../settings';

// Define settings storage key
const SETTINGS_STORAGE_KEY = 'convex-panel:settings';

// Default settings
const defaultSettings = {
  showDebugFilters: process.env.NODE_ENV !== 'production',
  showStorageDebug: process.env.NODE_ENV !== 'production',
  logLevel: 'info' as const,
  healthCheckInterval: 60, // seconds
  showRequestIdInput: true,
  showLimitInput: true,
  showSuccessCheckbox: true,
};

// Define the filter menu state interface
interface FilterMenuState {
  isOpen: boolean;
  position: MenuPosition;
  editingFilter?: FilterClause;
}

const DataTable: React.FC<DataTableProps> = ({
  convexUrl,
  accessToken,
  onError,
  theme = {},
  baseUrl,
  convex,
  adminClient,
  settings: externalSettings
}) => {
  const [searchText, setSearchText] = React.useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [settings, setSettings] = useState<ConvexPanelSettings>(() => {
    // Use external settings if provided, otherwise initialize from localStorage
    if (externalSettings) {
      return externalSettings;
    }
    
    // Initialize from localStorage if available, otherwise use defaults
    if (typeof window !== 'undefined') {
      return getStorageItem<ConvexPanelSettings>(SETTINGS_STORAGE_KEY, defaultSettings);
    }
    return defaultSettings;
  });
  
  const {
    tables,
    selectedTable,
    setSelectedTable,
    documents,
    isLoading,
    hasMore,
    isLoadingMore,
    fetchTableData,
    formatValue,
    getColumnHeaders,
    observerTarget,
    filters: tableFilters,
    setFilters: setTableFilters
  } = useTableData({
    convexUrl,
    accessToken,
    baseUrl,
    adminClient,
    onError
  });

  // Add filter menu state
  const [filterMenuState, setFilterMenuState] = useState<FilterMenuState>({
    isOpen: false,
    position: { top: 0, left: 0 }
  });

  const onFilterApply = useCallback((filter: FilterClause) => {
    // Reset pagination and reload data immediately
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

  // Sync filters from useFilters to useTableData with priority
  useEffect(() => {
    if (filters) {
      // Use immediate update for better responsiveness
      setTableFilters(filters);
    }
  }, [filters, setTableFilters]);

  const columnHeaders = getColumnHeaders();

  return (
    <div className="flex h-full">
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

      <div className="flex-1 flex flex-col min-h-[420px] overflow-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-thumb:hover]:bg-neutral-500">          
        <div className="flex-1">
            
          {!filters || filters.clauses.length === 0 ? null : (
            <div className="flex justify-between items-center p-2 border-b border-neutral-700">
                <ActiveFilters
                    filters={filters}
                    onRemove={handleFilterRemove}
                    onClearAll={clearFilters}
                    selectedTable={selectedTable}
                    theme={theme}
                    onEdit={(e, field) => {
                    // Find the existing filter
                    const existingFilter = filters.clauses.find(f => f.field === field);
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
            />
          )}
        </div>
      </div>
      {filterMenuState.isOpen && (
        <FilterMenu
          field={filterMenuState.editingFilter?.field || ''}
          position={filterMenuState.position}
          onClose={() => setFilterMenuState(prev => ({ ...prev, isOpen: false }))}
          onApply={(filter) => {
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