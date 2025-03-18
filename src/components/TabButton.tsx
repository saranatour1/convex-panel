import React from 'react';
import { DevToolsTabTypes, TabTypes } from '../utils/constants';
import { LogsIcon, DataIcon, HealthIcon, DevToolsIcon, ConsoleIcon, NetworkIcon } from './icons';

interface TabButtonProps {
  tabId: TabTypes | DevToolsTabTypes;
  label: string;
  activeTab: TabTypes | DevToolsTabTypes;
  onClick: (tab: TabTypes | DevToolsTabTypes) => void;
  devtools?: boolean;
}

const TAB_ICONS = {
  logs: LogsIcon,
  'data-tables': DataIcon,
  health: HealthIcon,
  devtools: DevToolsIcon,
  console: ConsoleIcon,
  network: NetworkIcon
} as const;

export const TabButton: React.FC<TabButtonProps> = ({
  tabId,
  label,
  activeTab,
  onClick,
  devtools = false
}) => {
  const Icon = TAB_ICONS[tabId as keyof typeof TAB_ICONS] || DevToolsIcon;
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activeTab === tabId}
      aria-controls={`tab-content-${tabId}`}
      data-state={activeTab === tabId ? 'active' : 'inactive'}
      id={`tab-trigger-${tabId}`}
      className={`${devtools ? 'convex-panel-devtools-tab-button' : 'convex-panel-tab-button'}`}
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