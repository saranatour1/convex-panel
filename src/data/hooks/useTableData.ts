import { useState, useEffect, useCallback, useRef } from 'react';
import { ConvexClient } from 'convex/browser';
import { 
  TableDefinition, 
  TableDocument, 
  PaginationOptions, 
  PageArgs, 
  FilterExpression 
} from '../types';
import { getActiveTable, saveActiveTable, getTableFilters } from '../utils/storage';

interface UseTableDataProps {
  convexUrl: string;
  accessToken: string;
  baseUrl: string;
  adminClient: ConvexClient | null;
  onError?: (error: string) => void;
}

interface UseTableDataReturn {
  tables: TableDefinition;
  selectedTable: string;
  setSelectedTable: (tableName: string) => void;
  documents: TableDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<TableDocument[]>>;
  isLoading: boolean;
  error: string | null;
  documentCount: number;
  continueCursor: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  fetchTableData: (tableName: string, cursor: string | null) => Promise<void>;
  fetchTables: () => Promise<void>;
  patchDocumentFields: (table: string, ids: string[], fields: Record<string, any>) => Promise<any>;
  getTableFields: (tableName: string) => string[];
  getColumnHeaders: () => string[];
  formatValue: (value: any) => string;
  renderFieldType: (field: any) => string;
  observerTarget: (node: HTMLDivElement) => void;
  filters: FilterExpression;
  setFilters: React.Dispatch<React.SetStateAction<FilterExpression>>;
}

export const useTableData = ({
  convexUrl,
  accessToken,
  baseUrl,
  adminClient,
  onError,
}: UseTableDataProps): UseTableDataReturn => {
  const [tables, setTables] = useState<TableDefinition>({});
  const [selectedTable, setSelectedTableState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<TableDocument[]>([]);
  const [documentCount, setDocumentCount] = useState<number>(0);
  const [insertionStatus, setInsertionStatus] = useState<string>('');
  const [continueCursor, setContinueCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filters, setFilters] = useState<FilterExpression>({ clauses: [] });
  
  // Use a ref to track if filters have been loaded from storage
  const filtersLoadedRef = useRef<Record<string, boolean>>({});
  // Add a ref to track the previous table
  const prevTableRef = useRef<string | null>(null);
  // Add a ref to track the current filters
  const filtersRef = useRef<FilterExpression>({ clauses: [] });

  // Add a dependency tracking ref to prevent unnecessary fetches
  const lastFetchRef = useRef<{
    tableName: string | null;
    filters: FilterExpression | null;
    cursor: string | null;
  }>({
    tableName: null,
    filters: null,
    cursor: null
  });

  // Wrapper for setSelectedTable that also updates localStorage
  const setSelectedTable = useCallback((tableName: string) => {
    setSelectedTableState(tableName);
    saveActiveTable(tableName);
  }, []);

  const fetchTables = useCallback(async () => {
    if (!convexUrl || !accessToken) {
      setInsertionStatus('Missing URL or access token');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${convexUrl}/api/shapes2`, {
        headers: {
          "authorization": `Convex ${accessToken}`,
          "convex-client": "dashboard-0.0.0"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tables: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Verify data structure
      if (!data || typeof data !== 'object') {
        setInsertionStatus('Invalid data structure received');
        return;
      }
      
      // Filter out "Never" type tables
      const tableData = Object.entries(data).reduce((acc, [tableName, tableSchema]) => {
        if ((tableSchema as any).type !== 'Never') {
          acc[tableName] = tableSchema as any;
        }
        return acc;
      }, {} as TableDefinition);
      
      setTables(tableData);
      
      // Check if we have a stored active table
      const storedActiveTable = getActiveTable();
      
      if (storedActiveTable && tableData[storedActiveTable]) {
        // Use the stored table if it exists
        setSelectedTable(storedActiveTable);
      } else if (Object.keys(tableData).length > 0 && adminClient) {
        // Otherwise use the first table if adminClient is available
        try {
          await adminClient.query("_system/frontend/tableSize:default" as any, {
            componentId: null,
            tableName: Object.keys(tableData)[0]
          });
        } catch (err) {
          console.error("Error fetching table size:", err);
        }
        
        setSelectedTable(Object.keys(tableData)[0] || '');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [convexUrl, accessToken, onError, adminClient, setSelectedTable]);

  const fetchTableData = useCallback(async (tableName: string, cursor: string | null = null) => {
    if (!tableName || !adminClient) return;
    
    // Check if this is a duplicate request
    const lastFetch = lastFetchRef.current;
    const currentFilters = filtersRef.current;
    const filtersJson = JSON.stringify(currentFilters);
    const lastFiltersJson = lastFetch.filters ? JSON.stringify(lastFetch.filters) : null;
    
    // Always allow filter-related requests to go through (when cursor is null)
    // This ensures filter operations are always processed
    if (
      cursor !== null && // Skip this check for initial loads (filter operations)
      tableName === lastFetch.tableName && 
      cursor === lastFetch.cursor &&
      filtersJson === lastFiltersJson
    ) {
      return;
    }
    
    // For filter operations, set loading state immediately
    if (cursor === null) {
      setIsLoading(true);
    } else if (cursor) {
      setIsLoadingMore(true);
    }
    
    // Update last fetch reference
    lastFetchRef.current = {
      tableName,
      filters: JSON.parse(JSON.stringify(currentFilters)),
      cursor
    };
    
    setError(null);
    
    try {
      const page: PaginationOptions = {
        cursor,
        numItems: 25,
        id: Date.now(),
      };
      
      // Only create filterString if we have filters
      const filterString = currentFilters.clauses.length > 0 
        ? btoa(JSON.stringify({
            clauses: currentFilters.clauses.map(clause => ({
              op: clause.op === 'isType' ? 'type' : 
                  clause.op === 'isNotType' ? 'notype' : 
                  clause.op,
              field: clause.field,
              value: clause.value,
              enabled: true,
              id: `${clause.field}_${Date.now()}`
            }))
          }))
        : null;

      const args: PageArgs = {
        paginationOpts: page,
        table: tableName,
        filters: filterString,
        componentId: null,
      };

      if (!adminClient) {
        setIsLoading(false);
        setIsLoadingMore(false);
        if (onError) onError("Admin client is not available");
        return;
      }

      const result = await adminClient.query(
        "_system/frontend/paginatedTableDocuments:default" as any,
        args
      );

      if (result.page === null || result.page === undefined) {
        console.error('Received null/undefined page in result:', result);
        throw new Error('Invalid response format');
      }
      
      if (cursor === null) {
        setDocuments(result.page || []);
      } else {
        setDocuments(prev => [...prev, ...(result.page || [])]);
      }
      
      setContinueCursor(result.continueCursor || null);
      setHasMore(!result.isDone);
      setDocumentCount(prev => cursor === null ? result.page.length : prev + result.page.length);
      
    } catch (err) {
      console.error('Error fetching table data:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [adminClient]);

  // Update filtersRef when filters change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Load saved filters when selected table changes
  useEffect(() => {
    if (selectedTable) {
      setContinueCursor(null);
      setHasMore(true);
      setDocuments([]);
      
      // Only reset filters when changing tables
      if (prevTableRef.current !== selectedTable) {
        // Only reset filters if they're not already empty
        if (filtersRef.current.clauses.length > 0) {
          setFilters({ clauses: [] });
        }
        prevTableRef.current = selectedTable;
        
        // Only load filters from storage if we haven't already loaded them for this table
        if (!filtersLoadedRef.current[selectedTable]) {
          const savedFilters = getTableFilters(selectedTable);
          
          // Only update filters if they're different from current filters
          const currentFiltersJson = JSON.stringify(filtersRef.current);
          const savedFiltersJson = JSON.stringify(savedFilters);
          
          if (currentFiltersJson !== savedFiltersJson) {
            // Use functional update to avoid dependency on setFilters
            setFilters(() => savedFilters);
          }
          
          filtersLoadedRef.current[selectedTable] = true;
        }
      }
    }
  }, [selectedTable]);
  
  // Fetch data when selected table or filters change
  useEffect(() => {
    if (selectedTable) {
      // Use a shorter timeout for better responsiveness
      const timeoutId = setTimeout(() => {
        fetchTableData(selectedTable, null);
      }, 50); // Reduce timeout for better responsiveness
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedTable, fetchTableData]);

  // Add a dedicated effect to handle filter changes and fetch data
  useEffect(() => {
    if (selectedTable) {
      // Only fetch if we have filters or if this is a filter clear operation
      const previousFilters = lastFetchRef.current.filters;
      const hadPreviousFilters = previousFilters && Array.isArray(previousFilters.clauses) && previousFilters.clauses.length > 0;
      
      if (filters.clauses.length > 0 || hadPreviousFilters) {
        // Reset cursor when filters change
        setContinueCursor(null);
        setHasMore(true);
        // Immediate fetch for filter changes to improve responsiveness
        fetchTableData(selectedTable, null);
      }
    }
  }, [filters, selectedTable, fetchTableData]);

  const patchDocumentFields = async (table: string, ids: string[], fields: Record<string, any>) => {
    if (!adminClient) {
      throw new Error("Admin client is not available");
    }
    
    try {
      const result = await adminClient.mutation(
        "_system/frontend/patchDocumentsFields" as any,
        {
          table,
          componentId: null,
          ids,
          fields
        }
      );
      
      return result;
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
  };

  const observerTarget = useCallback((node: HTMLDivElement) => {
    if (!node || !hasMore || isLoading || isLoadingMore) return;
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          setIsLoadingMore(true);
          fetchTableData(selectedTable, continueCursor);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, selectedTable, continueCursor, fetchTableData]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const renderFieldType = (field: any): string => {
    if (field.shape.type === 'Id') {
      return `Id<"${field.shape.tableName}">`;
    }
    if (field.shape.type === 'Array') {
      return `${field.shape.shape?.type}[]`;
    }
    return field.shape.type;
  };

  const formatValue = (value: any, fieldName?: string): string => {
    if (value === undefined || value === null) {
      return 'unset';
    }
    
    // Format _creationTime in M/D/YYYY, h:mm:ss AM/PM format
    if (fieldName === '_creationTime' && typeof value === 'number') {
      const date = new Date(value);
      return date.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const getTableFields = (tableName: string) => {
    if (!tables[tableName] || !tables[tableName].fields) return [];
    return tables[tableName].fields.map(field => field.fieldName);
  };

  const getColumnHeaders = () => {
    if (!selectedTable) return [];
    
    const schemaFields = getTableFields(selectedTable);
    
    const documentFields = new Set<string>();
    documents.forEach(doc => {
      Object.keys(doc).forEach(key => {
        documentFields.add(key);
      });
    });
    
    const allFields = new Set([...schemaFields, ...documentFields]);
    
    const fields = Array.from(allFields);
    const idIndex = fields.indexOf('_id');
    if (idIndex > -1) {
      fields.splice(idIndex, 1);
      fields.unshift('_id');
    }
    
    return fields;
  };

  return {
    tables,
    selectedTable,
    setSelectedTable,
    documents,
    setDocuments,
    isLoading,
    error,
    documentCount,
    continueCursor,
    hasMore,
    isLoadingMore,
    fetchTableData,
    fetchTables,
    patchDocumentFields,
    getTableFields,
    getColumnHeaders,
    formatValue,
    renderFieldType,
    observerTarget,
    filters,
    setFilters
  };
}; 