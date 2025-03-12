

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
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Handle click outside to close the menu
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleApply = () => {
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

  return createPortal(
    <div 
      ref={menuRef}
      className="fixed z-50 bg-neutral-900 rounded-lg shadow-lg p-3 min-w-[300px] filter-menu border border-neutral-700"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      
      <div className="mb-3">
        <label className="block text-xs text-neutral-300 mb-1">Operator</label>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="w-full px-3 py-1.5 rounded-lg focus:outline-none text-xs bg-[#2a2a2a] text-white border border-[#333333] font-mono flex justify-between items-center"
          >
            <span>{operator === 'eq' ? 'Equals' : 
                   operator === 'neq' ? 'Not equals' :
                   operator === 'gt' ? 'Greater than' :
                   operator === 'gte' ? 'Greater than or equal' :
                   operator === 'lt' ? 'Less than' :
                   operator === 'lte' ? 'Less than or equal' :
                   operator === 'anyOf' ? 'Any of' :
                   operator === 'noneOf' ? 'None of' : 'Select operation'}
            </span>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
              <path d="M3.5 5.5L7.5 9.5L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-[#2a2a2a] border border-[#333333] rounded-lg shadow-lg">
              {[
                {value: 'eq', label: 'Equals'},
                {value: 'neq', label: 'Not equals'},
                {value: 'gt', label: 'Greater than'},
                {value: 'gte', label: 'Greater than or equal'},
                {value: 'lt', label: 'Less than'}, 
                {value: 'lte', label: 'Less than or equal'},
                {value: 'anyOf', label: 'Any of'},
                {value: 'noneOf', label: 'None of'}
              ].map(option => (
                <button
                  key={option.value}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-sm hover:bg-neutral-700 font-mono ${operator === option.value ? 'bg-neutral-700' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOperator(option.value as FilterClause['op']);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-xs text-neutral-300 mb-1">Value</label>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="w-full bg-neutral-700 border border-neutral-600 rounded p-2 text-sm text-white font-mono h-20 resize-none"
          placeholder={operator === 'anyOf' || operator === 'noneOf' ? '[value1, value2, ...]' : 'Enter value (e.g. "text", 123, true)'}
        />
        <p className="text-xs text-neutral-400 mt-1">
          For arrays or objects, use valid JSON format
        </p>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-xs"
        >
          Cancel
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleApply();
          }}
          className={`px-3 py-1.5 hover:bg-[#3f529599] bg-[#3f5295] text-white rounded text-xs`}
        >
          {isEditing ? 'Update Filter' : 'Apply Filter'}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default FilterMenu; 