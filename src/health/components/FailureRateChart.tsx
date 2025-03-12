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
import { fetchFailureRate } from '../utils/api';

interface FailureData {
  timestamp: string;
  values: Record<string, number | null>;
}

interface FailureRateChartProps {
  deploymentUrl: string;
  authToken: string;
  refreshInterval?: number;
}

interface TimeStamp {
  secs_since_epoch: number;
  nanos_since_epoch: number;
}

type TimeSeriesData = [TimeStamp, number | null][];
type APIResponse = [string, TimeSeriesData][];

// Color generator for different function names
const generateColor = (name: string): string => {
  if (name === '_rest') return '#ff4d4f'; // Red for "All other functions"
  
  // Hash the function name to get a consistent color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with good saturation and lightness - using reds/oranges
  const hue = (hash % 60) + 0; // 0-60 range (reds/oranges)
  return `hsl(${hue}, 90%, 60%)`;
};

// Format function name for display
const formatFunctionName = (name: string) => {
  if (name === '_rest') return 'All other functions';
  return name.replace('.js:', ':');
};

// Get next minute for tooltip
const getNextMinute = (timeStr: string): string => {
  const date = new Date(`1970/01/01 ${timeStr}`);
  date.setMinutes(date.getMinutes() + 1);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const FailureRateChart: React.FC<FailureRateChartProps> = ({
  deploymentUrl,
  authToken,
  refreshInterval = 60000 // Default to 1 minute
}) => {
  const [data, setData] = useState<FailureData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [functionNames, setFunctionNames] = useState<string[]>([]);
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({});
  const [displayMode, setDisplayMode] = useState<'all' | 'individual'>('all');
  const [chartFunctionNames, setChartFunctionNames] = useState<string[]>([]);

  // Initialize visible lines when function names change
  useEffect(() => {
    if (functionNames.length > 0) {
      const initialVisibility = functionNames.reduce((acc, name) => ({
        ...acc,
        [name]: true
      }), { _rest: true });
      setVisibleLines(initialVisibility);
    }
  }, [functionNames]);

  // Verify all function names have a visibility state
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

  // Update chart function names whenever data changes
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

  // Generate color map from function names
  const colorMap = useMemo<Record<string, string>>(() => {
    return chartFunctionNames.reduce<Record<string, string>>((acc, name) => ({
      ...acc,
      [name]: generateColor(name)
    }), {});
  }, [chartFunctionNames]);

  const fetchData = async () => {
    try {
      const response = await fetchFailureRate(deploymentUrl, authToken) as APIResponse;
      
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [deploymentUrl, authToken, refreshInterval]);

  // Handle legend item clicks
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
      <div className="failure-rate-chart" style={{ width: '100%', height: 300 }}>
        <div className="convex-panel-health-header convex-panel-table-header-theme">
          <h3 style={{ fontSize: "14px" }}>Failure Rate</h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="failure-rate-chart" style={{ width: '100%', height: 300 }}>
        <h3 className="convex-panel-health-header convex-panel-table-header-theme" style={{ fontSize: '14px' }}>Failure Rate</h3>
        <div style={{ color: '#ff4d4f', textAlign: 'center', marginTop: '20px' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="failure-rate-chart" style={{ width: '100%', height: 300, backgroundColor: '#1e1e1e', borderRadius: '8px' }}>
      <h3 className="convex-panel-health-header convex-panel-table-header-theme" style={{ color: '#fff', fontSize: '14px' }}>
        Failure Rate
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

export default FailureRateChart; 