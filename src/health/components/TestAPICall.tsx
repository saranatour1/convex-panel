import React, { useEffect, useState } from 'react';
import { testCacheHitRateAPI } from '../utils/api';

const TestAPICall: React.FC = () => {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        const data = await testCacheHitRateAPI();
        setResponse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    };

    testAPI();
  }, []);

  if (error) {
    return (
      <div style={{ padding: 20, color: 'red' }}>
        <h3>Error Testing API</h3>
        <pre>{error}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>API Test Results</h3>
      <pre style={{ 
        background: '#1e1e1e', 
        padding: 15, 
        borderRadius: 4,
        color: '#fff',
        overflow: 'auto',
        maxHeight: '500px'
      }}>
        {JSON.stringify(response, null, 2)}
      </pre>
    </div>
  );
};

export default TestAPICall; 