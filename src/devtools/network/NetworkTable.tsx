import { AnimatePresence } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import { ThemeClasses } from '../../types';
import NetworkDetailPanel from './NetworkDetailPanel';
import { EmptyState } from '../../components/EmptyState';
import NetworkRow from './NetworkRow';
import { NetworkTableProps } from '../../types';

const TableHeader = ({ 
  /** Whether the detail panel is open. Controls visibility of expanded view. */
  isDetailPanelOpen,
  /** Theme customization object with merged default and custom styles. */
  mergedTheme
}: { 
  isDetailPanelOpen: boolean, 
  mergedTheme: ThemeClasses 
}) => (
  <div className={`convex-panel-table-network-header ${mergedTheme.tableHeader}`}>
    <div className={`convex-panel-header-network-row`}>
      {isDetailPanelOpen ? (
        <>
          <div className="convex-panel-header-network-name">Name</div>
          <div className="convex-panel-header-network-status">Status</div>
        </>
      ) : (
        <>
          <div className="convex-panel-header-network-name">Name</div>
          <div className="convex-panel-header-network-status">Status</div>
          <div className="convex-panel-header-network-type">Type</div>
          <div className="convex-panel-header-network-size">Size</div>
          <div className="convex-panel-header-network-time">Time</div>
        </>
      )}
    </div>
  </div>
);

const NetworkTable = ({
  mergedTheme,
  filteredCalls,
  containerSize,
  isDetailPanelOpen,
  selectedCall,
  setIsDetailPanelOpen,
  handleCallSelect,
  onRowMouseEnter,
  onRowMouseLeave
}: NetworkTableProps) => {
  const getListHeight = () => {
    // Calculate the height of the table header
    const headerHeight = 40; // Height of the table header
    
    // Subtract these heights from the container height
    return containerSize.height - headerHeight;
  };

  return (
    <div className={`convex-panel-logs-container`} style={{ height: containerSize.height }}>
      <div className={`convex-panel-logs-main ${isDetailPanelOpen ? 'convex-panel-logs-with-detail' : 'convex-panel-logs-full'}`}>
        <TableHeader isDetailPanelOpen={isDetailPanelOpen} mergedTheme={mergedTheme} />
        
        {filteredCalls.length === 0 ? (
          <EmptyState 
            message="No network requests captured. Make network requests to see them here."
          />
        ) : (
          <div className="convex-panel-logs-list-container">
            <List
              height={getListHeight()}
              itemCount={filteredCalls.length}
              itemSize={35}
              width={isDetailPanelOpen ? (containerSize.width / 2) - 10 : containerSize.width - 10}
              itemData={{ 
                calls: filteredCalls, 
                isDetailPanelOpen,
                mergedTheme,
                handleCallSelect,
                onRowMouseEnter,
                onRowMouseLeave
              }}
              className="convex-panel-logs-list"
            >
              {NetworkRow}
            </List>
          </div>
        )}
      </div>
      
      {isDetailPanelOpen && selectedCall && (
        <AnimatePresence>
          <NetworkDetailPanel 
            selectedCall={selectedCall} 
            mergedTheme={mergedTheme} 
            setIsDetailPanelOpen={setIsDetailPanelOpen} 
          />
        </AnimatePresence>
      )}
    </div>
  );
};

NetworkTable.displayName = 'NetworkTable';

export default NetworkTable; 