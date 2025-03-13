import { LogEntry, LogType } from '../logs/types';

// Memoizable filter predicates
const createLogTypeFilter = (logType: LogType) => (log: LogEntry): boolean => {
  if (logType === LogType.ALL) return true;
  
  switch (logType) {
    case LogType.HTTP:
      return log.function?.type === 'HttpAction';
    case LogType.SUCCESS:
      return log.status === 'success';
    case LogType.FAILURE:
      return log.status === 'error';
    case LogType.DEBUG:
    case LogType.LOGINFO:
    case LogType.WARNING:
    case LogType.ERROR:
      const logLevelLower = log.log_level?.toLowerCase() || '';
      const topicLower = log.topic?.toLowerCase() || '';
      const filterValue = logType.toLowerCase();
      return logLevelLower === filterValue || topicLower === filterValue;
    default:
      return log.function?.type === logType;
  }
};

const createRequestIdFilter = (requestId: string) => (log: LogEntry): boolean => 
  !requestId || log.function?.request_id === requestId;

const createSuccessFilter = (showSuccess: boolean) => (log: LogEntry): boolean => 
  showSuccess || log.status !== 'success';

const createSearchTextFilter = (searchText: string) => (log: LogEntry): boolean => {
  if (!searchText) return true;
  
  const normalizedSearch = searchText.toLowerCase();
  const searchableFields = [
    log.function?.path,
    log.message,
    log.function?.request_id,
    log.error_message
  ];
  
  return searchableFields.some(field => 
    field?.toLowerCase().includes(normalizedSearch)
  );
};

export const createFilterPredicate = (
  logType: LogType,
  requestIdFilter: string,
  showSuccess: boolean,
  searchText: string
) => {
  // Create individual filter functions
  const logTypeFilter = createLogTypeFilter(logType);
  const requestIdFilterFn = createRequestIdFilter(requestIdFilter);
  const successFilter = createSuccessFilter(showSuccess);
  const searchTextFilter = createSearchTextFilter(searchText);
  
  // Return combined filter function
  return (log: LogEntry): boolean =>
    logTypeFilter(log) &&
    requestIdFilterFn(log) &&
    successFilter(log) &&
    searchTextFilter(log);
}; 