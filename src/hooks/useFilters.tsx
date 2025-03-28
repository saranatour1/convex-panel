import { useState, useCallback, useEffect, useRef } from 'react';
import { FilterClause, FilterExpression, MenuPosition } from '../types';

interface UseFiltersProps {
  onFilterApply: (filter: FilterClause) => void;
  onFilterRemove: (field: string) => void;
  onFilterClear: () => void;
  selectedTable: string | null;
  initialFilters: FilterExpression;
}

export const useFilters = ({
  onFilterApply,
  onFilterRemove,
  onFilterClear,
  selectedTable,
  initialFilters
}: UseFiltersProps) => {
  const [filters, setFilters] = useState<FilterExpression>(initialFilters);
  const [filterMenuField, setFilterMenuField] = useState<string | null>(null);
  const [filterMenuPosition, setFilterMenuPosition] = useState<MenuPosition | null>(null);
  const lastAppliedFilterRef = useRef<string>('');

  // Reset filters when table changes
  useEffect(() => {
    setFilters({ clauses: [] });
    setFilterMenuField(null);
    setFilterMenuPosition(null);
  }, [selectedTable]);

  // Sync with initial filters when they change
  useEffect(() => {
    const currentFiltersJson = JSON.stringify(filters);
    const initialFiltersJson = JSON.stringify(initialFilters);
    
    if (currentFiltersJson !== initialFiltersJson && initialFiltersJson !== lastAppliedFilterRef.current) {
      setFilters(initialFilters);
      lastAppliedFilterRef.current = initialFiltersJson;
    }
  }, [initialFilters]);

  const handleFilterButtonClick = useCallback((e: React.MouseEvent, field: string) => {
    e.stopPropagation();
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFilterMenuField(field);
    setFilterMenuPosition({
      top: buttonRect.bottom,
      left: buttonRect.left
    });
  }, []);

  const handleFilterApply = useCallback((filter: FilterClause) => {
    setFilters(prevFilters => {
      // Remove any existing filter for this field
      const otherFilters = prevFilters.clauses.filter(f => f.field !== filter.field);
      
      // Create new filters state
      const newFilters = {
        clauses: [...otherFilters, filter]
      };
      
      // Only update if filters have actually changed
      const newFiltersJson = JSON.stringify(newFilters);
      if (newFiltersJson === lastAppliedFilterRef.current) {
        return prevFilters;
      }
      
      lastAppliedFilterRef.current = newFiltersJson;
      onFilterApply(filter);
      return newFilters;
    });
  }, [onFilterApply]);

  const handleFilterRemove = useCallback((field: string) => {
    setFilters(prevFilters => {
      const newFilters = {
        clauses: prevFilters.clauses.filter(f => f.field !== field)
      };
      onFilterRemove(field);
      return newFilters;
    });
  }, [onFilterRemove]);

  const clearFilters = useCallback(() => {
    setFilters({ clauses: [] });
    onFilterClear();
  }, [onFilterClear]);

  const closeFilterMenu = useCallback(() => {
    setFilterMenuField(null);
    setFilterMenuPosition(null);
  }, []);

  return {
    filters,
    setFilters,
    filterMenuField,
    filterMenuPosition,
    handleFilterButtonClick,
    handleFilterApply,
    handleFilterRemove,
    clearFilters,
    closeFilterMenu
  };
}; 