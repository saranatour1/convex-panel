import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { FileOrFolder, ModuleFunction, File, Folder, UdfType } from '../types';
import { fetchFunctionSpec } from '../utils/api';

// HTTP methods supported by Convex
export const ROUTABLE_HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "OPTIONS",
  "PATCH",
] as const;

export function displayNameToIdentifier(path: string) {
  // HTTP actions are special-cased top-level functions
  for (const method of ROUTABLE_HTTP_METHODS) {
    if (path.startsWith(`${method} `)) {
      let route = path.substring(method.length + 1);
      try {
        const url = new URL(route);
        route = url.pathname + url.search + url.hash;
      } catch (e) {
        // Not a valid URL, keep route as is
      }
      return `${method} ${route}`;
    }
  }

  let filePath = "";
  let exportName: string = "default";

  if (path.includes(":")) {
    [filePath, exportName] = path.split(":");
  } else {
    filePath = path;
  }
  if (!filePath.endsWith(".js")) {
    filePath = `${filePath}.js`;
  }

  return `${filePath}:${exportName}`;
}

interface FunctionsContextType {
  selectedFunction: ModuleFunction | null;
  setSelectedFunction: (fn: ModuleFunction | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  rootEntries: FileOrFolder[];
  modules: Map<string, ModuleFunction[]>;
  isLoading: boolean;
  error: string | null;
  refreshFunctions: () => Promise<void>;
  executeFunction: (fn: ModuleFunction, args?: any) => Promise<any>;
  convexClient: any;
}

interface FunctionResponse {
  name: string;
  identifier: string;
  displayName: string;
  udfType: UdfType;
  file: {
    name: string;
    identifier: string;
  };
  sourceCode: string;
  visibility: {
    kind: 'public' | 'internal';
  };
}

const FunctionsContext = createContext<FunctionsContextType | null>(null);

export function FunctionsProvider({
  children,
  initialEntries = [],
  initialModules = new Map(),
  convexClient,
  authToken,
}: {
  children: React.ReactNode;
  initialEntries?: FileOrFolder[];
  initialModules?: Map<string, ModuleFunction[]>;
  convexClient?: any;
  authToken?: string;
}) {
  const [selectedFunction, setSelectedFunction] = useState<ModuleFunction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rootEntries, setRootEntries] = useState<FileOrFolder[]>(initialEntries);
  const [modules, setModules] = useState<Map<string, ModuleFunction[]>>(initialModules);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFunctions = async () => {
    if (!convexClient) {
      setError('Convex client not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch functions using the admin client
      const functions = await fetchFunctionSpec(convexClient, false);

      // Group functions by file path
      const moduleMap = new Map<string, ModuleFunction[]>();
      const fileMap = new Map<string, File>();
      const folderMap = new Map<string, Folder>();

      functions.forEach((fn) => {
        if (!fn.identifier) {
          return;
        }

        // Extract the module path and function name from the identifier
        // identifier format is like "accounts.js:patchAccountToken"
        const [modulePath, exportName] = fn.identifier.split(':');
        if (!modulePath || !exportName) {
          console.warn('Invalid identifier format:', fn.identifier);
          return;
        }

        // Remove .js extension for display
        const displayPath = modulePath.replace(/\.js$/, '');
        
        const moduleFunction: ModuleFunction = {
          name: exportName,
          identifier: fn.identifier,
          udfType: fn.functionType?.toLowerCase() as UdfType,
          file: {
            name: displayPath,
            path: displayPath,
          },
          sourceCode: '',
          visibility: {
            kind: fn.visibility?.kind || 'internal'
          },
        };

        // Create folder structure
        const parts = displayPath.split('/');
        let currentPath = '';

        // Create folder structure
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          currentPath = currentPath ? `${currentPath}/${part}` : part;

          if (!folderMap.has(currentPath)) {
            folderMap.set(currentPath, {
              type: 'folder',
              name: part,
              identifier: currentPath,
              children: [],
            });
          }
        }

        // Add file to its folder
        const fileName = parts[parts.length - 1];
        const fileFolderPath = parts.slice(0, -1).join('/');
        
        // Get or create the file
        let file = fileMap.get(displayPath);
        if (!file) {
          file = {
            type: 'file',
            name: fileName,
            identifier: displayPath,
            functions: [],
          };
          fileMap.set(displayPath, file);
        }
        file.functions.push(moduleFunction);

        // Add function to module map
        const moduleFunctions = moduleMap.get(displayPath) || [];
        moduleFunctions.push(moduleFunction);
        moduleMap.set(displayPath, moduleFunctions);
      });

      // Build tree structure
      const root: FileOrFolder[] = [];
      const addedPaths = new Set<string>();

      // Add folders to tree
      Array.from(folderMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([path, folder]) => {
          const parentPath = path.split('/').slice(0, -1).join('/');
          const parent = parentPath ? folderMap.get(parentPath) : null;

          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(folder);
          } else if (!addedPaths.has(path)) {
            root.push(folder);
            addedPaths.add(path);
          }
        });

      // Add files to their folders
      Array.from(fileMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([path, file]) => {
          const parentPath = path.split('/').slice(0, -1).join('/');
          const parent = parentPath ? folderMap.get(parentPath) : null;

          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(file);
          } else if (!addedPaths.has(path)) {
            root.push(file);
            addedPaths.add(path);
          }
        });

      // Sort children in each folder
      const sortChildren = (items: FileOrFolder[]) => {
        items.sort((a, b) => {
          // Folders come before files
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          // Sort by name within the same type
          return a.name.localeCompare(b.name);
        });

        // Recursively sort children of folders
        items.forEach(item => {
          if (item.type === 'folder' && item.children) {
            sortChildren(item.children);
          }
        });
      };

      sortChildren(root);

      setRootEntries(root);
      setModules(moduleMap);
    } catch (err) {
      console.error('Error processing functions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch functions');
    } finally {
      setIsLoading(false);
    }
  };

  const executeFunction = async (fn: ModuleFunction, args?: any) => {
    if (!convexClient) {
      throw new Error('Convex client not available');
    }

    try {
      switch (fn.udfType) {
        case 'query':
          return await convexClient.query(fn.identifier)(args);
        case 'mutation':
          return await convexClient.mutation(fn.identifier)(args);
        case 'action':
          return await convexClient.action(fn.identifier)(args);
        default:
          throw new Error(`Unsupported function type: ${fn.udfType}`);
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to execute function');
    }
  };

  useEffect(() => {
    refreshFunctions();
  }, [convexClient]);

  const filterTree = (items: FileOrFolder[]): FileOrFolder[] => {
    return items.map((item) => {
      if (item.type === 'folder' && item.children) {
        const filteredChildren = filterTree(item.children);
        return {
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : [],
        };
      }

      if (item.type === 'file') {
        const fileFunctions = item.functions.filter((fn) =>
          fn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fn.udfType.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return fileFunctions.length > 0 ? { ...item, functions: fileFunctions } : null;
      }

      return null;
    }).filter((item): item is FileOrFolder => item !== null);
  };

  const filteredRootEntries = useMemo(() => {
    if (!searchTerm) return rootEntries;
    return filterTree(rootEntries);
  }, [rootEntries, searchTerm]);

  const value = {
    selectedFunction,
    setSelectedFunction,
    searchTerm,
    setSearchTerm,
    rootEntries: filteredRootEntries,
    modules,
    isLoading,
    error,
    refreshFunctions,
    executeFunction,
    convexClient,
  };

  return (
    <FunctionsContext.Provider value={value}>
      {children}
    </FunctionsContext.Provider>
  );
}

export function useFunctionsState() {
  const context = useContext(FunctionsContext);
  if (!context) {
    throw new Error('useFunctionsState must be used within a FunctionsProvider');
  }
  return context;
}

export function useModuleFunctions(): ModuleFunction[] {
  const { modules } = useFunctionsState();
  return Array.from(modules.values()).flat();
} 