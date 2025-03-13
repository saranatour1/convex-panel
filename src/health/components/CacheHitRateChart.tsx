import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchCacheHitRate } from '../../utils/api';
import { CacheHitRateChartProps, CacheHitData, APIResponse } from 'src/types';
import { generateColor, formatFunctionName, getNextMinute } from 'src/utils';

const CacheHitRateChart: React.FC<CacheHitRateChartProps> = ({
  /**
   * URL of the deployment to fetch cache hit rate data from.
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
   * Interval in milliseconds to refresh the cache hit rate data.
   * Controls how frequently the chart updates with new data.
   * @default 60000 (1 minute)
   */
  refreshInterval = 60000
}) => {
  const [data, setData] = useState<CacheHitData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [functionNames, setFunctionNames] = useState<string[]>([]);
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({});
  const [displayMode, setDisplayMode] = useState<'all' | 'individual'>('all');
  const [chartFunctionNames, setChartFunctionNames] = useState<string[]>([]);

  /**
   * Initialize visible lines when function names change
   */
  useEffect(() => {
    if (functionNames.length > 0) {
      const initialVisibility = functionNames.reduce((acc, name) => ({
        ...acc,
        [name]: true
      }), { _rest: true });
      setVisibleLines(initialVisibility);
    }
  }, [functionNames]);

  /**
   * Verify all function names have a visibility state
   */
  useEffect(() => {
    if (chartFunctionNames.length > 0) {
      setVisibleLines(prev => {
        const updatedVisibility = { ...prev };
        let changed = false;
        
        chartFunctionNames.forEach(name => {
          if (updatedVisibility[name] === undefined) {
            updatedVisibility[name] = true;
            changed = true;
          }
        });
        
        return changed ? updatedVisibility : prev;
      });
    }
  }, [chartFunctionNames]);

  /**
   * Update chart function names whenever data changes
   */
  useEffect(() => {
    if (data.length > 0) {
      const names = Array.from(
        new Set(
          data.flatMap(d => Object.keys(d.values))
        )
      ).filter(name => {
        if (name === '_rest') return false;
        return true;
      }).sort();
      
      if (!names.includes('_rest')) {
        names.push('_rest');
      }
      
      setChartFunctionNames(names);
    }
  }, [data]);

  /**
   * Generate color map from function names
   */
  const colorMap = useMemo<Record<string, string>>(() => {
    return chartFunctionNames.reduce<Record<string, string>>((acc, name) => ({
      ...acc,
      [name]: generateColor(name)
    }), {});
  }, [chartFunctionNames]);

  /**
   * Fetch cache hit rate data from the API
   */
  const fetchData = async () => {
    try {
      const response = await fetchCacheHitRate(deploymentUrl, authToken) as APIResponse;
      
      // First, collect all timestamps and create data points
      const timestamps = new Set<number>();
      response.forEach(([_, timeSeries]) => {
        timeSeries.forEach(([timestamp]) => {
          timestamps.add(timestamp.secs_since_epoch);
        });
      });

      // Create sorted array of timestamps
      const sortedTimestamps = Array.from(timestamps).sort();

      // Get all function names from the response
      const newFunctionNames = response.map(([name]) => name);
      
      // Make sure to include _rest in function names if not already present
      if (!newFunctionNames.includes('_rest')) {
        newFunctionNames.push('_rest');
      }
      
      setFunctionNames(newFunctionNames);

      // Initialize data points for each timestamp
      const transformedData = sortedTimestamps.map(timestamp => {
        // Create an object with null values for all functions
        const values = Object.fromEntries(
          newFunctionNames.map(name => [name, null])
        );
        
        // Make sure _rest is included
        values['_rest'] = null;
        
        return {
          timestamp: new Date(timestamp * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          values: values as Record<string, number | null>
        };
      });

      // Fill in values for each function
      response.forEach(([functionName, timeSeries]) => {
        const timeValueMap = new Map(
          timeSeries.map(([timestamp, value]) => [timestamp.secs_since_epoch, value])
        );

        transformedData.forEach(dataPoint => {
          const timestamp = sortedTimestamps[transformedData.indexOf(dataPoint)];
          const value = timeValueMap.get(timestamp);
          if (value !== undefined) {
            dataPoint.values[functionName] = value;
          }
        });
      });

      setData(transformedData);
      
      // Ensure all function names have visibility set to true
      const allVisibleLines = newFunctionNames.reduce((acc, name) => ({
        ...acc,
        [name]: true
      }), { _rest: true });
      
      setVisibleLines(allVisibleLines);
      setDisplayMode('all');
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch data and set up interval for refreshing data
   */
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [deploymentUrl, authToken, refreshInterval]);

  /**
   * Handle legend item clicks
   */
  const handleLegendClick = (name: string) => {
    if (!name) return;

    // If in "all" mode and clicking a line, switch to individual mode showing only that line
    if (displayMode === 'all') {
      const newVisibleLines = Object.fromEntries(
        chartFunctionNames.map(fn => [fn, fn === name])
      );
      setVisibleLines(newVisibleLines);
      setDisplayMode('individual');
    } 
    // If in individual mode and clicking the only visible line, show all lines
    else if (displayMode === 'individual') {
      // Check if this is the only visible line
      const countVisible = Object.values(visibleLines).filter(Boolean).length;
      
      if (visibleLines[name] && countVisible === 1) {
        // If clicking the only visible line, show all lines
        const allVisible = Object.fromEntries(
          chartFunctionNames.map(fn => [fn, true])
        );
        setVisibleLines(allVisible);
        setDisplayMode('all');
      } else {
        // Toggle the clicked line
        const newVisibleLines = {
          ...visibleLines,
          [name]: !visibleLines[name]
        };
        
        // If no lines are now visible, show all lines
        const anyVisible = Object.values(newVisibleLines).some(Boolean);
        if (!anyVisible) {
          const allVisible = Object.fromEntries(
            chartFunctionNames.map(fn => [fn, true])
          );
          setVisibleLines(allVisible);
          setDisplayMode('all');
        } else {
          setVisibleLines(newVisibleLines);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="cache-hit-rate-chart" style={{ width: '100%', height: 300 }}>
        <div className="convex-panel-health-header convex-panel-table-header-theme">
          <h3 style={{ fontSize: "14px" }}>Cache Hit Rate</h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cache-hit-rate-chart" style={{ width: '100%', height: 300 }}>
        <h3 className="convex-panel-health-header convex-panel-table-header-theme" style={{ fontSize: '14px' }}>Cache Hit Rate</h3>
        <div style={{ color: '#ff4d4f', textAlign: 'center', marginTop: '20px' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="cache-hit-rate-chart" style={{ width: '100%', height: 300, backgroundColor: '#1e1e1e', borderRadius: '8px' }}>
      <h3 className="convex-panel-health-header convex-panel-table-header-theme" style={{ color: '#fff', fontSize: '14px' }}>
        Cache Hit Rate
      </h3>

      <ResponsiveContainer width="100%" height="70%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 10,
            bottom: 30,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255,255,255,0.1)"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            tick={{ fill: '#cccccc', fontSize: 12 }}
            interval="preserveStartEnd"
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            dy={10}
          />
          <YAxis
            tick={{ fill: '#cccccc', fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              color: '#fff',
              fontSize: '14px',
              padding: '8px 12px',
              borderRadius: '4px'
            }}
            formatter={(value: any, name: string) => {
              const functionName = name.replace('values.', '');
              const formattedName = formatFunctionName(functionName);
              if (value === null || value === undefined) return ['0%', formattedName];
              return [`${Number(value).toFixed(0)}%`, formattedName];
            }}
            labelFormatter={(label: string) => {
              const nextMinute = getNextMinute(label);
              return `${label} – ${nextMinute}`;
            }}
            cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }}
            itemStyle={{ padding: '2px 0' }}
            separator=" "
          />
          
          {chartFunctionNames.map((name) => (
            <Line
              key={name}
              type="monotone"
              dataKey={(dataPoint) => dataPoint.values[name]}
              name={name}
              stroke={colorMap[name] || generateColor(name)}
              dot={false}
              activeDot={{ r: 4, fill: colorMap[name] || generateColor(name), strokeWidth: 0 }}
              strokeWidth={2}
              connectNulls
              hide={!visibleLines[name]}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Custom legend */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
      }}>
        {chartFunctionNames.map(name => (
          <div 
            key={name}
            onClick={() => handleLegendClick(name)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              margin: '0 16px 8px 0',
              cursor: 'pointer',
              opacity: visibleLines[name] ? 1 : 0.5
            }}
          >
            <div style={{ 
              width: 20, 
              height: 5, 
              backgroundColor: colorMap[name] || generateColor(name),
              marginRight: 5
            }} />
            <span style={{ 
              color: visibleLines[name] ? '#fff' : '#888', 
              fontSize: '12px'
            }}>
              {formatFunctionName(name)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

CacheHitRateChart.displayName = 'CacheHitRateChart';

export default CacheHitRateChart; 