import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FilterMenuProps, FilterClause } from '../../types';
import { operatorOptions, typeOptions } from '../../utils/constants';
import { ChevronDownIcon } from '../../components/icons';

/**
 * Get portal container.
 */
const getPortalContainer = () => {
  let container = document.getElementById('portal-root');
  console.log("Looking for portal-root, exists:", !!container);
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'portal-root';
    container.className = 'convex-panel-container';
    document.body.appendChild(container);
    console.log("Created new portal-root container:", container);
  }
  
  // Ensure the container is visible and correctly positioned
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  
  return container;
};

/**
 * Filter menu.
 */
const FilterMenu: React.FC<FilterMenuProps> = ({ 
  /**
   * The field to which the filter is applied.
   * Used to identify the column or attribute being filtered.
   * @required
   */
  field, 

  /**
   * The position of the filter menu.
   * Determines where the filter menu is displayed on the screen.
   * @required
   */
  position, 

  /**
   * Callback function to apply the filter.
   * Called when the user applies the filter.
   * Receives the filter clause as a parameter.
   * @param filter FilterClause
   */
  onApply, 

  /**
   * Callback function to close the filter menu.
   * Called when the user closes the filter menu.
   */
  onClose, 

  /**
   * The existing filter clause, if any.
   * Used to pre-populate the filter menu with existing filter values.
   * @optional
   */
  existingFilter,

  /**
   * Theme customization object to override default styles.
   * Supports customizing colors, spacing, and component styles.
   * See ThemeClasses interface for available options.
   * @default {}
   */
  theme = {}
}) => {
  const isInternalClickRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const [operator, setOperator] = useState<FilterClause['op']>(existingFilter?.op || 'eq');
  const [value, setValue] = useState<string>(existingFilter?.value !== undefined ? JSON.stringify(existingFilter.value) : '');
  const [isEditing, setIsEditing] = useState<boolean>(!!existingFilter);
  const [isOpen, setIsOpen] = useState(false);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);

  /**
   * Handle click outside to close the menu.
   */
  useEffect(() => {
    console.log("FilterMenu mounted with position:", position, "and field:", field);
    
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

  /**
   * Handle dropdown click outside.
   */
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

  /**
   * Handle apply filter.
   */
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

  /**
   * Handle cancel.
   */
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  /**
   * Handle dropdown toggle.
   */
  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Mark this as an internal click
    isInternalClickRef.current = true;
    setIsOpen(!isOpen);
  };

  /**
   * Handle option select.
   */
  const handleOptionSelect = (optionValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Mark this as an internal click
    isInternalClickRef.current = true;
    setOperator(optionValue as FilterClause['op']);
    setIsOpen(false);
  };

  /**
   * Handle mousedown inside the menu to prevent it from closing.
   */
  const handleMenuMouseDown = (e: React.MouseEvent) => {
    // Mark this as an internal click
    isInternalClickRef.current = true;
    e.stopPropagation();
  };

  /**
   * Handle type filter toggle.
   */
  const handleTypeFilterToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isInternalClickRef.current = true;
    setIsTypeFilterOpen(!isTypeFilterOpen);
  };

  /**
   * Handle type select.
   */
  const handleTypeSelect = (typeValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isInternalClickRef.current = true;
    setValue(typeValue);
    setIsTypeFilterOpen(false);
  };

  /**
   * Update effect to handle type filter dropdown.
   */
  useEffect(() => {
    console.log("FilterMenu mounted with position:", position, "and field:", field);
    
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
  }, [isTypeFilterOpen, position, field]);

  console.log("Rendering filter menu at position:", position);
  
  // For better compatibility, render directly rather than through a portal
  return (
    <div 
      ref={menuRef}
      className="convex-panel-filter-menu"
      style={{
        position: 'fixed', 
        width: '300px',
        background: '#1e1e1e',
        border: '1px solid #444',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        padding: '16px',
        color: '#fff',
        fontSize: '14px',
        pointerEvents: 'auto',
        zIndex: 100000
      }}
      onClick={(e) => {
        console.log("Filter menu clicked");
        e.stopPropagation();
      }}
      onMouseDown={handleMenuMouseDown}
    >
      <div className="convex-panel-filter-menu-title" style={{ 
        marginBottom: '16px', 
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ccc'
      }}>
        Filter: {field}
      </div>
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
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #444',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left'
            }}
          >
            <span>
              {operatorOptions.find(opt => opt.value === operator)?.label || 'Select operation'}
            </span>
            <ChevronDownIcon />
          </button>
          
          {isOpen && (
            <div 
              className="convex-panel-filter-menu-dropdown-content"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                backgroundColor: '#222',
                border: '1px solid #444',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                marginTop: '4px',
                zIndex: 1001,
                maxHeight: '200px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                padding: '4px'
              }}
            >
              {operatorOptions.map(option => (
                <button
                  type="button"
                  key={option.value}
                  className={`convex-panel-filter-menu-option ${operator === option.value ? 'convex-panel-filter-menu-option-selected' : ''}`}
                  onClick={(e) => handleOptionSelect(option.value, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    backgroundColor: operator === option.value ? '#444' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #333',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    display: 'block',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#444';
                  }}
                  onMouseLeave={(e) => {
                    if (operator !== option.value) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    }
                  }}
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
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left'
              }}
            >
              <span>
                {typeOptions.find(opt => opt.value === value)?.label || 'Select type'}
              </span>
              <ChevronDownIcon />
            </button>
            
            {isTypeFilterOpen && (
              <div 
                className="convex-panel-filter-menu-dropdown-content"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '100%',
                  backgroundColor: '#222',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  marginTop: '4px',
                  zIndex: 1001,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '4px'
                }}
              >
                {typeOptions.map(option => (
                  <button
                    type="button"
                    key={option.value}
                    className={`convex-panel-filter-menu-option ${value === option.value ? 'convex-panel-filter-menu-option-selected' : ''}`}
                    onClick={(e) => handleTypeSelect(option.value, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      backgroundColor: value === option.value ? '#444' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #333',
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      display: 'block',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#444';
                    }}
                    onMouseLeave={(e) => {
                      if (value !== option.value) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                      }
                    }}
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
              placeholder='Enter value (e.g. "text", 123, true)'
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #444',
                borderRadius: '4px',
                resize: 'vertical',
                minHeight: '100px',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
            />
            <p className="convex-panel-filter-menu-hint" style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
              For arrays or objects, use valid JSON format
            </p>
          </>
        )}
      </div>
      
      <div className="convex-panel-filter-menu-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px' }}>
        <button
          type="button"
          onClick={handleCancel}
          onMouseDown={(e) => e.stopPropagation()}
          className="convex-panel-clear-button"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#555';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#444';
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          onMouseDown={(e) => e.stopPropagation()}
          className="convex-panel-live-button"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3b56e4';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4863f7';
          }}
        >
          {isEditing ? 'Update Filter' : 'Apply Filter'}
        </button>
      </div>
    </div>
  );
};

export default FilterMenu;