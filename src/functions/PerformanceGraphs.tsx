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
  fetchPerformanceInvocationRate,
  fetchPerformanceExecutionTime,
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

interface LineKey {
  key: string;
  name: string;
  color: string;
}

interface TimePoint {
  time: string;
  [key: string]: number | string;  // Allow dynamic metric keys
}

interface PerformanceDataPoint {
  secs_since_epoch: number;
  nanos_since_epoch: number;
}

interface LatencyDataPoint {
  0: PerformanceDataPoint;
  1: number | null;
}

interface LatencySeries {
  0: number;
  1: LatencyDataPoint[];
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
        // Use current time as end and 1 hour before as start
        const initEndDate = new Date();
        const initStartDate = new Date(initEndDate.getTime() - 60 * 60 * 1000);
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

    // Refresh data every minute
    const intervalId = setInterval(getChartData, 60000);
    return () => clearInterval(intervalId);
  }, [dataSource]);

  // Get Y-axis configuration based on metric type
  const getYAxisConfig = () => {
    switch (title) {
      case "Cache Hit Rate":
        return {
          domain: [0, 100],
          ticks: [0, 25, 50, 75, 100],
          tickFormatter: (value: number) => `${value}%`
        };
      case "Function Calls":
        return {
          domain: [0, 16],
          allowDataOverflow: true,
          ticks: [0, 4, 8, 12, 16],
          tickFormatter: (value: number) => value.toString()
        };
      case "Errors":
        return {
          domain: [0, 4],
          allowDataOverflow: true,
          ticks: [0, 1, 2, 3, 4],
          tickFormatter: (value: number) => value.toString()
        };
      case "Execution Time":
        return {
          domain: [0, 340],
          allowDataOverflow: true,
          ticks: [0, 85, 170, 255, 340],
          tickFormatter: (value: number) => `${value}ms`
        };
    }
  };

  const yAxisConfig = getYAxisConfig();

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
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                stroke="rgba(255,255,255,0.1)"
                tick={{ fill: '#cccccc', fontSize: 12 }}
                width={40}
                domain={yAxisConfig.domain}
                allowDataOverflow={yAxisConfig.allowDataOverflow}
                ticks={yAxisConfig.ticks}
                tickFormatter={yAxisConfig.tickFormatter}
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
                formatter={(value: number) => {
                  if (title === "Cache Hit Rate") return `${value}%`;
                  if (title === "Execution Time") return `${value}ms`;
                  return value;
                }}
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
                    connectNulls={true}
                    isAnimationActive={false}
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

  function genErrorOrInvocationFunc(metric: string) {
    return async (start: Date, end: Date): Promise<ChartData> => {
      const dataMap = new Map<number, TimePoint>();
      
      try {
        const timeWindow = {
          start: {
            secs_since_epoch: Math.floor(start.getTime() / 1000),
            nanos_since_epoch: 0
          },
          end: {
            secs_since_epoch: Math.floor(end.getTime() / 1000),
            nanos_since_epoch: 0
          },
          num_buckets: 60
        };

        if (metric === 'latency') {
          const latencyData = await fetchPerformanceExecutionTime(baseUrl, authToken, functionPath, udfType, timeWindow);
          // Process all latency series
          latencyData.forEach((series: LatencySeries) => {
            const percentile = series[0];
            series[1].forEach((point: LatencyDataPoint) => {
              const timestamp = point[0].secs_since_epoch;
              const value = point[1] ?? 0;
              if (!dataMap.has(timestamp)) {
                const date = new Date(timestamp * 1000);
                dataMap.set(timestamp, {
                  time: format(date, 'h:mm a'),
                  p50: 0,
                  p90: 0,
                  p95: 0,
                  p99: 0
                });
              }
              const timePoint = dataMap.get(timestamp)!;
              if (percentile === 50) timePoint.p50 = value;
              else if (percentile === 90) timePoint.p90 = value;
              else if (percentile === 95) timePoint.p95 = value;
              else if (percentile === 99) timePoint.p99 = value;
            });
          });
        } else {
          const invocationData = await fetchPerformanceInvocationRate(baseUrl, authToken, functionPath, udfType, timeWindow);
          invocationData.forEach((point: [PerformanceDataPoint, number | null]) => {
            const timestamp = point[0].secs_since_epoch;
            const value = point[1] ?? 0;
            const date = new Date(timestamp * 1000);
            dataMap.set(timestamp, {
              time: format(date, 'h:mm a'),
              metric: value
            });
          });
        }

        // Sort data points by timestamp
        const sortedData = Array.from(dataMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([_, point]) => point);

        return {
          data: sortedData,
          xAxisKey: 'time',
          lineKeys: metric === 'latency' ? [
            { key: 'p50', name: '1ms p50', color: '#2196f3' },
            { key: 'p90', name: '171ms p90', color: '#ff9800' },
            { key: 'p95', name: '171ms p95', color: '#4caf50' },
            { key: 'p99', name: '171ms p99', color: '#f44336' }
          ] : [
            { key: 'metric', name: metric === 'errors' ? 'Errors' : 'Function Calls', color: metric === 'errors' ? '#f44336' : '#2196f3' }
          ]
        };
      } catch (err) {
        console.error('Error processing performance data:', err);
        throw err;
      }
    };
  }

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
        num_buckets: 60
      };

      const data = await fetchPerformanceCacheHitRate(baseUrl, authToken, functionPath, udfType, window);

      if (!data || !Array.isArray(data)) {
        return {
          data: [],
          xAxisKey: 'time',
          lineKeys: [] as LineKey[]
        };
      }

      // Process each series
      const seriesData = new Map<string, Map<number, number>>();
      const lineKeys: LineKey[] = [];
      
      data.forEach(([seriesName, points]: [string, Array<[{secs_since_epoch: number}, number | null]>]) => {
        // Skip if no points
        if (!points || !Array.isArray(points)) return;

        // Create a map of data points for this series
        const seriesPoints = new Map(
          points
            .filter(point => point && point[0])
            .map(([timestamp, value]) => [
              timestamp.secs_since_epoch,
              typeof value === 'number' ? value : 0
            ])
        );

        seriesData.set(seriesName, seriesPoints);
        
        // Add line key with appropriate color
        const color = seriesName === '_rest' ? 'rgb(var(--chart-line-1))' : 
                     seriesName.includes('stripe') ? '#f59e0b' :
                     seriesName.includes('stats') ? '#3b82f6' : '#10b981';
        
        lineKeys.push({
          key: `metric_${seriesName}`,
          name: seriesName === '_rest' ? 'Other' : seriesName.split('.js:')[1] || seriesName,
          color
        });
      });

      // Generate timestamps for all buckets
      const interval = Math.floor((now - oneHourAgo) / 60);
      const timestamps = Array.from({ length: 60 }, (_, i) => oneHourAgo + (i * interval));

      // Create chart data points
      const chartData = timestamps.map(timestamp => {
        const date = new Date(timestamp * 1000);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;

        const timePoint: TimePoint = {
          time: timeString
        };

        // Add data point for each series
        seriesData.forEach((points, seriesName) => {
          timePoint[`metric_${seriesName}`] = Math.round((points.get(timestamp) || 0) * 100) / 100;
        });

        return timePoint;
      });

      return {
        data: chartData,
        xAxisKey: 'time',
        lineKeys
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
        dataSource={genErrorOrInvocationFunc("invocations")}
        syncId="fnMetrics"
      />
      <SingleGraph
        title="Errors"
        dataSource={genErrorOrInvocationFunc("errors")}
        syncId="fnMetrics"
      />
      {udfType.toLowerCase() === "query" && (
        <>
          <SingleGraph
            title="Execution Time"
            dataSource={genErrorOrInvocationFunc("latency")}
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