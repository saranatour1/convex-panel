import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  FolderIcon,
  FolderOpenIcon,
  LockIcon,
  FunctionIcon,
  CodeBracketIcon
} from '../components/icons';
import { FileOrFolder } from '../types';
import { useFunctionsState } from './FunctionsProvider';
import { Tooltip } from '../components/Tooltip';

interface TreeItemProps {
  item: FileOrFolder;
  level?: number;
  searchTerm?: string;
  isSidebarCollapsed?: boolean;
}

function matchesSearch(name: string, searchTerm: string): boolean {
  return name.toLowerCase().includes(searchTerm.toLowerCase());
}

function hasMatchingChild(item: FileOrFolder, searchTerm: string): boolean {
  if (!searchTerm) return true;
  
  if (matchesSearch(item.name, searchTerm)) return true;

  if (item.type === 'folder' && item.children) {
    return item.children.some(child => hasMatchingChild(child, searchTerm));
  }

  if (item.type === 'file' && item.functions) {
    return item.functions.some(fn => matchesSearch(fn.name, searchTerm));
  }

  return false;
}

function FolderItem({ item, level = 0, searchTerm = '', isSidebarCollapsed = false }: TreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (item.type !== 'folder' || !item.children) {
    return null;
  }

  // Don't render if no matches in this branch during search
  if (searchTerm && !hasMatchingChild(item, searchTerm)) {
    return null;
  }

  const icon = isOpen ? (
    <FolderOpenIcon className="convex-panel-tree-icon" />
  ) : (
    <FolderIcon className="convex-panel-tree-icon" />
  );

  return (
    <div>
      <div
        className="convex-panel-tree-folder"
        style={{ paddingLeft: isSidebarCollapsed ? '8px' : `${level * 8}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', paddingLeft: '8px' }}>
          {isSidebarCollapsed ? (
            <Tooltip content={item.name}>
              {icon}
            </Tooltip>
          ) : (
            <>
              {icon}
              <span className="convex-panel-function-text">{item.name}</span>
            </>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="convex-panel-tree-folder-content">
          {item.children.map((child, index) => (
            <TreeItem 
              key={`${child.name}-${index}`} 
              item={child} 
              level={level + 1}
              searchTerm={searchTerm}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileItem({ item, level = 0, searchTerm = '', isSidebarCollapsed = false }: TreeItemProps) {
  const { selectedFunction, setSelectedFunction } = useFunctionsState();
  const [isOpen, setIsOpen] = useState(true);

  if (item.type !== 'file') {
    return null;
  }

  const fileFunctions = item.functions || [];
  const filteredFunctions = searchTerm
    ? fileFunctions.filter(fn => matchesSearch(fn.name, searchTerm))
    : fileFunctions;

  if (filteredFunctions.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        className="convex-panel-tree-folder"
        style={{ 
          paddingLeft: isSidebarCollapsed ? '8px' : `${level * 8}px`,
          position: 'relative'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', paddingLeft: '8px' }}>
          {isSidebarCollapsed ? (
            <Tooltip content={item.name}>
              <CodeBracketIcon className="convex-panel-tree-code-icon" />
            </Tooltip>
          ) : (
            <>
              <CodeBracketIcon className="convex-panel-tree-code-icon" />
              <span className="convex-panel-function-text">{item.name}</span>
            </>
          )}
        </div>
      </div>
      {isOpen && (
        <div style={{ 
          borderLeft: isSidebarCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          marginLeft: isSidebarCollapsed ? '15px' : `${level * 8 + 7}px`,
          paddingLeft: isSidebarCollapsed ? '0' : '4px'
        }}>
          {filteredFunctions.map((fn) => (
            <div
              key={fn.identifier}
              className={`convex-panel-tree-item ${selectedFunction?.identifier === fn.identifier ? 'active' : ''}`}
              style={{ paddingLeft: isSidebarCollapsed ? '8px' : `${level * 8}px` }}
              onClick={() => setSelectedFunction(fn)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {isSidebarCollapsed ? (
                  <Tooltip content={fn.name}>
                    <FunctionIcon className="convex-panel-tree-icon" />
                  </Tooltip>
                ) : (
                  <>
                    <FunctionIcon className="convex-panel-tree-icon" />
                    <span className="convex-panel-function-text">{fn.name}</span>
                  </>
                )}
              </div>
              {fn.visibility.kind === 'internal' && (
                <LockIcon className="convex-panel-tree-lock-icon" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TreeItem(props: TreeItemProps) {
  const { item } = props;
  return item.type === 'folder' ? (
    <FolderItem {...props} />
  ) : (
    <FileItem {...props} />
  );
}

interface FileTreeProps {
  tree: FileOrFolder[];
  isSidebarCollapsed?: boolean;
}

export function FileTree({ tree, isSidebarCollapsed = false }: FileTreeProps) {
  const { searchTerm } = useFunctionsState();

  if (!tree.length) {
    return (
      <div className="convex-panel-empty">
        {searchTerm ? (
          <p>No functions match your search</p>
        ) : (
          <p>No functions found. Add functions to your project to see them here.</p>
        )}
      </div>
    );
  }

  return (
    <div className="convex-panel-tree">
      {tree.map((item, index) => (
        <TreeItem 
          key={`${item.name}-${index}`} 
          item={item} 
          searchTerm={searchTerm}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      ))}
    </div>
  );
} 