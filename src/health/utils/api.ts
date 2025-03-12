interface TimeWindow {
  start: {
    secs_since_epoch: number;
    nanos_since_epoch: number;
  };
  end: {
    secs_since_epoch: number;
    nanos_since_epoch: number;
  };
  num_buckets: number;
}

export const fetchCacheHitRate = async (deploymentUrl: string, authToken: string) => {
  // Calculate timestamps for the last hour
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const oneHourAgo = now - 3600; // One hour ago

  const window = {
    start: {
      secs_since_epoch: oneHourAgo,
      nanos_since_epoch: 0
    },
    end: {
      secs_since_epoch: now,
      nanos_since_epoch: 0
    },
    num_buckets: 60 // 1 minute intervals
  };

  console.log('Time window:', {
    start: new Date(oneHourAgo * 1000).toISOString(),
    end: new Date(now * 1000).toISOString()
  });

  const params = new URLSearchParams({
    window: JSON.stringify(window),
    k: '3'
  });

  // Ensure token has the 'Convex ' prefix
  const normalizedToken = authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;

  console.log('Making request with headers:', {
    'Authorization': normalizedToken,
    'Convex-Client': 'dashboard-0.0.0',
    'Origin': 'https://dashboard.convex.dev',
    'Referer': 'https://dashboard.convex.dev/'
  });

  const response = await fetch(
    `${deploymentUrl}/api/app_metrics/cache_hit_percentage_top_k?${params}`,
    {
      headers: {
        'Authorization': normalizedToken,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
        'Origin': 'https://dashboard.convex.dev',
        'Referer': 'https://dashboard.convex.dev/'
      }
    }
  );

  if (!response.ok) {
    console.error('Response status:', response.status);
    console.error('Response headers:', response.headers);
    const responseText = await response.text();
    console.error('Response body:', responseText);
    throw new Error(`Failed to fetch cache hit rate: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Cache Hit Rate API Response:', JSON.stringify(data, null, 2));
  return data;
};

// Test function to try the API call
export const testCacheHitRateAPI = async () => {
  try {
    const testUrl = 'https://beloved-vulture-957.convex.cloud';
    // The token already includes the 'Convex ' prefix
    const testToken = 'Convex eyJ2MiI6ImFmNTRmYWUwZmI4ZTQ4MTNiYTExNjE3NGVhMTMxMmZjIn0=';
    
    console.log('Testing Cache Hit Rate API...');
    console.log('URL:', testUrl);
    console.log('Token:', testToken);
    const data = await fetchCacheHitRate(testUrl, testToken);
    console.log('API call successful!');
    return data;
  } catch (error) {
    console.error('API Test Error:', error);
    throw error;
  }
}; 