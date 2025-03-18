import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TableDocument } from '../../types';
import { UI_DEFAULTS, STORAGE_KEYS } from '../../utils/constants';
import { parseFieldValue, isFieldEditable } from '../../utils/documentEditing';
import { EllipsisIcon, XIcon } from '../../components/icons';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { json } from '@codemirror/lang-json';

//=========================================================================
// TYPES & INTERFACES
//=========================================================================

interface DetailPanelProps {
  document: TableDocument;
  tableName: string;
  onClose: () => void;
  formatValue: (value: any, fieldName?: string) => string;
  onUpdateDocument?: (params: { table: string, ids: string[], fields: Record<string, any> }) => Promise<void>;
  onDeleteDocument?: (params: { table: string, ids: string[] }) => Promise<void>;
}

interface DocumentEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

interface HeaderMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onEditAsJson: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  deleteConfirmationActive: boolean;
  hasUpdatePermission: boolean;
  hasDeletePermission: boolean;
}

//=========================================================================
// SUB-COMPONENTS
//=========================================================================

// JSON Document Editor with CodeMirror
const DocumentEditor: React.FC<DocumentEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  isSaving
}) => {
  const [isFormatHovered, setIsFormatHovered] = useState(false);
  
  return (
    <div className="convex-panel-full-document-editor">
      <div className="convex-panel-full-document-editor-container" style={{
        position: 'relative',
        border: 'none',
        borderRadius: '4px',
        overflow: 'hidden',
        height: '460px',
      }}>
        <CodeMirror
          value={value}
          height="460px"
          theme={vscodeDark}
          extensions={[json()]}
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            bracketMatching: true,
            autocompletion: true,
            closeBrackets: true,
            highlightSelectionMatches: true
          }}
        />
      </div>
      
      <div className="convex-panel-full-document-actions" style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '12px',
        gap: '8px'
      }}>
        <div 
          className="convex-panel-detail-cancel-btn" 
          onClick={onCancel}
          style={{ cursor: isSaving ? 'default' : 'pointer' }}
        >
          Cancel
        </div>
        <div 
          className="convex-panel-live-button" 
          onClick={onSave}
          style={{ cursor: isSaving ? 'default' : 'pointer' }}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </div>
      </div>
    </div>
  );
};

// Header Menu with Edit and Delete Options
const HeaderMenu: React.FC<HeaderMenuProps> = ({
  isOpen,
  onToggle,
  onEditAsJson,
  onDelete,
  isDeleting,
  deleteConfirmationActive,
  hasUpdatePermission,
  hasDeletePermission
}) => {
  const [hoverItem, setHoverItem] = useState<string | null>(null);
  
  return (
    <div className="convex-panel-detail-menu dropdown">
      <div 
        className="convex-panel-detail-menu-button" 
        onClick={onToggle}
      >
        <EllipsisIcon />
      </div>
      
      {isOpen && (
        <div className="convex-panel-detail-dropdown dropdown-content" style={{
          backgroundColor: '#333',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
        }}>
          {hasUpdatePermission && (
            <div 
              className="convex-panel-detail-dropdown-item"
              onClick={onEditAsJson}
              onMouseEnter={() => setHoverItem('edit')}
              onMouseLeave={() => setHoverItem(null)}
              style={{
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px',
                cursor: 'pointer',
                borderRadius: '4px',
                margin: '4px',
                backgroundColor: hoverItem === 'edit' ? '#444' : 'transparent'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4V20H20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 2L22 6L12 16H8V12L18 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Edit as JSON</span>
            </div>
          )}
          
          {hasDeletePermission && (
            <div 
              className="convex-panel-detail-dropdown-item convex-panel-detail-dropdown-item-delete"
              onClick={onDelete}
              onMouseEnter={() => setHoverItem('delete')}
              onMouseLeave={() => setHoverItem(null)}
              style={{
                color: deleteConfirmationActive ? '#ff3b30' : undefined,
                fontWeight: deleteConfirmationActive ? 'bold' : undefined,
                backgroundColor: deleteConfirmationActive 
                  ? (hoverItem === 'delete' ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 59, 48, 0.1)')
                  : (hoverItem === 'delete' ? '#444' : 'transparent'),
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                borderRadius: '4px',
                margin: '4px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H21M19 6L18 20H6L5 6M10 10V16M14 10V16M8 6L9 2H15L16 6" 
                  stroke={deleteConfirmationActive ? "#ff3b30" : "currentColor"} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"/>
              </svg>
              <span>
                {isDeleting ? 'Deleting...' : 
                 deleteConfirmationActive ? 'Confirm Delete?' : 
                 'Delete'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

//=========================================================================
// UTILITIES
//=========================================================================

// SSR-safe useEffect that only runs on the client
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

//=========================================================================
// MAIN COMPONENT
//=========================================================================

const DetailPanel: React.FC<DetailPanelProps> = ({
  document,
  tableName,
  onClose,
  formatValue,
  onUpdateDocument,
  onDeleteDocument
}) => {
  if (!document) return null;

  // State for editing fields
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [panelWidth, setPanelWidth] = useState(() => {
    // Get saved width from localStorage or use default - ensure we're in a browser
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem(STORAGE_KEYS.DETAIL_PANEL_WIDTH);
      return savedWidth ? parseInt(savedWidth, 10) : UI_DEFAULTS.DETAIL_PANEL_DEFAULT_WIDTH;
    }
    return UI_DEFAULTS.DETAIL_PANEL_DEFAULT_WIDTH;
  });
  
  // New states for filter, dropdown, full document editing, and deletion
  const [fieldFilter, setFieldFilter] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingFullDocument, setIsEditingFullDocument] = useState(false);
  const [fullDocumentValue, setFullDocumentValue] = useState('');
  const [deleteConfirmationActive, setDeleteConfirmationActive] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Refs for element access
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter out the internal fields that start with _, except for _id
  const allVisibleFields = Object.keys(document)
    .filter(key => !key.startsWith('_') || key === '_id')
    .sort((a, b) => {
      // Keep id fields at the top
      if (a === '_id' || a === 'id') return -1;
      if (b === '_id' || b === 'id') return 1;
      
      // Name/email fields should come next
      const specialFields = ['name', 'firstName', 'lastName', 'title', 'email', 'emailAddress'];
      const aIsSpecial = specialFields.includes(a);
      const bIsSpecial = specialFields.includes(b);
      
      if (aIsSpecial && !bIsSpecial) return -1;
      if (!aIsSpecial && bIsSpecial) return 1;
      
      // Alphabetical order for the rest
      return a.localeCompare(b);
    });
  
  // Apply filter to fields
  const visibleFields = allVisibleFields.filter(field => 
    field.toLowerCase().includes(fieldFilter.toLowerCase())
  );
  
  // Get the document title from name, title or _id
  const documentTitle = document.name || document.title || document._id || 'Document Details';
  
  // Initialize full document JSON when editing mode is activated
  useEffect(() => {
    if (isEditingFullDocument) {
      setFullDocumentValue(JSON.stringify(document, null, 2));
    }
  }, [isEditingFullDocument, document]);
  
  // Handle delete confirmation timeout
  useEffect(() => {
    // Only execute this effect on the client-side
    if (typeof window === 'undefined') {
      return;
    }
    
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
  
  // Safe click outside handler
  useIsomorphicLayoutEffect(() => {
    if (!isDropdownOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    // This will only execute in the browser
    window.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);
  
  // Reset copy success message after a delay
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);
  
  // Focus input when editing starts
  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      // Place cursor at the end of text
      inputRef.current.selectionStart = inputRef.current.value.length;
      inputRef.current.selectionEnd = inputRef.current.value.length;
    }
  }, [editingField]);
  
  // Save panel width on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DETAIL_PANEL_WIDTH, panelWidth.toString());
    }
  }, [panelWidth]);
  
  // Handle field click to start editing
  const handleFieldClick = (field: string, value: any) => {
    // Check if field is editable
    if (!isFieldEditable(field, value)) {
      return;
    }
    
    setEditingField(field);
    setEditValue(value !== null && value !== undefined ? value.toString() : '');
  };
  
  // Handle saving edited value
  const handleSave = async () => {
    if (!editingField || !onUpdateDocument) return;
    
    setIsSaving(true);
    
    try {
      // Find the original value to determine its type
      const originalValue = document[editingField];
      const parsedValue = parseFieldValue(editValue, originalValue);
      
      // Call the API to update the document
      await onUpdateDocument({
        table: tableName,
        ids: [document._id],
        fields: { [editingField]: parsedValue }
      });
      
      // Clear editing state after successful update
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update document:', error);
      // Keep editing state on error to allow retrying
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle saving full document edit
  const handleSaveFullDocument = async () => {
    if (!onUpdateDocument) return;
    
    setIsSaving(true);
    
    try {
      // Parse the JSON string to an object
      const updatedDoc = JSON.parse(fullDocumentValue);
      
      // Extract only the fields that have changed
      const changedFields: Record<string, any> = {};
      
      Object.keys(updatedDoc).forEach(key => {
        // Skip _id field (can't be updated)
        if (key === '_id') return;
        
        // Only include changed fields
        if (JSON.stringify(updatedDoc[key]) !== JSON.stringify(document[key])) {
          changedFields[key] = updatedDoc[key];
        }
      });
      
      if (Object.keys(changedFields).length > 0) {
        // Call the API to update the document
        await onUpdateDocument({
          table: tableName,
          ids: [document._id],
          fields: changedFields
        });
      }
      
      // Exit editing mode
      setIsEditingFullDocument(false);
    } catch (error) {
      console.error('Failed to update document:', error);
      alert('Invalid JSON format or update failed. Please check your syntax and try again.');
      // Keep editing mode on error
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle deleting the document
  const handleDelete = async () => {
    if (!onDeleteDocument) return;
    
    if (!deleteConfirmationActive) {
      setDeleteConfirmationActive(true);
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await onDeleteDocument({
        table: tableName,
        ids: [document._id]
      });
      
      // Close the panel after successful deletion
      onClose();
    } catch (error) {
      console.error('Failed to delete document:', error);
      setDeleteConfirmationActive(false);
      setIsDeleting(false);
    }
  };
  
  // Handle canceling edit
  const handleCancel = () => {
    // setTimeout to ensure this runs in a new call stack
    setTimeout(() => {
      setEditingField(null);
      setEditValue('');
    }, 0);
  };
  
  // Handle canceling full document edit
  const handleCancelFullEdit = () => {
    setIsEditingFullDocument(false);
    setFullDocumentValue('');
  };
  
  // Handle input keydown events
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };
  
  // Copy field value to clipboard
  const copyToClipboard = (value: any, field: string) => {
    if (typeof window === 'undefined') return;
    
    const textToCopy = typeof value === 'object' ? 
      JSON.stringify(value, null, 2) : 
      String(value);
    
    // Use the Clipboard API if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopySuccess(field);
        })
        .catch((err) => {
          console.error('Failed to copy:', err);
        });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopySuccess(field);
        }
      } catch (err) {
        console.error('Fallback: Could not copy text:', err);
      }
      
      document.body.removeChild(textArea);
    }
  };
  
  // Function to render a value based on its type
  const renderValue = (value: any, field: string) => {
    // If currently editing this field
    if (editingField === field) {
      return (
        <div className="convex-panel-detail-field-edit">
          <input
            ref={inputRef}
            className="convex-panel-detail-field-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <div className="convex-panel-detail-field-actions">
            <div 
              className="convex-panel-detail-cancel-btn" 
              onClick={handleCancel}
              style={{ cursor: isSaving ? 'default' : 'pointer' }}
            >
              Cancel
            </div>
            <div 
              className="convex-panel-live-button" 
              onClick={handleSave}
              style={{ cursor: isSaving ? 'default' : 'pointer' }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </div>
          </div>
        </div>
      );
    }
    
    // Handle different field types and values for display
    if (value === null || value === undefined) {
      return <span className="convex-panel-empty-value">null</span>;
    }
    
    // Special handling for ID fields
    const isIdField = field === '_id' || field === 'id' || field.endsWith('Id');
    
    // Handle special fields
    const isTokenField = field === 'refreshToken' || field === 'accessToken' || field.includes('Token');
    const isTimestampField = field.includes('At') || field.includes('Date') || field.includes('Time');
    
    // Handle different value types
    let displayValue;
    if (typeof value === 'boolean') {
      displayValue = (
        <span className={value ? "convex-panel-true-value" : "convex-panel-false-value"}>
          {value.toString()}
        </span>
      );
    } else if (typeof value === 'object') {
      displayValue = <pre>{formatValue(value, field)}</pre>;
    } else if (isIdField || isTokenField) {
      displayValue = <span className="convex-panel-id-value">{value}</span>;
    } else if (isTimestampField && !isNaN(Number(value))) {
      // Format timestamp numbers to be more readable
      try {
        const date = new Date(Number(value));
        if (!isNaN(date.getTime())) {
          // If it's a valid date, return formatted version
          displayValue = date.toLocaleString();
        } else {
          displayValue = formatValue(value, field);
        }
      } catch (e) {
        // Fall back to original value if parsing fails
        displayValue = formatValue(value, field);
      }
    } else {
      displayValue = formatValue(value, field);
    }
    
    return (
      <div className="convex-panel-detail-field-value-wrapper">
        {displayValue}
        <div 
          className="convex-panel-detail-field-copy"
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(value, field);
          }}
          title="Copy to clipboard"
        >
          {copySuccess === field ? (
            <span className="convex-panel-copy-success">✓</span>
          ) : (
            <span className="convex-panel-copy-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3H4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 7H20V20H8V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
        </div>
      </div>
    );
  };
  
  // Handle resize functionality
  const initResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // Ensure we're in browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    const startX = e.clientX;
    const startWidth = panelWidth;
    
    const onMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth - (e.clientX - startX);
      const clampedWidth = Math.min(
        Math.max(newWidth, UI_DEFAULTS.DETAIL_PANEL_MIN_WIDTH),
        UI_DEFAULTS.DETAIL_PANEL_MAX_WIDTH
      );
      
      setPanelWidth(clampedWidth);
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [panelWidth]);
  
  return (
    <div 
      className="convex-panel-detail-panel"
      ref={panelRef}
      style={{ width: panelWidth }}
    >
      <div 
        className="convex-panel-detail-resize-handle"
        ref={resizeHandleRef}
        onMouseDown={initResize}
      />
      <div className="convex-panel-detail-header">
        <h3>{documentTitle}</h3>
        
        <div className="convex-panel-detail-header-actions">
          {/* Use HeaderMenu component */}
          <div style={{ display: "flex" }} ref={dropdownRef}>
            <HeaderMenu 
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
              onEditAsJson={() => {
                setIsDropdownOpen(false);
                setIsEditingFullDocument(true);
              }}
              onDelete={handleDelete}
              isDeleting={isDeleting}
              deleteConfirmationActive={deleteConfirmationActive}
              hasUpdatePermission={!!onUpdateDocument}
              hasDeletePermission={!!onDeleteDocument}
            />
          </div>
          
          <button 
            className="convex-panel-detail-close-button" 
            onClick={onClose}
            aria-label="Close details panel"
          >
            <XIcon />
          </button>
        </div>
      </div>
      
      {/* Content area - either full document editor or fields */}
      {isEditingFullDocument ? (
        <DocumentEditor
          value={fullDocumentValue}
          onChange={setFullDocumentValue}
          onSave={handleSaveFullDocument}
          onCancel={handleCancelFullEdit}
          isSaving={isSaving}
        />
      ) : (
        <>
          {/* Filter input */}
          <div className="convex-panel-detail-filter">
            <input
              type="text"
              placeholder="Search fields..."
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="convex-panel-sidebar-search"
            />
            {fieldFilter && (
              <div 
                className="convex-panel-detail-filter-clear" 
                onClick={() => setFieldFilter('')}
                title="Clear filter"
              >
                ×
              </div>
            )}
          </div>
          
          <div className="convex-panel-detail-content">
            {visibleFields.length === 0 ? (
              <div className="convex-panel-detail-no-results">
                No fields match your filter
              </div>
            ) : (
              visibleFields.map(field => {
                const value = document[field];
                const canEdit = onUpdateDocument && isFieldEditable(field, value);
                
                return (
                  <div key={field} className="convex-panel-detail-field">
                    <div className="convex-panel-detail-field-name">
                      {field}
                    </div>
                    <div 
                      className={`convex-panel-detail-field-value ${canEdit ? 'editable' : ''}`}
                      onClick={canEdit ? () => handleFieldClick(field, value) : undefined}
                    >
                      {renderValue(value, field)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DetailPanel; 