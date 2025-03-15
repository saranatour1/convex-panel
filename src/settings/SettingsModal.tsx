import React, { useState, useEffect } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storage';
import { XIcon } from '../components/icons';

// Define storage keys for settings
const SETTINGS_STORAGE_KEY = 'convex-panel:settings';

// Default settings
const defaultSettings = {
  showDebugFilters: false,
  showStorageDebug: false,
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
      className="convex-panel-settings-modal"
    >
      {!containerized && (
        <div 
          className="convex-panel-settings-backdrop"
          onClick={onClose}
        />
      )}
      <div 
        className={`convex-panel-settings-content ${
          containerized ? "convex-panel-settings-content-full" : "convex-panel-settings-content-centered"
        }`}
      >
        <div className="convex-panel-settings-header">
          <h2 className="convex-panel-settings-title">Settings</h2>
          <button 
            onClick={onClose}
            className="convex-panel-settings-close-button"
          >
            <XIcon />
          </button>
        </div>
        
        <div className="convex-panel-settings-body">
          {/* Sidebar */}
          <div className="convex-panel-settings-sidebar">
            <button 
              className={`convex-panel-settings-tab-button ${activeTab === 'logs' ? 'convex-panel-settings-tab-active' : 'convex-panel-settings-tab-inactive'}`}
              onClick={() => setActiveTab('logs')}
            >
              Logs
            </button>
            <button 
              className={`convex-panel-settings-tab-button ${activeTab === 'data' ? 'convex-panel-settings-tab-active' : 'convex-panel-settings-tab-inactive'}`}
              onClick={() => setActiveTab('data')}
            >
              Data
            </button>
            <button 
              className={`convex-panel-settings-tab-button ${activeTab === 'health' ? 'convex-panel-settings-tab-active' : 'convex-panel-settings-tab-inactive'}`}
              onClick={() => setActiveTab('health')}
            >
              Health
            </button>
          </div>
          
          {/* Content */}
          <div className="convex-panel-settings-content-area">
            {activeTab === 'logs' && (
              <div className="convex-panel-settings-section">
                <div className="convex-panel-settings-option">
                  <label className="convex-panel-settings-label">
                    <input 
                      type="checkbox" 
                      checked={settings.showRequestIdInput}
                      onChange={(e) => updateSettings({ showRequestIdInput: e.target.checked })}
                      className="convex-panel-settings-checkbox"
                    />
                    <span className="convex-panel-settings-label-text">Show Request ID Filter</span>
                  </label>
                </div>

                <div className="convex-panel-settings-option">
                  <label className="convex-panel-settings-label">
                    <input 
                      type="checkbox" 
                      checked={settings.showLimitInput}
                      onChange={(e) => updateSettings({ showLimitInput: e.target.checked })}
                      className="convex-panel-settings-checkbox"
                    />
                    <span className="convex-panel-settings-label-text">Show Limit Input</span>
                  </label>
                </div>

                <div className="convex-panel-settings-option">
                  <label className="convex-panel-settings-label">
                    <input 
                      type="checkbox" 
                      checked={settings.showSuccessCheckbox}
                      onChange={(e) => updateSettings({ showSuccessCheckbox: e.target.checked })}
                      className="convex-panel-settings-checkbox"
                    />
                    <span className="convex-panel-settings-label-text">Show Success Checkbox</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="convex-panel-settings-section">
                <div className="convex-panel-settings-option">
                  <label className="convex-panel-settings-label">
                    <input 
                      type="checkbox" 
                      checked={settings.showDebugFilters}
                      onChange={(e) => updateSettings({ showDebugFilters: e.target.checked })}
                      className="convex-panel-settings-checkbox"
                    />
                    <span className="convex-panel-settings-label-text">Show Debug Filters</span>
                  </label>
                  <p className="convex-panel-settings-description">
                    Display the filter debug panel showing the current filter state
                  </p>
                </div>
                
                <div className="convex-panel-settings-option">
                  <label className="convex-panel-settings-label">
                    <input 
                      type="checkbox" 
                      checked={settings.showStorageDebug}
                      onChange={(e) => updateSettings({ showStorageDebug: e.target.checked })}
                      className="convex-panel-settings-checkbox"
                    />
                    <span className="convex-panel-settings-label-text">Show Storage Debug</span>
                  </label>
                  <p className="convex-panel-settings-description">
                    Display the storage debug panel showing localStorage state
                  </p>
                </div>
              </div>
            )}
            
            {activeTab === 'health' && (
              <div 
                className="convex-panel-settings-health-placeholder"
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
                <h3 className="convex-panel-settings-health-text">Health settings coming soon</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 