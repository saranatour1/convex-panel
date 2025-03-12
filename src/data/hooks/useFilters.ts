import { useState, useCallback, useEffect, useRef } from 'react';
import { FilterExpression, FilterClause, MenuPosition } from '../types';
import { saveTableFilters } from '../utils/storage';

interface UseFiltersProps {
  onFilterApply: (filter: FilterClause) => void;
  onFilterRemove: (field: string) => void;
  onFilterClear: () => void;
  selectedTable: string;
  initialFilters?: FilterExpression;
}

interface UseFiltersReturn {
  filters: FilterExpression;
  filterMenuField: string | null;
  filterMenuPosition: MenuPosition | null;
  handleFilterButtonClick: (e: React.MouseEvent, header: string) => void;
  handleFilterApply: (filter: FilterClause) => void;
  handleFilterRemove: (field: string) => void;
  clearFilters: () => void;
  closeFilterMenu: () => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterExpression>>;
}

export const useFilters = ({
  onFilterApply,
  onFilterRemove,
  onFilterClear,
  selectedTable,
  initialFilters = { clauses: [] }
}: UseFiltersProps): UseFiltersReturn => {
  const [filters, setFiltersState] = useState<FilterExpression>(initialFilters);
  const [filterMenuField, setFilterMenuField] = useState<string | null>(null);
  const [filterMenuPosition, setFilterMenuPosition] = useState<MenuPosition | null>(null);
  
  // Use a ref to track if we've initialized with the initial filters
  const initializedRef = useRef<Record<string, boolean>>({});

  // Define closeFilterMenu early so it can be used in other callbacks
  const closeFilterMenu = useCallback(() => {
    setFilterMenuField(null);
    setFilterMenuPosition(null);
  }, []);

  // Wrapper for setFilters that also updates localStorage
  const setFilters = useCallback((filtersOrUpdater: React.SetStateAction<FilterExpression>) => {
    setFiltersState(prev => {
      const newFilters = typeof filtersOrUpdater === 'function' 
        ? filtersOrUpdater(prev) 
        : filtersOrUpdater;
      
      if (selectedTable) {
        // Use setTimeout to avoid blocking the UI thread
        setTimeout(() => {
          saveTableFilters(selectedTable, newFilters);
        }, 0);
      }
      
      return newFilters;
    });
  }, [selectedTable]);

  // Update filters when initialFilters changes, but only once per table
  useEffect(() => {
    if (selectedTable && initialFilters) {
      // Only update if we haven't initialized this table yet or if the filters have changed
      if (!initializedRef.current[selectedTable]) {
        setFiltersState(initialFilters);
        initializedRef.current[selectedTable] = true;
      } else if (
        // Check if initialFilters are different from current filters
        JSON.stringify(initialFilters) !== JSON.stringify(filters) &&
        // Only consider non-empty initialFilters
        initialFilters.clauses.length > 0
      ) {
        setFiltersState(initialFilters);
      }
    }
  }, [selectedTable, initialFilters, filters]);

  const handleFilterButtonClick = useCallback((e: React.MouseEvent, header: string) => {
    e.stopPropagation();
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Position the menu below the button
    setFilterMenuPosition({
      top: rect.bottom + 8, // 8px offset from the button
      left: Math.max(rect.left - 150, 10) // Center the menu on the button, but keep it on screen
    });
    setFilterMenuField(header);
  }, []);

  const handleFilterApply = useCallback((filter: FilterClause) => {
    // Check if we're editing an existing filter
    const existingFilterIndex = filters.clauses.findIndex(f => f.field === filter.field);
    
    // Create a new filters object to avoid mutation
    const newFilters = { ...filters };
    
    if (existingFilterIndex !== -1) {
      // Update existing filter
      newFilters.clauses = [...filters.clauses];
      newFilters.clauses[existingFilterIndex] = filter;
    } else {
      // Add new filter
      newFilters.clauses = [...filters.clauses, filter];
    }
    
    // Update filters
    setFilters(newFilters);
    
    // Close the filter menu
    setFilterMenuField(null);
    
    // Call the onFilterApply callback
    if (onFilterApply) {
      onFilterApply(filter);
    }
  }, [filters, setFilters, onFilterApply]);

  const handleFilterRemove = useCallback((field: string) => {
    setFilters(prev => ({
      clauses: prev.clauses.filter(c => c.field !== field)
    }));
    
    onFilterRemove(field);
  }, [onFilterRemove, setFilters]);

  const clearFilters = useCallback(() => {
    setFilters({ clauses: [] });
    onFilterClear();
  }, [onFilterClear, setFilters]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterMenuField && filterMenuPosition) {
        const target = e.target as HTMLElement;
        const isFilterButton = target.closest('.filter-menu-button');
        const isFilterMenu = target.closest('.filter-menu');
        
        if (!isFilterButton && !isFilterMenu) {
          closeFilterMenu();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterMenuField, filterMenuPosition, closeFilterMenu]);

  return {
    filters,
    filterMenuField,
    filterMenuPosition,
    handleFilterButtonClick,
    handleFilterApply,
    handleFilterRemove,
    clearFilters,
    closeFilterMenu,
    setFilters
  };
}; 