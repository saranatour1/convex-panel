

import React, { useState, useEffect } from 'react';
import { getStorageItem, setStorageItem } from '../data/utils/storage';

// Define storage keys for settings
const SETTINGS_STORAGE_KEY = 'convex-panel:settings';

// Default settings
const defaultSettings = {
  showDebugFilters: process.env.NODE_ENV !== 'production',
  showStorageDebug: process.env.NODE_ENV !== 'production',
  logLevel: 'info' as const,
  healthCheckInterval: 60, // seconds
  showRequestIdInput: true,
  showLimitInput: true,
  showSuccessCheckbox: true,
};

// Settings type
export interface ConvexPanelSettings {
  showDebugFilters: boolean;
  showStorageDebug: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  healthCheckInterval: number;
  showRequestIdInput: boolean;
  showLimitInput: boolean;
  showSuccessCheckbox: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: ConvexPanelSettings) => void;
  theme?: Record<string, any>;
  containerized?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose,
  onSettingsChange,
  theme = {},
  containerized
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'data' | 'health'>('logs');
  const [settings, setSettings] = useState<ConvexPanelSettings>(defaultSettings);
  
  // Load settings from storage on mount
  useEffect(() => {
    const savedSettings = getStorageItem<Partial<ConvexPanelSettings>>(SETTINGS_STORAGE_KEY, {});
    // Merge saved settings with default settings to ensure all properties exist
    const mergedSettings = { ...defaultSettings, ...savedSettings };
    setSettings(mergedSettings);
  }, []);
  
  // Save settings when they change
  const updateSettings = (newSettings: Partial<ConvexPanelSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    setStorageItem(SETTINGS_STORAGE_KEY, updatedSettings);
    onSettingsChange(updatedSettings);
    
    // Force re-render of the current tab
    // Create a temporary state update to force re-render
    const currentTab = activeTab;
    setActiveTab(currentTab);
    
    // Use requestAnimationFrame to ensure the state change is processed
    // before setting back to the original tab
    requestAnimationFrame(() => {
      setActiveTab(currentTab);
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className={"shadow-lg bg-background rounded-xl border mr-4 overflow-hidden flex flex-col h-[calc(100vh-var(--header-height)-3rem)] max-h-[40rem] p-2 relative overflow-hidden"}
    >
      {!containerized && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
      )}
      <div 
        className={`bg-neutral-900 rounded-lg h-[200px] min-h-[200px] max-h-[200px] ${
          containerized ? "w-full" : "w-full max-w-md mx-auto"
        }`}
      >
        <div className="flex justify-between items-center p-2 px-4 border-b border-neutral-800">
          <h2 className="text-lg font-normal text-white">Settings</h2>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden h-[155px]">
          {/* Sidebar */}
          <div className="w-48 border-neutral-800 border-r">
            <button 
              className={`w-full text-left p-2 ${activeTab === 'logs' ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}
              onClick={() => setActiveTab('logs')}
            >
              Logs
            </button>
            <button 
              className={`w-full text-left p-2 ${activeTab === 'data' ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}
              onClick={() => setActiveTab('data')}
            >
              Data
            </button>
            <button 
              className={`w-full text-left p-2 ${activeTab === 'health' ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}
              onClick={() => setActiveTab('health')}
            >
              Health
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto rounded-br-lg [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-thumb:hover]:bg-neutral-500">
            {activeTab === 'logs' && (
              <div className="p-4">
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.showRequestIdInput}
                      onChange={(e) => updateSettings({ showRequestIdInput: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-neutral-700 border-neutral-600"
                    />
                    <span className="text-neutral-200">Show Request ID Filter</span>
                  </label>
                </div>

                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.showLimitInput}
                      onChange={(e) => updateSettings({ showLimitInput: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-neutral-700 border-neutral-600"
                    />
                    <span className="text-neutral-200">Show Limit Input</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.showSuccessCheckbox}
                      onChange={(e) => updateSettings({ showSuccessCheckbox: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-neutral-700 border-neutral-600"
                    />
                    <span className="text-neutral-200">Show Success Checkbox</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="p-4">
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.showDebugFilters}
                      onChange={(e) => updateSettings({ showDebugFilters: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-neutral-700 border-neutral-600"
                    />
                    <span className="text-neutral-200">Show Debug Filters</span>
                  </label>
                  <p className="text-neutral-400 text-xs mt-1 ml-6">
                    Display the filter debug panel showing the current filter state
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.showStorageDebug}
                      onChange={(e) => updateSettings({ showStorageDebug: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-neutral-700 border-neutral-600"
                    />
                    <span className="text-neutral-200">Show Storage Debug</span>
                  </label>
                  <p className="text-neutral-400 text-xs mt-1 ml-6">
                    Display the storage debug panel showing localStorage state
                  </p>
                </div>
              </div>
            )}
            
            {activeTab === 'health' && (
              <div 
                style={{
                  height: "100%",
                  fontFamily: "ui-monospace, Menlo, Monaco, Cascadia Mono, Segoe UI Mono, Roboto Mono, Oxygen Mono, Ubuntu Mono, Source Code Pro, Fira Mono, Droid Sans Mono, Consolas, Courier New, monospace",
                  MozTabSize: 4,
                  OTabSize: 4,
                  tabSize: 4,
                  whiteSpace: "break-spaces", 
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                  flexGrow: 2,
                  backgroundColor: "#1e1c1a",
                  cursor: "not-allowed",
                  backgroundImage: "linear-gradient(-45deg, rgba(204, 204, 204, .1) 12.5%, #0000 0, #0000 50%, rgba(204, 204, 204, .1) 0, rgba(204, 204, 204, .1) 62.5%, #0000 0, #0000)",
                  backgroundSize: "12px 12px"
                }}
              >
                <h3 className="text-xs font-medium h-full w-full flex items-center justify-center text-white">Health settings coming soon</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 