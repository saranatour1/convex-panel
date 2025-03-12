import React from 'react';

interface SchedulerStatusProps {
  status: 'on_time' | 'delayed' | 'error';
  message: string;
}

const SchedulerStatus: React.FC<SchedulerStatusProps> = ({ status, message }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'on_time':
        return '#4CAF50';
      case 'delayed':
        return '#FFC107';
      case 'error':
        return '#f44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'on_time':
        return 'On time';
      case 'delayed':
        return 'Delayed';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="scheduler-status" style={{ padding: '20px' }}>
      <h3 className="convex-panel-health-header convex-panel-table-header-theme">Scheduler Status</h3>
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '150px',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <div style={{
          fontSize: '40px',
          fontWeight: 'bold',
          color: getStatusColor(),
        }}>
          {getStatusTitle()}
        </div>
        <div style={{
          color: '#cccccc',
          textAlign: 'center'
        }}>
          {message}
        </div>
      </div>
    </div>
  );
};

export default SchedulerStatus; 