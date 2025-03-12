import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface FailureRateChartProps {
  data: Array<{
    timestamp: string;
    rate: number;
  }>;
}

const FailureRateChart: React.FC<FailureRateChartProps> = ({ data }) => {
  return (
    <div className="failure-rate-chart" style={{ width: '100%', height: 300 }}>
      <h3>Failure Rate</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fill: '#cccccc' }}
          />
          <YAxis
            tick={{ fill: '#cccccc' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              color: '#fff',
            }}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#ff4d4f"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FailureRateChart; 