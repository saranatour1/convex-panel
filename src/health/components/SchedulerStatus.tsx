import React from 'react';
import { SchedulerStatusProps } from '../../types';

/**
 * Scheduler Status component
 * Displays the status of the scheduler and the message associated with it
 * @param status - The status of the scheduler
 * @param message - The message associated with the status
 */
const SchedulerStatus: React.FC<SchedulerStatusProps> = ({ status, message }) => {
  /**
   * Get the color for the status
   * @returns The color for the status
   */
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

  /**
   * Get the title for the status
   * @returns The title for the status
   */
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

  /**
   * Get the icon for the status
   * @returns The icon for the status
   */
  const getStatusIcon = () => {
    switch (status) {
      case 'on_time':
        return '✓';
      case 'delayed':
        return '⚠';
      case 'error':
        return '✗';
      default:
        return '?';
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
        padding: '20px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <span style={{
            fontSize: '32px',
            marginRight: '10px',
            color: getStatusColor()
          }}>
            {getStatusIcon()}
          </span>
          <div style={{
            fontSize: '40px',
            fontWeight: 'bold',
            color: getStatusColor(),
          }}>
            {getStatusTitle()}
          </div>
        </div>
        <div style={{
          color: '#cccccc',
          textAlign: 'center',
          fontSize: '16px',
          maxWidth: '400px',
          padding: '10px',
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          {message}
        </div>
      </div>
    </div>
  );
};

export default SchedulerStatus; 