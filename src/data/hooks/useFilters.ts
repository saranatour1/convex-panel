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
    console.log('closeFilterMenu called - closing filter menu');
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
        saveTableFilters(selectedTable, newFilters);
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
    e.preventDefault();
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();

    console.log('Button rect:', rect);
    console.log('Button:', button);
    console.log('Header:', header);
    
    // Get the viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate position to ensure it's visible
    const menuWidth = 300; // Approximate width of the menu
    const menuHeight = 300; // Approximate height of the menu
    
    // Position the menu so it fits on screen
    let left = rect.left;
    // If menu would overflow right edge, position it to the left of the button
    if (left + menuWidth > viewportWidth - 20) {
      left = Math.max(viewportWidth - menuWidth - 20, 10);
    }
    
    // Ensure it's not too close to the bottom of the viewport
    let top = rect.bottom + 8;
    if (top + menuHeight > viewportHeight - 20) {
      // Position above the button if there's not enough space below
      top = Math.max(rect.top - menuHeight - 8, 10);
    }
    
    const menuPosition = {
      top: top,
      left: left,
    };
    
    console.log('Setting menu position:', menuPosition);
    
    // Add delayed check for menu element
    setTimeout(() => {
      console.log('Checking for menu in DOM after timeout');
      const menuElements = document.querySelectorAll('.convex-panel-filter-menu');
      console.log('Found filter menu elements:', menuElements.length);
      
      if (menuElements.length > 0) {
        console.log('Menu element styles:', menuElements[0].getAttribute('style'));
        console.log('Menu element rect:', menuElements[0].getBoundingClientRect());
      }
    }, 500);
    
    setFilterMenuPosition(menuPosition);
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
    // Create a new filters object with the filter removed
    const newFilters = {
      clauses: filters.clauses.filter(c => c.field !== field)
    };
    
    // Update filters state and storage synchronously
    if (selectedTable) {
      saveTableFilters(selectedTable, newFilters);
    }
    setFilters(newFilters);
    
    // Call the callback
    onFilterRemove(field);
  }, [filters, onFilterRemove, setFilters, selectedTable]);

  const clearFilters = useCallback(() => {
    // Set filters to empty array immediately
    setFilters({ clauses: [] });
    
    // Call the callback
    onFilterClear();
  }, [onFilterClear, setFilters]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterMenuField && filterMenuPosition) {
        const target = e.target as HTMLElement;
        console.log('Click outside check - target:', target);
        
        // Find if click is on button or menu
        const isFilterButton = target.closest('.convex-panel-filter-button');
        const isFilterMenu = target.closest('.convex-panel-filter-menu');
        
        console.log('Click outside check - isFilterButton:', !!isFilterButton, 'isFilterMenu:', !!isFilterMenu);
        
        // Only close if click is outside both the button and menu
        if (!isFilterButton && !isFilterMenu) {
          console.log('Click detected outside filter button and menu - closing menu');
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