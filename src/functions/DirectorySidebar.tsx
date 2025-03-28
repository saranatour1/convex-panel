import { ArrowPathIcon, PanelExpandIcon } from '../components/icons';
import { FileTree } from './FileTree';
import { useFunctionsState } from './FunctionsProvider';

export function DirectorySidebar({ 
  isSidebarCollapsed,
  onToggleSidebar,
  theme
}: { 
  isSidebarCollapsed: boolean,
  onToggleSidebar: () => void,
  theme: any
}) {

  const { 
    searchTerm, 
    setSearchTerm, 
    rootEntries, 
    refreshFunctions,
    isLoading 
  } = useFunctionsState();

  const handleRefresh = async () => {
    await refreshFunctions();
  };

  return (
    <div 
      className={`convex-panel-sidebar ${
        isSidebarCollapsed ? 'convex-panel-sidebar-collapsed' : 'convex-panel-sidebar-expanded'
      }`}
    >
      <div className={`convex-panel-sidebar-header ${isSidebarCollapsed ? 'convex-panel-sidebar-header-collapsed' : 'convex-panel-sidebar-header-expanded'}`}>
        {!isSidebarCollapsed ? (
          <>
            <div className="convex-panel-sidebar-title-container">
              <div className="convex-panel-sidebar-title-wrapper">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <h3 className="convex-panel-sidebar-title">Functions</h3>
                </div>
                <button
                  className={`convex-panel-refresh-button ${isLoading ? 'spinning' : ''}`}
                  onClick={handleRefresh}
                  disabled={isLoading}
                  title="Refresh functions"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search functions..."
              className={`convex-panel-sidebar-search ${theme?.input}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </>
        ) : (
          <button
            onClick={onToggleSidebar}
            className="convex-panel-sidebar-expand-button"
          >
            <PanelExpandIcon />
          </button>
        )}
      </div>

      <div className="convex-panel-directory-content" style={{ overflowY: 'auto' }}>
        <FileTree tree={rootEntries} isSidebarCollapsed={isSidebarCollapsed} />
      </div>
    </div>
  );
} 