

import React from 'react';
import { DataTableSidebarProps } from '../types';

const DataTableSidebar: React.FC<DataTableSidebarProps> = ({
  tables,
  selectedTable,
  searchText,
  onSearchChange,
  onTableSelect,
  isSidebarCollapsed,
  onToggleSidebar,
  theme = {}
}) => {
  // Store sidebar state in localStorage when it changes
  React.useEffect(() => {
    localStorage.setItem('datatable-sidebar-collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const filteredTables = Object.keys(tables).filter(tableName =>
    tableName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div 
      className={`${
        isSidebarCollapsed ? 'w-12' : 'w-64'
      } border-r border-neutral-700 flex flex-col bg-[#141414] transition-all duration-300 min-h-[420px] rounded-bl-md`}
    >
      <div className={`py-4 border-b border-neutral-700 flex flex-col ${isSidebarCollapsed ? 'items-center' : 'p-4'}`}>
        {!isSidebarCollapsed ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center justify-between w-full gap-2">
                <h3 className="text-sm font-medium">Tables</h3>
                <button
                  onClick={onToggleSidebar}
                  className="p-1 hover:bg-neutral-700 rounded"
                >
                  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M6 3.5H13M6 7.5H13M6 11.5H13M4 3.5L2 5.5L4 7.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search tables..."
              className={`w-full px-3 py-1.5 rounded-md focus:outline-none text-xs ${theme?.input} font-mono`}
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </>
        ) : (
          <button
            onClick={onToggleSidebar}
            className="p-1 hover:bg-neutral-700 rounded mx-auto"
          >
            <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
              d="M9 3.5H2M9 7.5H2M9 11.5H2M11 3.5L13 5.5L11 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-thumb:hover]:bg-neutral-500">
        {filteredTables.map(tableName => (
          <button
            key={tableName}
            className={`w-full text-left px-4 py-2 hover:bg-neutral-800 text-sm ${
              selectedTable === tableName ? 'bg-neutral-800 text-white' : 'text-neutral-400'
            } ${isSidebarCollapsed ? 'text-center overflow-hidden text-ellipsis whitespace-nowrap' : ''}`}
            onClick={() => onTableSelect(tableName)}
            title={tableName}
          >
            {isSidebarCollapsed ? tableName.charAt(0).toUpperCase() : tableName}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DataTableSidebar; 