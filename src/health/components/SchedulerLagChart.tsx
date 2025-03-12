import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import SchedulerStatus from './SchedulerStatus';

interface SchedulerLagChartProps {
  deploymentUrl: string;
  authToken: string;
  refreshInterval?: number;
  showChart: boolean;
}

const SchedulerLagChart: React.FC<SchedulerLagChartProps> = ({
  deploymentUrl,
  authToken,
  refreshInterval = 60000,
  showChart
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'on_time' | 'delayed' | 'error'>('on_time');
  const [message, setMessage] = useState<string>('Loading scheduler data...');
  const [receivedSuccessResponse, setReceivedSuccessResponse] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      // Only show loading if we haven't received a success response yet
      if (!receivedSuccessResponse) {
        setLoading(true);
      }
      
      // Create time window for the API call (1 hour)
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - 3600; // 1 hour ago
      
      const queryParams = new URLSearchParams({
        window: JSON.stringify({
          start: {
            secs_since_epoch: startTime,
            nanos_since_epoch: 384000062
          },
          end: {
            secs_since_epoch: endTime,
            nanos_since_epoch: 384000062
          },
          num_buckets: 60
        })
      });
      
      const response = await fetch(
        `${deploymentUrl}/api/app_metrics/scheduled_job_lag?${queryParams}`,
        {
          headers: {
            'Authorization': `Convex ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        // If response is 404, we'll try again later but not show the error
        if (response.status === 404) {
          console.log('Scheduler lag API not available yet, will retry...');
          setLoading(true);
          return; // Exit without updating state further
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // We got a successful response
      setReceivedSuccessResponse(true);
      
      const data = await response.json();
      
      // Process the data for Recharts format
      const formattedData = data.map((item: any) => {
        const timestamp = item[0].secs_since_epoch * 1000;
        const timeLabel = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const lagValue = item[1] || 0;
        
        return {
          time: timeLabel,
          lag: lagValue,
        };
      });
      
      // Determine status based on lag values
      const lagValues = formattedData.map((item: any) => item.lag);
      const maxLag = Math.max(...lagValues);
      if (maxLag > 5) {
        setStatus('error');
        setMessage('Scheduled functions are severely delayed.');
      } else if (maxLag > 1) {
        setStatus('delayed');
        setMessage('Scheduled functions are running with slight delays.');
      } else {
        setStatus('on_time');
        setMessage('Scheduled functions are running on time.');
      }
      
      setChartData(formattedData);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching scheduler lag data:', err);
      // Only show error if we've received a successful response before
      // Otherwise, keep showing loading
      if (receivedSuccessResponse) {
        setError('Error fetching scheduler lag data: ' + err);
        setStatus('error');
        setMessage('Unable to fetch scheduler status.');
        setLoading(false);
      }
    }
  }, [deploymentUrl, authToken, receivedSuccessResponse]);

  useEffect(() => {
    fetchData();
    
    // Set up refresh interval
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      {showChart ? (
        <div style={{ height: '300px', padding: '20px' }}>
          <h3 className="convex-panel-health-header convex-panel-table-header-theme" style={{ fontSize: '14px' }}>Scheduler Status</h3>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              Loading...
            </div>
          ) : error ? (
            <div style={{ color: '#f44336', textAlign: 'center', padding: '20px' }}>
              {error}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: '#cccccc' }}
                  axisLine={{ stroke: '#cccccc' }}
                />
                <YAxis 
                  tick={{ fill: '#cccccc' }}
                  axisLine={{ stroke: '#cccccc' }}
                  label={{ 
                    value: 'Minutes', 
                    angle: -90, 
                    position: 'insideLeft', 
                    style: { fill: '#cccccc' } 
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#333', 
                    border: '1px solid #555', 
                    color: '#cccccc' 
                  }}
                  labelStyle={{ color: '#cccccc' }}
                />
                <Legend 
                  wrapperStyle={{ color: '#cccccc' }}
                />
                <Line
                  type="monotone"
                  dataKey="lag"
                  name="Lag Time (minutes)"
                  stroke="#FFC107"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        <SchedulerStatus status={status} message={loading ? 'Loading scheduler data...' : message} />
      )}
    </div>
  );
};

export default SchedulerLagChart; 