import { ROUTES } from 'src/utils/constants';
import { LogEntry, TableDefinition } from '../types';
import { getActiveTable } from './storage';
import { FetchLogsOptions, FetchLogsResponse, FetchTablesOptions, FetchTablesResponse } from '../types';

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
  signal
}: FetchLogsOptions): Promise<FetchLogsResponse> {
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
    status: entry.success !== null ? (entry.success ? 'success' : 'error') : undefined,
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
  adminClient
}: FetchTablesOptions): Promise<FetchTablesResponse> {
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
 * @returns The cache hit rate
 */
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
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @returns The failure rate
 */
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

  const data = await response.json();

  return data;
};

/**
 * Fetch the scheduler lag from the Convex API
 * @param deploymentUrl - The URL of the Convex deployment
 * @param authToken - The authentication token for the Convex deployment
 * @returns The scheduler lag
 */
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
      `${deploymentUrl}${ROUTES.SCHEDULER_LAG}?window=${encodeURIComponent(JSON.stringify(window))}`,
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