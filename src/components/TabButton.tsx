import React from 'react';
import { TabTypes } from '../utils/constants';
import { LogsIcon, DataIcon, HealthIcon } from './icons';

interface TabButtonProps {
  tabId: TabTypes;
  label: string;
  activeTab: TabTypes;
  onClick: (tab: TabTypes) => void;
}

const TAB_ICONS = {
  logs: LogsIcon,
  'data-tables': DataIcon,
  health: HealthIcon,
} as const;

export const TabButton: React.FC<TabButtonProps> = ({
  tabId,
  label,
  activeTab,
  onClick,
}) => {
  const Icon = TAB_ICONS[tabId];
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === tabId}
      aria-controls={`tab-content-${tabId}`}
      data-state={activeTab === tabId ? 'active' : 'inactive'}
      id={`tab-trigger-${tabId}`}
      className="convex-panel-tab-button"
      tabIndex={activeTab === tabId ? 0 : -1}
      data-orientation="horizontal"
      onClick={() => onClick(tabId)}
    >
      <div className="flex items-center gap-1">
        <Icon />
        <span>
          <span className="convex-panel-tab-text">{label}</span>
        </span>
      </div>
    </button>
  );
}; 