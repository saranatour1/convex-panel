import React from 'react';
import { DirectorySidebar } from './DirectorySidebar';
import { FunctionContent } from './FunctionContent';
import { useFunctionsState } from './FunctionsProvider';
import { ThemeClasses } from '../types';
import { FolderOpenIcon } from '../components/icons';
import { STORAGE_KEYS } from '../utils/constants';

export function FunctionsView({ authToken, baseUrl, theme }: { authToken: string, baseUrl: string, theme: ThemeClasses }) {
  const { selectedFunction, setSelectedFunction } = useFunctionsState();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Load the selected function from localStorage on mount
  React.useEffect(() => {
    const savedFunction = localStorage.getItem(STORAGE_KEYS.SELECTED_FUNCTION);
    if (savedFunction && !selectedFunction) {
      try {
        const parsedFunction = JSON.parse(savedFunction);
        setSelectedFunction(parsedFunction);
      } catch (error) {
        console.error('Error parsing saved function:', error);
        localStorage.removeItem(STORAGE_KEYS.SELECTED_FUNCTION);
      }
    }
  }, []);

  // Save the selected function to localStorage whenever it changes
  React.useEffect(() => {
    if (selectedFunction) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_FUNCTION, JSON.stringify(selectedFunction));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_FUNCTION);
    }
  }, [selectedFunction]);

  return (
    <div className="convex-panel-data-layout">
      <DirectorySidebar 
        isSidebarCollapsed={isSidebarCollapsed} 
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        theme={theme} 
      />
      <div className="convex-panel-functions-content">
        {selectedFunction ? (
          <FunctionContent theme={theme} function={selectedFunction} authToken={authToken} baseUrl={baseUrl} />
        ) : (
          <div className="convex-panel-empty-state">
            <div className="convex-panel-empty-state-icon">
              <FolderOpenIcon width={100} height={100} />
            </div>
            <p>Select a function to view its details</p>
          </div>
        )}
      </div>
    </div>
  );
} 