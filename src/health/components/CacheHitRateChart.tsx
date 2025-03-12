import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { fetchCacheHitRate } from '../utils/api';

interface CacheHitData {
  timestamp: string;
  values: Record<string, number | null>;
}

interface CacheHitRateChartProps {
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

const CacheHitRateChart: React.FC<CacheHitRateChartProps> = ({
  deploymentUrl,
  authToken,
  refreshInterval = 60000 // Default to 1 minute
}) => {
  const [data, setData] = useState<CacheHitData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

      // Initialize data points for each timestamp
      const transformedData = sortedTimestamps.map(timestamp => ({
        timestamp: new Date(timestamp * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        values: {} as Record<string, number | null>
      }));

      // Initialize all function names with null values
      const allFunctionNames = response.map(([name]) => name);
      transformedData.forEach(dataPoint => {
        allFunctionNames.forEach(name => {
          dataPoint.values[name] = null;
        });
        // Add a special key for all other queries
        dataPoint.values['_rest'] = null;
      });

      // Fill in values for each function
      response.forEach(([functionName, timeSeries]) => {
        const timeValueMap = new Map(
          timeSeries.map(([timestamp, value]) => [timestamp.secs_since_epoch, value])
        );

        transformedData.forEach(dataPoint => {
          const timestamp = sortedTimestamps[transformedData.indexOf(dataPoint)];
          dataPoint.values[functionName] = timeValueMap.get(timestamp) ?? null;
        });
      });

      console.log('Transformed data:', transformedData);
      setData(transformedData);
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

  if (loading) {
    return (
      <div className="cache-hit-rate-chart" style={{ width: '100%', height: 300 }}>
        <h3>Cache Hit Rate</h3>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cache-hit-rate-chart" style={{ width: '100%', height: 300 }}>
        <h3>Cache Hit Rate</h3>
        <div style={{ color: '#ff4d4f', textAlign: 'center', marginTop: '20px' }}>
          {error}
        </div>
      </div>
    );
  }

  // Get unique function names from the data
  const functionNames = Array.from(
    new Set(
      data.flatMap(d => Object.keys(d.values))
    )
  ).filter(name => name !== '_rest' && name !== undefined); // Filter out _rest and undefined

  // Generate colors for each function
  const colorMap: Record<string, string> = {
    'organization.js:checkUserOrganizationSlug': '#4CAF50', // Green
    'stats.js:getFilteredData': '#9e9e9e',  // Gray
    'companies.js:getCompanies': '#e91e63', // Pink/Magenta
    '_rest': '#2196F3' // Blue
  };

  // Function to format the function name for display
  const formatFunctionName = (name: string) => {
    if (name === '_rest') return 'All other queries';
    if (name.includes('organization.js:')) return '...kUserOrganizationSlug';
    if (name.includes('stats.js:')) return 'stats:getFilteredData';
    if (name.includes('companies.js:')) return 'companies:getCompanies';
    return name;
  };

  // Order of functions in the legend
  const orderedFunctions = [
    'stats.js:getFilteredData',
    'organization.js:checkUserOrganizationSlug',
    'companies.js:getCompanies',
    '_rest'
  ];

  // Function to get the next minute for the tooltip
  const getNextMinute = (timeStr: string): string => {
    const date = new Date(`1970/01/01 ${timeStr}`);
    date.setMinutes(date.getMinutes() + 1);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="cache-hit-rate-chart" style={{ width: '100%', height: 300, backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '16px' }}>
      <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '18px' }}>Cache Hit Rate</h3>
      <ResponsiveContainer width="100%" height="100%">
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
              const formattedName = formatFunctionName(name);
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
          <Legend 
            formatter={formatFunctionName}
            iconType="circle"
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            wrapperStyle={{
              bottom: -20,
              fontSize: '12px',
              color: '#cccccc'
            }}
          />
          {orderedFunctions.map((name) => (
            <Line
              key={name}
              type="linear"
              dataKey={`values.${name}`}
              name={name}
              stroke={colorMap[name]}
              dot={{ r: 2.5, fill: colorMap[name], strokeWidth: 0 }}
              activeDot={{ r: 3.5, fill: colorMap[name], strokeWidth: 0 }}
              strokeWidth={1.5}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CacheHitRateChart; 