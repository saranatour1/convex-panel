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

  const params = new URLSearchParams({
    window: JSON.stringify(window),
    k: '3'
  });

  // Ensure token has the 'Convex ' prefix
  const normalizedToken = authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;

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

  return data;
};

export const fetchFailureRate = async (deploymentUrl: string, authToken: string) => {
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

  const params = new URLSearchParams({
    window: JSON.stringify(window),
    k: '3'
  });

  // Ensure token has the 'Convex ' prefix
  const normalizedToken = authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;

  const response = await fetch(
    `${deploymentUrl}/api/app_metrics/failure_percentage_top_k?${params}`,
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
    throw new Error(`Failed to fetch failure rate: ${response.statusText}`);
  }

  const data = await response.json();

  return data;
};

export async function fetchSchedulerLag(
  deploymentUrl: string,
  authToken: string
): Promise<any> {
  // Create a window object (start: 1 hour ago, end: now)
  const end = new Date();
  const start = new Date(end.getTime() - 60 * 60 * 1000); // 1 hour before
  
  const window = {
    start: {
      secs_since_epoch: Math.floor(start.getTime() / 1000),
      nanos_since_epoch: (start.getTime() % 1000) * 1000000
    },
    end: {
      secs_since_epoch: Math.floor(end.getTime() / 1000),
      nanos_since_epoch: (end.getTime() % 1000) * 1000000
    },
    num_buckets: 60
  };

  try {
    const response = await fetch(
      `${deploymentUrl}/api/app_metrics/scheduled_job_lag?window=${encodeURIComponent(JSON.stringify(window))}`,
      {
        headers: {
          Authorization: `Convex ${authToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching scheduler lag data:', error);
    throw error;
  }
}