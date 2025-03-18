import React, { useState } from 'react';

// JsonView component that mimics Chrome DevTools console object display
export const JsonView: React.FC<{ data: any }> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };
  
  // Handle primitive values
  if (data === null) {
    return <span className="json-null">null</span>;
  }
  
  if (data === undefined) {
    return <span className="json-undefined">undefined</span>;
  }
  
  if (typeof data === 'string') {
    return <span className="json-string">{data}</span>;
  }
  
  if (typeof data === 'number') {
    return <span className="json-number">{data}</span>;
  }
  
  if (typeof data === 'boolean') {
    return <span className="json-boolean">{String(data)}</span>;
  }
  
  if (typeof data === 'function') {
    return <span className="json-function">ƒ() {"{...}"}</span>;
  }
  
  if (typeof data !== 'object') {
    return <span>{String(data)}</span>;
  }
  
  // Handle DOM Elements
  if (typeof window !== 'undefined' && window.Element && data instanceof Element) {
    return <span className="json-string">{data.tagName.toLowerCase()}</span>;
  }
  
  // Handle Error objects
  if (data instanceof Error) {
    return (
      <div className="json-view cursor-pointer">
        <div className="json-row" onClick={toggle}>
          <span className="json-toggle">{expanded ? '▼' : '▶'}</span>
          <span className="json-type">
            {data.name}: {data.message}
          </span>
        </div>
        
        {expanded && (
          <div className="json-children">
            <div className="json-property">
              <span className="json-key">message: </span>
              <span className="json-string">{data.message}</span>
            </div>
            <div className="json-property">
              <span className="json-key">stack: </span>
              <span className="json-string">{data.stack}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Handle arrays and objects
  const isArray = Array.isArray(data);
  const isEmpty = Object.keys(data).length === 0;
  
  if (isEmpty) {
    return <span className="json-type">{isArray ? '[]' : '{}'}</span>;
  }
  
  // Generate a preview of the object contents
  const getPreview = () => {
    if (isArray) {
      // For arrays, show first few elements
      const previewItems = data.slice(0, 3).map((item: any) => {
        if (item === null) return 'null';
        if (item === undefined) return 'undefined';
        if (typeof item === 'string') return item;
        if (typeof item === 'function') return 'ƒ';
        if (typeof item === 'object') {
          if (Array.isArray(item)) return '(…)';
          return '{…}';
        }
        return String(item);
      });
      
      return previewItems.join(', ') + (data.length > 3 ? ', …' : '');
    } else {
      // For objects, show key-value pairs
      const keys = Object.keys(data).slice(0, 3);
      const previewItems = keys.map(key => {
        const value = data[key];
        let valueStr = '';
        
        if (value === null) valueStr = 'null';
        else if (value === undefined) valueStr = 'undefined';
        else if (typeof value === 'string') valueStr = value.length > 10 ? value.substring(0, 10) + '…' : value;
        else if (typeof value === 'function') valueStr = 'ƒ';
        else if (typeof value === 'object') {
          if (Array.isArray(value)) valueStr = 'Array(…)';
          else valueStr = '{…}';
        } else valueStr = String(value);
        
        return `${key}: ${valueStr}`;
      });
      
      return previewItems.join(', ') + (Object.keys(data).length > 3 ? ', …' : '');
    }
  };
  
  return (
    <div className="json-view">
      <div className="json-row" onClick={toggle}>
        <span className="json-toggle">{expanded ? '▼' : '▶'}</span>
        <span className="json-type">
          {isArray ? `Array(${data.length})` : `Object`}
        </span>
        {!expanded && (
          <span className="json-preview">
            {isArray ? ` [${getPreview()}]` : ` {${getPreview()}}`}
          </span>
        )}
      </div>
      
      {expanded && (
        <div className="json-children">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="json-property">
              <span className="json-key">{key}: </span>
              <JsonView data={value} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 