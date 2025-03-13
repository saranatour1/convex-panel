import { LogEntry } from "../logs/types";

/**
 * Format JSON for display
 */
export const formatJson = (obj: any) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
};

/**
 * Function to generate a unique ID for each log entry
 * @param log - The log entry to generate an ID for
 * @returns A unique ID for the log entry
 */
export const getLogId = (log: LogEntry) => {
  return `${log.timestamp}-${log.function?.request_id || ''}-${log.message || ''}`;
};