// Convex dashboard log types
export enum LogType {
	ALL = "All log types",
	SUCCESS = "success",
	FAILURE = "failure",
	DEBUG = "debug",
	LOGINFO = "loginfo",
	WARNING = "warn",
	ERROR = "error",
	HTTP = "HTTP",
}

// Convex log schema
export interface LogEntry {
  timestamp: number;
  topic: string;
  function?: {
    type?: string;
    path?: string; 
    cached?: boolean;
    request_id?: string;
  };
  log_level?: string;
  message?: string;
  execution_time_ms?: number;
  status?: string;
  error_message?: string;
  usage?: {
    database_read_bytes?: number;
    database_write_bytes?: number;
    file_storage_read_bytes?: number;
    file_storage_write_bytes?: number;
    vector_storage_read_bytes?: number;
    vector_storage_write_bytes?: number;
    action_memory_used_mb?: number;
  };
  system_code?: string;
  audit_log_action?: string;
  audit_log_metadata?: string;
  raw: any;
}