import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useFunctionsState } from './FunctionsProvider';
import { 
  fetchPerformanceCacheHitRate, 
  fetchPerformanceFailureRate, 
  fetchPerformanceInvocationRate,
  fetchSourceCode
} from '../utils/api';
import { format } from 'date-fns';

interface PerformanceGraphsProps {
  functionId: string;
  functionPath: string;
  udfType: string;
  authToken: string;
  baseUrl: string;
}

interface MetricData {
  timestamp: number;
  latency: number;
  memory: number;
  cacheHitRate: number;
  failureRate: number;
  invocationRate: number;
}

interface ChartData {
  data: any[];
  xAxisKey: string;
  lineKeys: {
    key: string;
    name: string;
    color: string;
  }[];
}

interface DataPoint {
  timestamp: {
    secs_since_epoch: number;
    nanos_since_epoch: number;
  };
  value: number;
}

function SingleGraph({
  title,
  dataSource,
  syncId,
}: {
  title: "Cache Hit Rate" | "Function Calls" | "Errors" | "Execution Time";
  dataSource: (start: Date, end: Date) => Promise<ChartData>;
  syncId?: string;
}) {
  const [chartData, setChartData] = useState<ChartData>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getChartData() {
      try {
        const initEndDate = new Date();
        const initStartDate = new Date(initEndDate);
        initStartDate.setHours(initStartDate.getHours() - 1);
        const data = await dataSource(initStartDate, initEndDate);
        setChartData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load metrics data');
        setChartData(undefined);
      }
    }
    void getChartData();
  }, [dataSource]);

  return (
    <div style={{ 
      backgroundColor: '#1e1e1e', 
      height: '250px',
      borderLeft: '1px solid #333',
      borderRight: '1px solid #333',
      borderBottom: '1px solid #333',
    
    }}>
      <h3 className="convex-panel-health-header convex-panel-table-header-theme">{title}</h3>
      <div style={{ width: '100%', height: 'calc(100% - 40px)' }}>
        {error && (
          <div style={{ color: '#f44336', padding: '16px' }}>{error}</div>
        )}
        {!error && chartData && chartData.data && chartData.data.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              syncId={syncId}
              data={chartData.data}
              margin={{
                top: 5,
                right: 30,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255,255,255,0.1)"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey={chartData.xAxisKey}
                tickLine={false}
                axisLine={false}
                stroke="rgba(255,255,255,0.1)"
                tick={{ fill: '#cccccc', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                stroke="rgba(255,255,255,0.1)"
                tick={{ fill: '#cccccc', fontSize: 12 }}
                width={40}
                domain={title === "Cache Hit Rate" ? [0, 100] : [0, 4]}
                ticks={title === "Cache Hit Rate" ? [0, 25, 50, 75, 100] : [0, 1, 2, 3, 4]}
                tickFormatter={(value) =>
                  title === "Cache Hit Rate" ? `${value}%` : value.toString()
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  padding: '8px'
                }}
                labelStyle={{ color: '#cccccc' }}
                cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              {chartData.lineKeys.map((line) => {
                const dataKey = line.key;
                const { name } = line;
                const { color } = line;
                return (
                  <Line
                    key={dataKey}
                    type="monotone"
                    dataKey={dataKey}
                    name={name}
                    stroke={color}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
        {!error && (!chartData || !chartData.data || chartData.data.length === 0) && (
          <div style={{ color: '#cccccc', padding: '16px', textAlign: 'center' }}>
            No data available
          </div>
        )}
      </div>
    </div>
  );
}

export function PerformanceGraphs({ functionId, functionPath, udfType, authToken, baseUrl }: PerformanceGraphsProps) {
  const { convexClient } = useFunctionsState();

  const genErrorOrInvocationFunc = (metric: string, name: string, color: string) => {
    return async (start: Date, end: Date) => {
      try {
        const now = Math.floor(end.getTime() / 1000);
        const oneHourAgo = Math.floor(start.getTime() / 1000);

        const window = {
          start: {
            secs_since_epoch: oneHourAgo,
            nanos_since_epoch: 0
          },
          end: {
            secs_since_epoch: now,
            nanos_since_epoch: 0
          },
          num_buckets: 60
        };

        let data;
        if (metric === 'invocations') {
          data = await fetchPerformanceInvocationRate(baseUrl, authToken, functionPath, udfType, window);
        } else {
          data = await fetchPerformanceFailureRate(baseUrl, authToken, functionPath, udfType, window);
        }

        if (!data || !Array.isArray(data)) {
          console.warn('Invalid data format received:', data);
          return {
            data: [],
            xAxisKey: 'time',
            lineKeys: [{ key: 'metric', name, color }]
          };
        }

        // Generate timestamps for all buckets
        const interval = (now - oneHourAgo) / 60;
        const timestamps = Array.from({ length: 60 }, (_, i) => {
          const timestamp = oneHourAgo + (i * interval);
          return {
            secs_since_epoch: Math.floor(timestamp),
            nanos_since_epoch: 0
          };
        });

        // Create a map of existing data points
        const dataMap = new Map(
          data.filter(point => 
            point && 
            Array.isArray(point) && 
            point.length === 2 && 
            point[0]?.secs_since_epoch && 
            typeof point[1] === 'number'
          ).map(point => [point[0].secs_since_epoch, point[1]])
        );

        // Fill in missing data points with zeros
        const chartData = timestamps.map(timestamp => ({
          time: format(new Date(timestamp.secs_since_epoch * 1000), 'hh:mm a'),
          metric: dataMap.get(timestamp.secs_since_epoch) || 0
        }));


        return {
          data: chartData,
          xAxisKey: 'time',
          lineKeys: [{ key: 'metric', name, color }]
        };
      } catch (err) {
        console.error('Error processing metrics:', err);
        throw err;
      }
    };
  };

  const calcCacheHitPercentage = async (start: Date, end: Date) => {
    try {
      const now = Math.floor(end.getTime() / 1000);
      const oneHourAgo = Math.floor(start.getTime() / 1000);

      const window = {
        start: {
          secs_since_epoch: oneHourAgo,
          nanos_since_epoch: 0
        },
        end: {
          secs_since_epoch: now,
          nanos_since_epoch: 0
        },
        num_buckets: 60  // Changed from 30 to 60 to match other metrics
      };

      const data = await fetchPerformanceCacheHitRate(baseUrl, authToken, functionPath, udfType, window);

      if (!data || !data.data || !data.data[0] || !data.data[0].points) {
        return {
          data: [],
          xAxisKey: 'time',
          lineKeys: [{ key: 'metric', name: '%', color: 'rgb(var(--chart-line-1))' }]
        };
      }

      // Generate timestamps for all buckets
      const interval = (now - oneHourAgo) / 60;
      const timestamps = Array.from({ length: 60 }, (_, i) => ({
        secs_since_epoch: Math.floor(oneHourAgo + (i * interval)),
        nanos_since_epoch: 0
      }));

      // Create a map of existing data points
      const dataMap = new Map(
        data.data[0].points
          .filter((point: DataPoint) => point && point.timestamp && typeof point.value === 'number')
          .map((point: DataPoint) => [point.timestamp.secs_since_epoch, point.value])
      );

      // Fill in missing data points with zeros
      const chartData = timestamps.map(timestamp => ({
        time: format(new Date(timestamp.secs_since_epoch * 1000), 'hh:mm a'),
        metric: Math.round((Number(dataMap.get(timestamp.secs_since_epoch) || 0) + Number.EPSILON) * 100) / 100
      }));

      return {
        data: chartData,
        xAxisKey: 'time',
        lineKeys: [{ key: 'metric', name: '%', color: 'rgb(var(--chart-line-1))' }]
      };
    } catch (err) {
      console.error('Error fetching cache hit rate:', err);
      throw err;
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '4px',
      marginTop: '4px'
    }}>
      <SingleGraph
        title="Function Calls"
        dataSource={genErrorOrInvocationFunc(
          "invocations",
          "Function Calls",
          "#3b82f6" // Blue color
        )}
        syncId="fnMetrics"
      />
      <SingleGraph
        title="Errors"
        dataSource={genErrorOrInvocationFunc(
          "errors",
          "Errors",
          "#ef4444" // Red color
        )}
        syncId="fnMetrics"
      />
      {udfType.toLowerCase() === "query" && (
        <>
          <SingleGraph
            title="Execution Time"
            dataSource={genErrorOrInvocationFunc(
              "execution_time",
              "Execution Time",
              "#f59e0b" // Amber color
            )}
            syncId="fnMetrics"
          />
          <SingleGraph
            title="Cache Hit Rate"
            dataSource={calcCacheHitPercentage}
            syncId="fnMetrics"
          />
        </>
      )}
    </div>
  );
} 