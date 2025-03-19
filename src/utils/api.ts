import { ROUTES } from '../utils/constants';
import { LogEntry, TableDefinition } from '../types';
import { getActiveTable } from './storage';
import { FetchLogsOptions, FetchLogsResponse, FetchTablesOptions, FetchTablesResponse } from '../types';
import { mockFetchLogsFromApi, mockFetchTablesFromApi, mockFetchCacheHitRate, mockFetchFailureRate, mockFetchSchedulerLag } from './mockData';

/**
 * Fetch logs from the Convex API
 * @param FetchLogsOptions
 * @returns FetchLogsResponse
 */
export async function fetchLogsFromApi({
  /** 
   * The cursor position to fetch logs from.
   * Used for pagination and real-time log streaming.
   * Pass the newCursor from previous response to get next batch.
   * @default 'now' 
   */
  cursor,

  /**
   * URL of your Convex deployment.
   * Format: https://[deployment-name].convex.cloud
   * Required for making API calls to correct environment.
   * @required
   */
  convexUrl,

  /**
   * Authentication token for Convex API access.
   * Required to authorize log fetching requests.
   * Keep secure and do not expose to clients.
   * @required
   */
  accessToken,

  /**
   * AbortSignal for cancelling fetch requests.
   * Useful for cleanup when component unmounts.
   * Pass signal from AbortController to enable cancellation.
   * @optional
   */
  signal,

  /**
   * Whether to use mock data instead of making API calls.
   * Useful for development, testing, and demos.
   * @default false
   */
  useMockData = false
}: FetchLogsOptions & { useMockData?: boolean }): Promise<FetchLogsResponse> {
  // Use mock data if useMockData is true
  if (useMockData) {
    return mockFetchLogsFromApi(cursor);
  }

  // Create URL object based on convex url
  const urlObj = new URL(convexUrl);
  const baseUrl = `${urlObj.protocol}//${urlObj.hostname}`;
  
  // Stream function logs
  const response = await fetch(`${baseUrl}${ROUTES.STREAM_FUNCTION_LOGS}?cursor=${cursor}`, {
    headers: {
      "authorization": `Convex ${accessToken}`
    },
    signal,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch logs: HTTP ${response.status}`);
  }
  
  const data = await response.json();
  
  // Format logs to our log format
  const formattedLogs: LogEntry[] = data.entries?.map((entry: any) => ({
    timestamp: entry.timestamp || Date.now(),
    topic: entry.topic || 'console',
    function: {
      type: entry.udfType,
      path: entry.identifier,
      cached: entry.cachedResult,
      request_id: entry.requestId
    },
    log_level: entry.level || 'INFO',
    message: entry.message || JSON.stringify(entry),
    execution_time_ms: entry.executionTime ? entry.executionTime * 1000 : undefined,
    status: entry.success === null 
      ? undefined 
      : (typeof entry.success === 'object' && entry.success !== null)
        ? 'success'  // If success is an object (like {status: "200"}), it's a success
        : entry.success === true
          ? 'success'
          : 'error',
    error_message: entry.error,
    raw: entry
  })) || [];

  return {
    logs: formattedLogs,
    newCursor: data.newCursor,
    hostname: urlObj.hostname
  };
}

/**
 * Fetch all tables from the Convex instance
 */
export async function fetchTablesFromApi({
  /**
   * The URL of the Convex instance.
   * Used to make API requests to the Convex backend.
   * @required
   */
  convexUrl,

  /**
   * Access token for authenticating API requests.
   * Required for securing access to the Convex backend.
   * Should be kept private and not exposed to clients.
   * @required
   */
  accessToken,

  /**
   * Optional Convex admin client instance.
   * Used for making admin-level API requests.
   * Must be initialized and configured before passing.
   * @optional
   */
  adminClient,

  /**
   * Whether to use mock data instead of making API calls.
   * Useful for development, testing, and demos.
   * @default false
   */
  useMockData = false
}: FetchTablesOptions & { useMockData?: boolean }): Promise<FetchTablesResponse> {
  // Use mock data if useMockData is true
  if (useMockData) {
    return mockFetchTablesFromApi();
  }

  if (!convexUrl || !accessToken) {
    throw new Error('Missing URL or access token');
  }

  const response = await fetch(`${convexUrl}${ROUTES.SHAPES2}`, {
    headers: {
      "authorization": `Convex ${accessToken}`,
      "convex-client": "dashboard-0.0.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tables: HTTP ${response.status}`);
  }

  const data = await response.json();

  // Verify data structure
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data structure received');
  }

  // Filter out "Never" type tables
  const tableData = Object.entries(data).reduce((acc, [tableName, tableSchema]) => {
    if ((tableSchema as any).type !== 'Never') {
      acc[tableName] = tableSchema as any;
    }
    return acc;
  }, {} as TableDefinition);

  // Check if we have a stored active table
  const storedActiveTable = getActiveTable();
  let selectedTable = '';

  if (storedActiveTable && tableData[storedActiveTable]) {
    // Use the stored table if it exists
    selectedTable = storedActiveTable;
  } else if (Object.keys(tableData).length > 0 && adminClient) {
    // Otherwise use the first table if adminClient is available
    try {
      await adminClient.query("_system/frontend/tableSize:default" as any, {
        componentId: null,
        tableName: Object.keys(tableData)[0]
      });
    } catch (err) {
      console.error("Error fetching table size:", err);
    }

    
    selectedTable = Object.keys(tableData)[0] || '';
  }

  return {
    tables: tableData,
    selectedTable
  };
}

/**
 * Fetch the cache hit rate from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns The cache hit rate
 */
export const fetchFailureRate = async (
  deploymentUrl: string, 
  authToken: string, 
  useMockData = false
) => {
  // Use mock data if useMockData is true
  if (useMockData) {
    return mockFetchFailureRate();
  }

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
    `${deploymentUrl}${ROUTES.FAILURE_RATE}?${params}`,
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

  return response.json();
};


/**
 * Fetch the cache hit rate from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns The cache hit rate
 */
export const fetchCacheHitRate = async (
  deploymentUrl: string, 
  authToken: string, 
  useMockData = false
) => {
  // Use mock data if useMockData is true
  if (useMockData) {
    return mockFetchCacheHitRate();
  }

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
    `${deploymentUrl}${ROUTES.CACHE_HIT_RATE}?${params}`,
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


/**
 * Fetch the failure rate from the Convex API
 */
export const fetchPerformanceFailureRate = async (
  deploymentUrl: string,
  authToken: string,
  functionPath: string,
  udfType: string,
  window: any
) => {
  // Extract just the file path (e.g., "users.js" from "users.js:viewer")
  const path = functionPath.split(':')[0];

  const params = new URLSearchParams({
    window: JSON.stringify(window),
    k: '3',
    path,
    udfType
  });

  const normalizedToken = authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;

  const response = await fetch(
    `${deploymentUrl}${ROUTES.FAILURE_RATE}?${params}`,
    {
      headers: {
        'Authorization': normalizedToken,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
      }
    }
  );

  if (!response.ok) {
    console.error('Response status:', response.status);
    console.error('Response headers:', response.headers);
    const responseText = await response.text();
    console.error('Response body:', responseText);
    throw new Error(`Failed to fetch failure rate: HTTP ${response.status}`);
  }

  return response.json();
};

/**
 * Fetch the scheduler lag from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns The scheduler lag
 */
export async function fetchSchedulerLag(
  deploymentUrl: string,
  authToken: string,
  useMockData = false
): Promise<any> {
  // Use mock data if useMockData is true
  if (useMockData) {
    return mockFetchSchedulerLag();
  }

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
          'Authorization': `Convex ${authToken}`,
          'Content-Type': 'application/json',
          'Convex-Client': 'dashboard-0.0.0',
          'Origin': 'https://dashboard.convex.dev',
          'Referer': 'https://dashboard.convex.dev/'
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

/**
 * Fetch the API spec for all functions in the Convex deployment
 * @param adminClient - The Convex admin client instance
 * @param useMockData - Whether to use mock data instead of making API calls
 * @returns Array of function specifications
 */
export async function fetchFunctionSpec(
  adminClient: any,
  useMockData = false
): Promise<any[]> {
  if (useMockData) {
    return []; // TODO: Add mock data implementation
  }

  if (!adminClient) {
    throw new Error('Admin client not available');
  }

  try {
    const results = await adminClient.query("_system/cli/modules:apiSpec" as any, {
      componentId: null,
    }) as any[];

    return results;
  } catch (err) {
    console.error('Error fetching function spec:', err);
    throw new Error('Failed to fetch function specifications');
  }
}

interface MetricsWindow {
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

/**
 * Fetch performance metrics for a specific function from the Convex API
 */
const fetchPerformanceMetric = async (
  baseUrl: string,
  authToken: string,
  functionPath: string,
  metric: string,
  udfType: string,
  window: MetricsWindow
) => {
  // Extract just the file path (e.g., "users.js" from "users.js:viewer")
  const path = functionPath.split(':')[0];

  // Ensure token has the 'Convex ' prefix
  const normalizedToken = authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;

  // Format window parameter to match dashboard format
  // Ensure timestamps are in the past and limit to 30 minutes to reduce load
  const now = Math.floor(Date.now() / 1000);
  const thirtyMinutesAgo = now - 1800; // 30 minutes instead of 1 hour
  
  const formattedWindow = {
    start: {
      secs_since_epoch: thirtyMinutesAgo,
      nanos_since_epoch: 0
    },
    end: {
      secs_since_epoch: now,
      nanos_since_epoch: 0
    },
    num_buckets: 30 // 1 minute intervals for 30 minutes
  };

  // Build the URL with properly encoded parameters
  const url = new URL(`${baseUrl}/api/app_metrics/${metric}_top_k`);
  url.searchParams.append('path', path);
  url.searchParams.append('window', JSON.stringify(formattedWindow));
  url.searchParams.append('udfType', udfType);
  url.searchParams.append('k', '3');

  // Maximum number of retries
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount < MAX_RETRIES) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': normalizedToken,
          'Content-Type': 'application/json',
          'Convex-Client': 'convex-panel-extension',
          'Origin': baseUrl,
          'Referer': baseUrl
        }
      });

      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * (retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retryCount++;
        continue;
      }

      if (!response.ok) {
        const responseText = await response.text();
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        console.error('Response body:', responseText);
        
        if (response.status === 500) {
          throw new Error(`Internal server error: ${responseText}`);
        }
        
        throw new Error(`Failed to fetch performance metric: HTTP ${response.status}`);
      }

      return response.json();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (retryCount < MAX_RETRIES - 1) {
        // Wait before retrying, using exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        retryCount++;
        continue;
      }
      break;
    }
  }

  throw lastError || new Error('Failed to fetch performance metric after retries');
};

/**
 * Fetch performance cache hit rate for a specific function
 */
export const fetchPerformanceCacheHitRate = async (
  baseUrl: string,
  authToken: string,
  functionPath: string,
  udfType: string,
  window: MetricsWindow
) => {
  return fetchPerformanceMetric(baseUrl, authToken, functionPath, 'cache_hit_percentage', udfType, window);
};

/**
 * Fetch performance invocation rate for a specific function
 */
export async function fetchPerformanceInvocationRate(
  baseUrl: string,
  authToken: string,
  functionPath: string,
  udfType: string,
  window: {
    start: { secs_since_epoch: number; nanos_since_epoch: number };
    end: { secs_since_epoch: number; nanos_since_epoch: number };
    num_buckets: number;
  }
) {
  const encodedPath = encodeURIComponent(functionPath);
  const encodedWindow = encodeURIComponent(JSON.stringify(window));
  
  const response = await fetch(
    `${baseUrl}/api/app_metrics/cache_hit_percentage?path=${encodedPath}&window=${encodedWindow}&udfType=${udfType}`,
    {
      headers: {
        Authorization: `Convex ${authToken}`,
        'Content-Type': 'application/json',
        'Convex-Client': 'convex-panel-extension',
        'Origin': baseUrl,
        'Referer': baseUrl
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to fetch invocation rate: ${response.statusText}`);
  }

  return data;
}

/**
 * Fetch source code for a function
 */
export const fetchSourceCode = async (
  deploymentUrl: string,
  authToken: string,
  functionPath: string
) => {
  // Extract just the file path (e.g., "users.js" from "users.js:viewer")
  const path = functionPath;
  
  const params = new URLSearchParams({ path });
  const normalizedToken = authToken.startsWith('Convex ') ? authToken : `Convex ${authToken}`;

  const response = await fetch(
    `${deploymentUrl}${ROUTES.GET_SOURCE_CODE}?${params}`,
    {
      headers: {
        'Authorization': normalizedToken,
        'Content-Type': 'application/json',
        'Convex-Client': 'dashboard-0.0.0',
      }
    }
  );

  if (!response.ok) {
    console.error('Response status:', response.status);
    console.error('Response headers:', response.headers);
    const responseText = await response.text();
    console.error('Response body:', responseText);
    throw new Error(`Failed to fetch source code: HTTP ${response.status}`);
  }

  return response.text();
};