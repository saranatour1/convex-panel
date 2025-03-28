import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { TableDocument } from '../../types';
import { deleteDocuments } from '../../utils/functions';
import { ConvexClient } from 'convex/browser';
import { useGlobalHotkeys, formatShortcut } from '../../hooks/useGlobalHotkeys';

export interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  doc: TableDocument;
  field: string;
  value: any;
  onView: (doc: TableDocument, field: string) => void;
  onEdit: (doc: TableDocument, field: string) => void;
  onFilter: (field: string, filterConfig: { op: string; value: any }) => void;
  onDelete?: (doc: TableDocument) => Promise<boolean>;
  theme?: {
    menuBackground?: string;
    menuTextColor?: string;
    menuContainer?: React.CSSProperties;
  };
  tableName: string;
  onInvalidateShapes?: () => Promise<void>;
  componentId?: string | null;
  adminClient?: ConvexClient | null;
}

const getFilterOptions = (value: any) => {
  if (typeof value === 'string') {
    return [
      { label: 'equals', op: 'eq' },
      { label: 'not equal', op: 'neq' },
      { label: 'is string', op: 'type', value: 'string' },
      { label: 'is not string', op: 'notype', value: 'string' }
    ];
  }
  if (typeof value === 'number') {
    const formattedValue = new Date(value).toLocaleString();
    const isTimestamp = value > 1000000000000; // Basic check for timestamp (> year 2001)
    if (isTimestamp) {
      return [
        { label: `after ${formattedValue}`, op: 'gt', value },
        { label: `before ${formattedValue}`, op: 'lt', value },
        { label: `on or after ${formattedValue}`, op: 'gte', value },
        { label: `on or before ${formattedValue}`, op: 'lte', value }
      ];
    }
    return [
      { label: `equals ${value}`, op: 'eq' },
      { label: `not equal ${value}`, op: 'neq' },
      { label: `greater than ${value}`, op: 'gt' },
      { label: `less than ${value}`, op: 'lt' },
      { label: `greater or equal ${value}`, op: 'gte' },
      { label: `less or equal ${value}`, op: 'lte' }
    ];
  }
  if (typeof value === 'boolean') {
    return [
      { label: 'equals true', op: 'eq', value: true },
      { label: 'equals false', op: 'eq', value: false },
      { label: 'is boolean', op: 'type', value: 'boolean' },
      { label: 'is not boolean', op: 'notype', value: 'boolean' }
    ];
  }
  if (value === null) {
    return [
      { label: 'is null', op: 'eq', value: null },
      { label: 'is not null', op: 'neq', value: null }
    ];
  }
  if (Array.isArray(value)) {
    return [
      { label: 'is array', op: 'type', value: 'array' },
      { label: 'is not array', op: 'notype', value: 'array' }
    ];
  }
  if (typeof value === 'object') {
    return [
      { label: 'is object', op: 'type', value: 'object' },
      { label: 'is not object', op: 'notype', value: 'object' }
    ];
  }
  return [
    { label: 'equals', op: 'eq' },
    { label: 'not equal', op: 'neq' }
  ];
};

const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  onClose,
  doc,
  field,
  value,
  onView,
  onEdit,
  onFilter,
  onDelete,
  theme = {},
  tableName,
  onInvalidateShapes,
  componentId = null,
  adminClient = null
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showFilterSubmenu, setShowFilterSubmenu] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [submenuDirection, setSubmenuDirection] = useState<'right' | 'left'>('right');
  const [hoverItem, setHoverItem] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationActive, setDeleteConfirmationActive] = useState(false);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  const positionRef = useRef(position);

  // Handle delete confirmation timeout
  useEffect(() => {
    if (deleteConfirmationActive) {
      deleteTimerRef.current = setTimeout(() => {
        setDeleteConfirmationActive(false);
      }, 5000);
      
      return () => {
        if (deleteTimerRef.current) {
          clearTimeout(deleteTimerRef.current);
        }
      };
    }
  }, [deleteConfirmationActive]);

  const handleDelete = async () => {
    if (!deleteConfirmationActive) {
      setDeleteConfirmationActive(true);
      return;
    }

    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(doc);
      } else if (doc._id) {
        const resp = await deleteDocuments(
          tableName,
          [doc._id],
          adminClient,
          componentId
        );

        if (!resp?.success) {
          console.error("Failed to delete document:", resp?.error);
        } else {
          console.log("Document deleted successfully");
          if (onInvalidateShapes) {
            await onInvalidateShapes();
          }
        }
      } else {
        throw new Error('Document ID is required for deletion');
      }
      onClose();
    } catch (error) {
      console.error('Failed to delete document:', error);
      setIsDeleting(false);
      setDeleteConfirmationActive(false);
    }
  };

  const handleFilterClick = () => {
    const filterOptions = getFilterOptions(value);
    console.log('[ContextMenu] Filter options:', filterOptions);
    
    if (filterOptions.length > 0) {
      console.log('[ContextMenu] Applying filter:', {
        field,
        op: filterOptions[0].op,
        value: filterOptions[0].value ?? value
      });
      onFilter(field, {
        op: filterOptions[0].op,
        value: filterOptions[0].value ?? value
      });
    }
    onClose();
  };

  // Format value for display
  const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  const isEditable = !['_id', 'userId'].includes(field) && !field.endsWith('Id') && !field.startsWith('_');
  const filterOptions = getFilterOptions(value);

  // Position adjustment effect
  useLayoutEffect(() => {
    if (positionRef.current.x !== position.x || positionRef.current.y !== position.y) {
      positionRef.current = position;
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        let x = position.x;
        let y = position.y;
        
        // Ensure menu stays within right boundary
        if (x + rect.width > window.innerWidth) {
          x = window.innerWidth - rect.width - 10;
        }
        
        // Ensure menu stays within left boundary
        if (x < 10) {
          x = 10;
        }
        
        // Ensure menu stays within bottom boundary
        if (y + rect.height > window.innerHeight) {
          y = window.innerHeight - rect.height - 10;
        }
        
        // Ensure menu stays within top boundary
        if (y < 10) {
          y = 10;
        }
        
        setSubmenuDirection(x + rect.width + 200 > window.innerWidth ? 'left' : 'right');
        if (x !== adjustedPosition.x || y !== adjustedPosition.y) {
          setAdjustedPosition({ x, y });
        }
      }
    }
  }, [position]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.document.addEventListener('mousedown', handleClickOutside);
    window.document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside);
      window.document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Copy handlers
  const handleCopyValue = () => {
    navigator.clipboard.writeText(typeof value === 'string' ? value : JSON.stringify(value));
    onClose();
  };

  const handleCopyDocument = () => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    onClose();
  };

  // Setup global hotkeys
  useGlobalHotkeys({
    onView: onView,
    onEdit: onEdit,
    onCopy: handleCopyValue,
    onViewDoc: (doc) => { onView(doc, '_id'); onClose(); },
    onEditDoc: (doc) => { onEdit(doc, '_id'); onClose(); },
    onCopyDoc: handleCopyDocument,
    onClose,
    currentDoc: doc,
    currentField: field,
  });

  const menuItemStyle: React.CSSProperties = {
    padding: '6px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: theme.menuTextColor || '#E1E1E1',
    position: 'relative',
    transition: 'all 0.2s',
    borderRadius: '4px',
  };

  const iconStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7
  };

  const shortcutStyle: React.CSSProperties = {
    marginLeft: 'auto',
    opacity: 0.5,
    fontSize: '12px',
    fontFamily: 'monospace'
  };

  return (
    <div 
      ref={menuRef}
      className="convex-panel-context-menu"
      style={{
        position: 'fixed',
        top: `${adjustedPosition.y}px`,
        left: `${adjustedPosition.x}px`,
        backgroundColor: theme.menuBackground || '#333',
        color: theme.menuTextColor || '#E1E1E1',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
        zIndex: 2147483647,
        minWidth: '200px',
        padding: '4px',
        fontSize: '13px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        border: 'none',
        ...theme.menuContainer
      }}
    >
      {/* View option */}
      <div 
        style={{
          ...menuItemStyle,
          backgroundColor: hoverItem === 'view' ? '#444' : 'transparent'
        }}
        onClick={() => { onView(doc, field); onClose(); }}
        onMouseEnter={() => {
          setHoverItem('view');
          setShowFilterSubmenu(false);
        }}
        onMouseLeave={() => setHoverItem(null)}
      >
        <span style={iconStyle}>⊡</span>
        View {field}
        <span style={shortcutStyle}>{formatShortcut('space')}</span>
      </div>

      {/* Copy option */}
      <div 
        style={{
          ...menuItemStyle,
          backgroundColor: hoverItem === 'copy' ? '#444' : 'transparent'
        }}
        onClick={handleCopyValue}
        onMouseEnter={() => {
          setHoverItem('copy');
          setShowFilterSubmenu(false);
        }}
        onMouseLeave={() => setHoverItem(null)}
      >
        <span style={iconStyle}>⎘</span>
        Copy {field}
        <span style={shortcutStyle}>{formatShortcut('meta+c')}</span>
      </div>

      {/* Edit option */}
      {isEditable && (
        <div 
          style={{
            ...menuItemStyle,
            backgroundColor: hoverItem === 'edit' ? '#444' : 'transparent'
          }}
          onClick={() => { onEdit(doc, field); onClose(); }}
          onMouseEnter={() => {
            setHoverItem('edit');
            setShowFilterSubmenu(false);
          }}
          onMouseLeave={() => setHoverItem(null)}
        >
          <span style={iconStyle}>✎</span>
          Edit {field}
          <span style={shortcutStyle}>{formatShortcut('return')}</span>
        </div>
      )}

      {/* Filter option */}
      <div 
        style={{
          ...menuItemStyle,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          marginTop: '4px',
          paddingTop: '8px',
          backgroundColor: hoverItem === 'filter' ? '#444' : 'transparent'
        }}
        onMouseEnter={() => {
          setHoverItem('filter');
          setShowFilterSubmenu(true);
        }}
        onMouseLeave={() => setHoverItem(null)}
        onClick={handleFilterClick}
      >
        <span style={iconStyle}>⊃</span>
        Filter by {field}
        <span style={shortcutStyle}>▶</span>
      </div>

      {/* Filter submenu */}
      {showFilterSubmenu && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            [submenuDirection === 'right' ? 'left' : 'right']: '100%',
            backgroundColor: theme.menuBackground || '#333',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            border: 'none',
            padding: '4px',
            minWidth: '200px'
          }}
        >
          {filterOptions.map((option, index) => (
            <div
              key={index}
              style={{
                ...menuItemStyle,
                backgroundColor: hoverItem === `filter-${index}` ? '#444' : 'transparent'
              }}
              onMouseEnter={() => setHoverItem(`filter-${index}`)}
              onMouseLeave={() => setHoverItem(null)}
              onClick={() => {
                onFilter(field, { op: option.op, value: 'value' in option ? option.value : value });
                onClose();
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

      {/* Document actions */}
      <div style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '4px',
        paddingTop: '4px'
      }}>
        <div 
          style={{
            ...menuItemStyle,
            backgroundColor: hoverItem === 'viewDoc' ? '#444' : 'transparent'
          }}
          onClick={() => { onView(doc, '_id'); onClose(); }}
          onMouseEnter={() => {
            setHoverItem('viewDoc');
            setShowFilterSubmenu(false);
          }}
          onMouseLeave={() => setHoverItem(null)}
        >
          <span style={iconStyle}>⊡</span>
          View Document
          <span style={shortcutStyle}>{formatShortcut('shift+space')}</span>
        </div>
        <div 
          style={{
            ...menuItemStyle,
            backgroundColor: hoverItem === 'copyDoc' ? '#444' : 'transparent'
          }}
          onClick={handleCopyDocument}
          onMouseEnter={() => {
            setHoverItem('copyDoc');
            setShowFilterSubmenu(false);
          }}
          onMouseLeave={() => setHoverItem(null)}
        >
          <span style={iconStyle}>⎘</span>
          Copy Document
          <span style={shortcutStyle}>{formatShortcut('shift+meta+c')}</span>
        </div>
        <div 
          style={{
            ...menuItemStyle,
            backgroundColor: hoverItem === 'editDoc' ? '#444' : 'transparent'
          }}
          onClick={() => { onEdit(doc, '_id'); onClose(); }}
          onMouseEnter={() => {
            setHoverItem('editDoc');
            setShowFilterSubmenu(false);
          }}
          onMouseLeave={() => setHoverItem(null)}
        >
          <span style={iconStyle}>✎</span>
          Edit Document
          <span style={shortcutStyle}>{formatShortcut('shift+return')}</span>
        </div>
        <div 
          style={{
            ...menuItemStyle,
            color: deleteConfirmationActive ? '#FF4444' : undefined,
            fontWeight: deleteConfirmationActive ? 'bold' : undefined,
            backgroundColor: deleteConfirmationActive 
              ? (hoverItem === 'deleteDoc' ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)')
              : (hoverItem === 'deleteDoc' ? '#444' : 'transparent')
          }}
          onClick={handleDelete}
          onMouseEnter={() => {
            setHoverItem('deleteDoc');
            setShowFilterSubmenu(false);
          }}
          onMouseLeave={() => setHoverItem(null)}
        >
          <span style={{...iconStyle, color: deleteConfirmationActive ? '#FF4444' : undefined}}>🗑</span>
          {isDeleting ? 'Deleting...' : 
           deleteConfirmationActive ? 'Click to confirm' : 
           'Delete Document'}
        </div>
      </div>
    </div>
  );
};

export default ContextMenu;
