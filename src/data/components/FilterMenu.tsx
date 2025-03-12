"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FilterMenuProps, FilterClause } from '../types';

const FilterMenu: React.FC<FilterMenuProps> = ({ 
  field, 
  position, 
  onApply, 
  onClose, 
  existingFilter,
  theme = {}
}) => {
  const [operator, setOperator] = useState<FilterClause['op']>(existingFilter?.op || 'eq');
  const [value, setValue] = useState<string>(existingFilter?.value !== undefined ? JSON.stringify(existingFilter.value) : '');
  const [isEditing, setIsEditing] = useState<boolean>(!!existingFilter);
  const [isOpen, setIsOpen] = useState(false);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  
  const isInternalClickRef = useRef(false);
  
  const typeOptions = [
    { value: 'string', label: 'string' },
    { value: 'boolean', label: 'boolean' },
    { value: 'number', label: 'number' },
    { value: 'bigint', label: 'bigint' },
    { value: 'null', label: 'null' },
    { value: 'object', label: 'object' },
    { value: 'array', label: 'array' },
    { value: 'id', label: 'id' },
    { value: 'bytes', label: 'bytes' },
    { value: 'unset', label: 'unset' }
  ];

  const operatorOptions = [
    { value: 'eq', label: 'equals' },
    { value: 'neq', label: 'not equal' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'gte', label: '>=' },
    { value: 'lte', label: '<=' },
    { value: 'isType', label: 'Is type' },
    { value: 'isNotType', label: 'Is not type' },
    { value: 'anyOf', label: 'any of' },
    { value: 'noneOf', label: 'None of' }
  ];

  useEffect(() => {
    // Handle click outside to close the menu
    const handleClickOutside = (e: MouseEvent) => {
      // If this is an internal click that we're tracking, don't close
      if (isInternalClickRef.current) {
        isInternalClickRef.current = false;
        return;
      }
      
      // Only close if the click is outside the menu
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    // Handle escape key to close the menu
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    // Use mousedown for outside clicks (happens before mouseup/click)
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, field, position]);

  // Handle dropdown click outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutsideDropdown = (e: MouseEvent) => {
      // Don't close the dropdown if we're clicking inside the menu but outside the dropdown
      if (menuRef.current && menuRef.current.contains(e.target as Node) && 
          dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        // Mark this as an internal click so the menu doesn't close
        isInternalClickRef.current = true;
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutsideDropdown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDropdown);
    };
  }, [isOpen]);

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Parse the value as JSON
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        // If it's not valid JSON, use the raw string
        parsedValue = value;
      }
      
      const filter: FilterClause = {
        field,
        op: operator,
        value: parsedValue,
        enabled: true
      };
      
      onApply(filter);
      onClose();
    } catch (error) {
      console.error('Error applying filter:', error);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Mark this as an internal click
    isInternalClickRef.current = true;
    setIsOpen(!isOpen);
  };

  const handleOptionSelect = (optionValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Mark this as an internal click
    isInternalClickRef.current = true;
    setOperator(optionValue as FilterClause['op']);
    setIsOpen(false);
  };

  // Handle mousedown inside the menu to prevent it from closing
  const handleMenuMouseDown = (e: React.MouseEvent) => {
    // Mark this as an internal click
    isInternalClickRef.current = true;
    e.stopPropagation();
  };

  const handleTypeFilterToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isInternalClickRef.current = true;
    setIsTypeFilterOpen(!isTypeFilterOpen);
  };

  const handleTypeSelect = (typeValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isInternalClickRef.current = true;
    setValue(typeValue);
    setIsTypeFilterOpen(false);
  };

  // Update effect to handle type filter dropdown
  useEffect(() => {
    if (!isTypeFilterOpen) return;
    
    const handleClickOutsideTypeDropdown = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node) && 
          typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        isInternalClickRef.current = true;
        setIsTypeFilterOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutsideTypeDropdown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideTypeDropdown);
    };
  }, [isTypeFilterOpen]);

  return createPortal(
    <div 
      ref={menuRef}
      className="convex-panel-filter-menu"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={handleMenuMouseDown}
    >
      
      <div className="convex-panel-filter-menu-group">
        <label className="convex-panel-filter-menu-label">Operator</label>
        <div 
          ref={dropdownRef}
          className="convex-panel-filter-menu-dropdown"
        >
          <button
            type="button"
            onClick={handleDropdownToggle}
            onMouseDown={(e) => e.stopPropagation()}
            className="convex-panel-filter-menu-dropdown-button"
          >
            <span>
              {operatorOptions.find(opt => opt.value === operator)?.label || 'Select operation'}
            </span>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
              <path d="M3.5 5.5L7.5 9.5L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {isOpen && (
            <div 
              className="convex-panel-filter-menu-dropdown-content"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {operatorOptions.map(option => (
                <button
                  type="button"
                  key={option.value}
                  className={`convex-panel-filter-menu-option ${operator === option.value ? 'convex-panel-filter-menu-option-selected' : ''}`}
                  onClick={(e) => handleOptionSelect(option.value, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="convex-panel-filter-menu-group-value">
        <label className="convex-panel-filter-menu-label">Value</label>
        {(operator === 'isType' || operator === 'isNotType') ? (
          <div 
            ref={typeDropdownRef}
            className="convex-panel-filter-menu-dropdown"
          >
            <button
              type="button"
              onClick={handleTypeFilterToggle}
              onMouseDown={(e) => e.stopPropagation()}
              className="convex-panel-filter-menu-dropdown-button"
            >
              <span>
                {typeOptions.find(opt => opt.value === value)?.label || 'Select type'}
              </span>
              <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
                <path d="M3.5 5.5L7.5 9.5L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {isTypeFilterOpen && (
              <div 
                className="convex-panel-filter-menu-dropdown-content"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {typeOptions.map(option => (
                  <button
                    type="button"
                    key={option.value}
                    className={`convex-panel-filter-menu-option ${value === option.value ? 'convex-panel-filter-menu-option-selected' : ''}`}
                    onClick={(e) => handleTypeSelect(option.value, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="convex-panel-filter-menu-textarea"
              placeholder={operator === 'anyOf' || operator === 'noneOf' ? '[value1, value2, ...]' : 'Enter value (e.g. "text", 123, true)'}
            />
            <p className="convex-panel-filter-menu-hint">
              For arrays or objects, use valid JSON format
            </p>
          </>
        )}
      </div>
      
      <div className="convex-panel-filter-menu-actions">
        <button
          type="button"
          onClick={handleCancel}
          onMouseDown={(e) => e.stopPropagation()}
          className="convex-panel-filter-menu-cancel-button"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          onMouseDown={(e) => e.stopPropagation()}
          className="convex-panel-filter-menu-apply-button"
        >
          {isEditing ? 'Update Filter' : 'Apply Filter'}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default FilterMenu; 