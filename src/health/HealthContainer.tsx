import React from 'react';
import FailureRateChart from './components/FailureRateChart';
import CacheHitRateChart from './components/CacheHitRateChart';
import SchedulerStatus from './components/SchedulerStatus';

interface HealthContainerProps {
  deploymentUrl: string;
  authToken: string;
}

const HealthContainer: React.FC<HealthContainerProps> = ({
  deploymentUrl,
  authToken
}) => {
  return (
    <div className="health-container">
      <CacheHitRateChart 
        deploymentUrl={deploymentUrl}
        authToken={authToken}
        refreshInterval={60000}
      />
    </div>
    // <div style={{
    //   height: '100%',
    //   backgroundColor: '#1e1c1a',
    //   color: '#ffffff',
    //   padding: '20px',
    //   overflow: 'auto'
    // }}>
    //   <div style={{
    //     display: 'grid',
    //     gridTemplateColumns: 'repeat(2, 1fr)',
    //     gap: '20px',
    //     marginBottom: '20px'
    //   }}>
    //     <div style={{
    //       backgroundColor: '#2a2a2a',
    //       borderRadius: '8px',
    //       // padding: '15px'
    //     }}>
    //       {/* <FailureRateChart data={mockFailureData} /> */}
    //     </div>
    //     <div style={{
    //       backgroundColor: '#2a2a2a',
    //       borderRadius: '8px',
    //       padding: '15px'
    //     }}>
    //       <CacheHitRateChart 
    //         deploymentUrl={deploymentUrl}
    //         authToken={authToken}
    //         refreshInterval={60000}
    //       />
    //     </div>
    //   </div>
      
    // <div style={{
    //     display: 'grid',
    //     gridTemplateColumns: 'repeat(2, 1fr)',
    //     gap: '20px'
    //   }}>
    //     <div style={{
    //       backgroundColor: '#2a2a2a',
    //       borderRadius: '8px'
    //     }}>
    //       <SchedulerStatus 
    //         status="on_time"
    //         message="Scheduled functions are running on time."
    //       />
    //     </div>
    //     <div style={{
    //       backgroundColor: '#2a2a2a',
    //       borderRadius: '8px',
    //       padding: '20px'
    //     }}>
    //       <h3>Last Deployed</h3>
    //       <div style={{ marginTop: '10px' }}>
    //         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    //           <span>Convex v1.18.2</span>
    //           <button
    //             style={{
    //               backgroundColor: '#4a4a4a',
    //               color: '#ffffff',
    //               border: 'none',
    //               padding: '8px 16px',
    //               borderRadius: '4px',
    //               cursor: 'pointer'
    //             }}
    //           >
    //             Update Available
    //           </button>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
};

export default HealthContainer;