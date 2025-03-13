import { API_ROUTES } from 'src/utils/constants';
import { LogEntry } from '../logs/types';

interface FetchLogsOptions {
  cursor: number | string;
  convexUrl: string;
  accessToken: string;
  signal?: AbortSignal;
}

interface FetchLogsResponse {
  logs: LogEntry[];
  newCursor?: number | string;
  hostname: string;
}

/**
 * Fetch logs from the Convex API
 * @param param0 FetchLogsOptions
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
  const response = await fetch(`${baseUrl}${API_ROUTES.STREAM_FUNCTION_LOGS}?cursor=${cursor}`, {
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
