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
import { SchedulerLagChartProps } from 'src/types';
import { ROUTES } from 'src/utils/constants';
import { fetchSchedulerLag } from '../../utils/api';

const SchedulerLagChart: React.FC<SchedulerLagChartProps> = ({
  /**
   * URL of the deployment to fetch scheduler lag data from.
   * Required for making API calls to the backend.
   * @required
   */
  deploymentUrl,

  /**
   * Authentication token for accessing the API.
   * Required for securing access to data.
   * Should be kept private and not exposed to clients.
   * @required
   */
  authToken,

  /**
   * Interval in milliseconds to refresh the scheduler lag data.
   * Controls how frequently the chart updates with new data.
   * @default 60000 (1 minute)
   */
  refreshInterval = 60000,

  /**
   * Boolean flag to control the visibility of the chart.
   * Determines whether the chart should be displayed or not.
   * @required
   */
  showChart,

  /**
   * Whether to use mock data instead of real API data.
   * Useful for development, testing, and demos.
   * @default false
   */
  useMockData = false
}) => {
  const [chartData, setChartData] = useState<Array<{time: string, lag: number}>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'on_time' | 'delayed' | 'error'>('on_time');
  const [message, setMessage] = useState<string>('Loading scheduler data...');
  const [receivedSuccessResponse, setReceivedSuccessResponse] = useState<boolean>(false);

  /**
   * Fetch scheduler lag data from the API
   */
  const fetchData = useCallback(async () => {
    try {
      // Only show loading if we haven't received a success response yet
      if (!receivedSuccessResponse) {
        setLoading(true);
      }
      
      const data = await fetchSchedulerLag(deploymentUrl, authToken, useMockData);
      
      // We got a successful response
      setReceivedSuccessResponse(true);
      
      // Process the data for Recharts format
      let formattedData: Array<{time: string, lag: number}> = [];
      
      try {
        // Handle different data formats for mock vs real data
        if (useMockData && data && data.data && Array.isArray(data.data[0]) && Array.isArray(data.data[0][1])) {
          // Process mock data format
          formattedData = data.data[0][1].map((item: any) => {
            try {
              const timestamp = item[0]?.secs_since_epoch ? item[0].secs_since_epoch * 1000 : Date.now();
              const timeLabel = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const lagValue = typeof item[1] === 'number' ? item[1] : 0;
              
              return {
                time: timeLabel,
                lag: lagValue,
              };
            } catch (itemErr) {
              console.warn('Error processing mock data item:', itemErr);
              // Return a fallback item if there's an error
              return {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                lag: 0
              };
            }
          });
          
          // Set status and message from the mock response
          setStatus(data.status || 'on_time');
          setMessage(data.message || 'Scheduler is running on time.');
        } else {
          // Process real API data format
          // For real data, we need to handle the format returned by the actual API
          if (Array.isArray(data)) {
            formattedData = data.map((item: any) => {
              try {
                const timestamp = item[0]?.secs_since_epoch ? item[0].secs_since_epoch * 1000 : Date.now();
                const timeLabel = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const lagValue = typeof item[1] === 'number' ? item[1] : 0;
                
                return {
                  time: timeLabel,
                  lag: lagValue,
                };
              } catch (itemErr) {
                console.warn('Error processing real data item:', itemErr);
                // Return a fallback item if there's an error
                return {
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  lag: 0
                };
              }
            });
            
            // Determine status based on lag values for real data
            const lagValues = formattedData.map((item) => item.lag);
            const maxLag = Math.max(...lagValues);
            if (maxLag > 2) {
              setStatus('delayed');
              setMessage('Scheduled functions are experiencing some delays.');
            } else {
              setStatus('on_time');
              setMessage('Scheduler is running on time.');
            }
          } else {
            console.warn('Unexpected data format from scheduler lag API:', data);
            // Generate some fallback data to avoid empty chart
            const now = Date.now();
            formattedData = Array.from({ length: 10 }, (_, i) => {
              const time = new Date(now - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return { time, lag: 0 };
            }).reverse();
            
            setStatus('on_time');
            setMessage('No scheduler lag data available.');
          }
        }
      } catch (formatErr) {
        console.error('Error formatting scheduler lag data:', formatErr);
        // Generate some fallback data to avoid empty chart
        const now = Date.now();
        formattedData = Array.from({ length: 10 }, (_, i) => {
          const time = new Date(now - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return { time, lag: 0 };
        }).reverse();
        
        setStatus('error');
        setMessage('Error processing scheduler data.');
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
  }, [deploymentUrl, authToken, receivedSuccessResponse, useMockData]);

  /**
   * Fetch data and set up interval for refreshing data
   */
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
                  domain={[0, 'dataMax + 1']}
                  allowDataOverflow={false}
                  tickCount={10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#333', 
                    border: '1px solid #555', 
                    color: '#cccccc' 
                  }}
                  labelStyle={{ color: '#cccccc' }}
                  formatter={(value: any) => [`${value.toFixed(2)} minutes`, 'Lag Time']}
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
                  dot={{ r: 3, fill: '#FFC107' }}
                  activeDot={{ r: 6, fill: '#FFA000' }}
                  isAnimationActive={true}
                  animationDuration={1000}
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