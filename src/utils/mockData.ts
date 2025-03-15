import { LogEntry, FetchLogsResponse, FetchTablesResponse, TableDefinition } from '../types';
import { LogType } from './constants';

// Store a mock log database to simulate persistence between calls
let mockLogDatabase: LogEntry[] = [];
let lastMockLogId = 0;

// Initialize the mock log database with some initial data
const initializeMockLogDatabase = () => {
  if (mockLogDatabase.length === 0) {
    // Generate 100 initial logs with timestamps spread over the last hour
    mockLogDatabase = Array.from({ length: 100 }, (_, i) => {
      const log = generateMockLog(lastMockLogId + i);
      return log;
    });
    
    // Sort by timestamp (newest first)
    mockLogDatabase.sort((a, b) => b.timestamp - a.timestamp);
    lastMockLogId += 100;
  }
};

// Generate a random timestamp within the last hour
const getRandomTimestamp = () => {
  const now = Math.floor(Date.now() / 1000); // Convert to seconds for consistency with Convex API
  const oneHourAgo = now - 3600; // One hour ago in seconds
  return Math.floor(Math.random() * (now - oneHourAgo)) + oneHourAgo;
};

// Generate a random log entry
const generateMockLog = (index: number): LogEntry => {
  const isSuccess = Math.random() > 0.2;
  const timestamp = getRandomTimestamp();
  
  // Define function types with proper display values
  const functionTypeOptions = [
    { type: 'query', display: 'Q' },
    { type: 'mutation', display: 'M' },
    { type: 'action', display: 'A' },
    { type: 'httpAction', display: 'H' }
  ];
  const functionTypeIndex = Math.floor(Math.random() * functionTypeOptions.length);
  const functionTypeObj = functionTypeOptions[functionTypeIndex];
  const functionType = functionTypeObj.type;
  
  // Create more realistic function paths with module:function format
  const functionModules = [
    'users',
    'auth',
    'posts',
    'comments',
    'messages',
    'products',
    'orders',
    'notifications',
    'files',
    'web'
  ];
  
  const functionNames: Record<string, string[]> = {
    'query': ['get', 'list', 'search', 'find', 'count', 'viewer', 'getProfile', 'getLogs'],
    'mutation': ['create', 'update', 'delete', 'add', 'remove', 'toggle', 'createLog'],
    'action': ['send', 'process', 'generate', 'upload', 'download', 'install', 'export'],
    'httpAction': ['webhook', 'api', 'callback', 'oauth', 'stripe', 'github']
  };
  
  const module = functionModules[Math.floor(Math.random() * functionModules.length)];
  const nameOptions = functionNames[functionType];
  const name = nameOptions[Math.floor(Math.random() * nameOptions.length)];
  
  // Format as module:function
  const functionPath = `${module}:${name}`;
  
  // Create the details string that shows just the function name without the type
  const functionDetails = functionPath;
  
  // Create more realistic messages
  const successMessages = [
    'Operation completed successfully',
    'Data retrieved successfully',
    'User authenticated',
    'Document created successfully',
    'Query executed in 45ms',
    'Cache hit for query',
    'Transaction committed',
    'Scheduled task completed'
  ];
  
  const errorMessages = [
    'Failed to complete operation',
    'Database connection error',
    'Authentication failed',
    'Invalid input parameters',
    'Permission denied',
    'Resource not found',
    'Timeout exceeded',
    'Rate limit exceeded'
  ];
  
  const message = isSuccess 
    ? successMessages[Math.floor(Math.random() * successMessages.length)]
    : errorMessages[Math.floor(Math.random() * errorMessages.length)];
  
  // Generate a realistic request ID
  const requestId = Math.random().toString(16).substring(2, 18).padEnd(16, '0');
  
  // Generate log levels with appropriate distribution
  const logLevels = isSuccess 
    ? ['INFO', 'DEBUG', 'INFO', 'INFO'] // More INFO for success
    : ['ERROR', 'WARN', 'ERROR', 'FATAL']; // More ERROR for failures
  
  const logLevel = logLevels[Math.floor(Math.random() * logLevels.length)];
  
  // Generate a unique mockId for this log
  const mockId = `mock-${index}-${Math.random().toString(36).substring(2, 8)}`;
  
  return {
    timestamp,
    topic: 'console',
    function: {
      type: functionTypeObj.display, // Use the display value (Q, M, A, H)
      path: functionPath,
      cached: Math.random() > 0.7,
      request_id: requestId
    },
    log_level: logLevel,
    message: message, // Use the original message
    execution_time_ms: Math.floor(Math.random() * 500),
    status: isSuccess ? 'success' : 'error',
    error_message: isSuccess ? undefined : `Error: ${message}`,
    raw: { 
      mockData: true,
      mockId,
      timestamp,
      level: logLevel,
      message,
      success: isSuccess,
      udfType: functionType, // Store the original function type
      identifier: functionPath,
      requestId,
      cachedResult: Math.random() > 0.7,
      executionTime: Math.floor(Math.random() * 500) / 1000,
      details: functionDetails // Add the details for expanded view
    }
  };
};

// Add a new log to the mock database
const addNewMockLog = () => {
  const newLog = generateMockLog(lastMockLogId++);
  // Add to the beginning (newest first)
  mockLogDatabase.unshift(newLog);
  
  // Keep database size reasonable
  if (mockLogDatabase.length > 500) {
    mockLogDatabase = mockLogDatabase.slice(0, 500);
  }
  
  return newLog;
};

// Mock implementation of fetchLogsFromApi
export const mockFetchLogsFromApi = async (cursor: number | string = 0): Promise<FetchLogsResponse> => {
  // Initialize the mock database if it's empty
  initializeMockLogDatabase();
  
  // Simulate network delay (shorter for better responsiveness)
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Always add new logs each time to ensure there's something to show
  const numNewLogs = Math.floor(Math.random() * 3) + 3; // Add 3-5 logs each time
  const newLogs = [];
  for (let i = 0; i < numNewLogs; i++) {
    newLogs.push(addNewMockLog());
  }

  
  // Always return some logs regardless of cursor to ensure UI has data
  let logs: LogEntry[] = [];
  
  // Handle different cursor formats
  if (cursor === 0 || cursor === 'now' || typeof cursor === 'string' && (cursor.includes('now') || cursor === '')) {
    // Return the most recent logs for initial load
    logs = mockLogDatabase.slice(0, 15); // Return more logs initially
    console.log(`Initial load with cursor ${cursor}, returning ${logs.length} logs`);
  } else {
    try {
      // Find logs newer than the cursor timestamp
      const cursorTimestamp = typeof cursor === 'string' ? parseInt(cursor) : cursor;
      
      if (isNaN(cursorTimestamp)) {
        // If cursor is not a valid number, return recent logs
        logs = mockLogDatabase.slice(0, 10);
        console.log(`Invalid cursor ${cursor}, returning ${logs.length} recent logs`);
      } else {
        // Get logs newer than cursor
        logs = mockLogDatabase.filter(log => log.timestamp > cursorTimestamp);
        console.log(`Filtering logs newer than cursor ${cursorTimestamp}, found ${logs.length} logs`);
        
        // If no logs found after cursor, return the most recent ones anyway
        if (logs.length === 0) {
          logs = mockLogDatabase.slice(0, 10);
          console.log(`No logs after cursor ${cursorTimestamp}, returning ${logs.length} recent logs instead`);
        }
        
        // Limit to 10 logs per request to simulate pagination
        logs = logs.slice(0, 10);
      }
    } catch (e) {
      // If there's any issue with cursor parsing, return recent logs
      console.log(`Error with cursor ${cursor}, returning recent logs`, e);
      logs = mockLogDatabase.slice(0, 10);
    }
  }
  
  // Ensure we always have a valid cursor for next fetch
  // Use the newest log's timestamp as the new cursor
  const newCursor = logs.length > 0 ? logs[0].timestamp : Math.floor(Date.now() / 1000);
  
  console.log(`Mock logs: Returning ${logs.length} logs, newCursor: ${newCursor}`);
  
  return {
    logs,
    newCursor,
    hostname: 'mock-deployment.convex.cloud'
  };
};

// Mock table definition
const mockTables: TableDefinition = {
  'users': {
    type: 'object',
    fields: [
      {
        fieldName: '_id',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: '_creationTime',
        optional: false,
        shape: { type: 'number' }
      },
      {
        fieldName: 'name',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'emailAddress',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'userId',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'provider',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'token',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'refreshToken',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'scope',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'expiresAt',
        optional: false,
        shape: { type: 'number' }
      },
      {
        fieldName: 'binaryIndex',
        optional: true,
        shape: { type: 'string' }
      },
      {
        fieldName: 'emailAddresses',
        optional: true,
        shape: { 
          type: 'Array',
          shape: { type: 'string' }
        }
      },
      {
        fieldName: 'nextDeltaToken',
        optional: true,
        shape: { type: 'string' }
      }
    ]
  },
  'posts': {
    type: 'object',
    fields: [
      {
        fieldName: '_id',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: '_creationTime',
        optional: false,
        shape: { type: 'number' }
      },
      {
        fieldName: 'title',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'content',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'authorId',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'published',
        optional: false,
        shape: { type: 'boolean' }
      },
      {
        fieldName: 'tags',
        optional: true,
        shape: { 
          type: 'Array',
          shape: { type: 'string' }
        }
      },
      {
        fieldName: 'viewCount',
        optional: true,
        shape: { type: 'number' }
      }
    ]
  },
  'messages': {
    type: 'object',
    fields: [
      {
        fieldName: '_id',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: '_creationTime',
        optional: false,
        shape: { type: 'number' }
      },
      {
        fieldName: 'body',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'author',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'channelId',
        optional: false,
        shape: { type: 'string' }
      },
      {
        fieldName: 'reactions',
        optional: true,
        shape: { type: 'object' }
      },
      {
        fieldName: 'attachments',
        optional: true,
        shape: { 
          type: 'Array',
          shape: { type: 'object' }
        }
      }
    ]
  }
};

// Mock implementation of fetchTablesFromApi
export const mockFetchTablesFromApi = async (): Promise<FetchTablesResponse> => {
  console.log('mockFetchTablesFromApi called');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Occasionally add a new field to a random table to simulate schema evolution
  if (Math.random() > 0.9) {
    const tables = Object.keys(mockTables);
    const randomTable = tables[Math.floor(Math.random() * tables.length)];
    const randomFieldName = `dynamicField${Math.floor(Math.random() * 1000)}`;
    
    // Add a new field to the table
    mockTables[randomTable].fields.push({
      fieldName: randomFieldName,
      optional: true,
      shape: { type: Math.random() > 0.5 ? 'string' : 'number' }
    });
  }
  
  console.log('mockFetchTablesFromApi returning tables:', Object.keys(mockTables));
  
  return {
    tables: mockTables,
    selectedTable: 'users'
  };
};

// Mock implementation of fetchCacheHitRate
export const mockFetchCacheHitRate = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate mock data for the last hour (60 minutes)
  const timestamps = Array.from({ length: 60 }, (_, i) => {
    const now = Math.floor(Date.now() / 1000);
    return {
      secs_since_epoch: now - (60 - i) * 60,
      nanos_since_epoch: 0
    };
  });
  
  // Define function names for the chart
  const functionNames = [
    'users:viewer',
    'organization:getActiveOrganization',
    'posts:getLatest',
    'auth:getCurrentUser',
    '_rest'
  ];
  
  // Generate data for each function with realistic patterns
  const functionData = functionNames.map(name => {
    let baseValue = 0;
    let amplitude = 0;
    let period = 10;
    let randomFactor = 0.05;
    
    // Configure different patterns for different functions
    switch (name) {
      case 'users:viewer':
        baseValue = 0.95; // 95% base hit rate
        amplitude = 0.05;
        period = 8;
        randomFactor = 0.02;
        break;
      case 'organization:getActiveOrganization':
        baseValue = 0.85; // 85% base hit rate
        amplitude = 0.15;
        period = 15;
        randomFactor = 0.05;
        break;
      case 'posts:getLatest':
        baseValue = 0.75; // 75% base hit rate
        amplitude = 0.1;
        period = 12;
        randomFactor = 0.03;
        break;
      case 'auth:getCurrentUser':
        baseValue = 0.9; // 90% base hit rate
        amplitude = 0.1;
        period = 10;
        randomFactor = 0.02;
        break;
      case '_rest':
        baseValue = 0.7; // 70% base hit rate
        amplitude = 0.05;
        period = 20;
        randomFactor = 0.1;
        break;
    }
    
    // Generate values with the configured pattern
    const values = timestamps.map((_, i) => {
      // Add sinusoidal fluctuation
      const fluctuation = amplitude * Math.sin(i / period * Math.PI);
      // Add some random noise
      const noise = (Math.random() - 0.5) * randomFactor;
      // Ensure value stays between 0 and 1.0
      const value = Math.min(1.0, Math.max(0, baseValue + fluctuation + noise));
      // Convert to percentage (0-100 range)
      return value * 100;
    });
    
    return [
      name,
      timestamps.map((timestamp, i) => [timestamp, values[i]])
    ];
  });
  
  return functionData;
};

// Mock implementation of fetchFailureRate
export const mockFetchFailureRate = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate mock data for the last hour (60 minutes)
  const timestamps = Array.from({ length: 60 }, (_, i) => {
    const now = Math.floor(Date.now() / 1000);
    return {
      secs_since_epoch: now - (60 - i) * 60,
      nanos_since_epoch: 0
    };
  });
  
  // Define function names for the chart
  const functionNames = [
    'users:viewer',
    'organization:getActiveOrganization',
    'posts:getLatest',
    'auth:getCurrentUser',
    '_rest'
  ];
  
  // Generate data for each function with realistic patterns
  const functionData = functionNames.map(name => {
    let baseValue = 0;
    let spikeFrequency = 0;
    let spikeAmplitude = 0;
    let randomFactor = 0.005;
    
    // Configure different patterns for different functions
    switch (name) {
      case 'users:viewer':
        baseValue = 0.002; // 0.2% base failure rate
        spikeFrequency = 20; // Spike every 20 minutes
        spikeAmplitude = 0.01; // 1% spike
        randomFactor = 0.002;
        break;
      case 'organization:getActiveOrganization':
        baseValue = 0.005; // 0.5% base failure rate
        spikeFrequency = 15; // Spike every 15 minutes
        spikeAmplitude = 0.03; // 3% spike
        randomFactor = 0.003;
        break;
      case 'posts:getLatest':
        baseValue = 0.001; // 0.1% base failure rate
        spikeFrequency = 30; // Spike every 30 minutes
        spikeAmplitude = 0.008; // 0.8% spike
        randomFactor = 0.001;
        break;
      case 'auth:getCurrentUser':
        baseValue = 0.003; // 0.3% base failure rate
        spikeFrequency = 25; // Spike every 25 minutes
        spikeAmplitude = 0.015; // 1.5% spike
        randomFactor = 0.002;
        break;
      case '_rest':
        baseValue = 0.01; // 1% base failure rate
        spikeFrequency = 10; // Spike every 10 minutes
        spikeAmplitude = 0.05; // 5% spike
        randomFactor = 0.01;
        break;
    }
    
    // Generate values with the configured pattern
    const values = timestamps.map((_, i) => {
      // Base failure rate
      let value = baseValue;
      
      // Add spike if at the right interval
      if (i % spikeFrequency === 0) {
        value += spikeAmplitude * Math.random();
      }
      
      // Add some random noise
      const noise = Math.random() * randomFactor;
      
      // Ensure value stays reasonable
      const finalValue = Math.max(0, value + noise);
      // Convert to percentage (0-100 range)
      return finalValue * 100;
    });
    
    return [
      name,
      timestamps.map((timestamp, i) => [timestamp, values[i]])
    ];
  });
  
  return functionData;
};

// Mock implementation of fetchSchedulerLag
export const mockFetchSchedulerLag = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate mock data for the last hour (60 minutes)
  const timestamps = Array.from({ length: 60 }, (_, i) => {
    const now = Math.floor(Date.now() / 1000);
    return {
      secs_since_epoch: now - (60 - i) * 60,
      nanos_since_epoch: 0
    };
  });
  
  // Generate more dramatic scheduler lag pattern with higher values and more variation
  const values = timestamps.map((_, i) => {
    // Base lag (0.5-2 minutes) - higher baseline than before
    let value = 0.5 + Math.random() * 1.5;
    
    // Add periodic pattern with more amplitude
    value += 1.0 * Math.sin(i / 8 * Math.PI);
    
    // Add some random noise for variation
    value += (Math.random() - 0.5) * 0.8;
    
    // Major spikes at specific points
    if (i === 15) {
      value += 4 + Math.random() * 3; // Add 4-7 minute spike
    } else if (i === 30) {
      value += 6 + Math.random() * 4; // Add 6-10 minute spike
    } else if (i === 45) {
      value += 3 + Math.random() * 2; // Add 3-5 minute spike
    } 
    // Medium spikes every 10 minutes
    else if (i % 10 === 0) {
      value += 1.5 + Math.random() * 2; // Add 1.5-3.5 minute spike
    }
    // Small spikes more frequently
    else if (i % 5 === 0) {
      value += 0.5 + Math.random() * 1.0; // Add 0.5-1.5 minute spike
    }
    
    // Ensure value is positive and has some minimum
    return Math.max(0.2, value);
  });
  
  // Determine status based on max lag
  const maxLag = Math.max(...values);
  const status = maxLag > 3 ? 'delayed' : 'on_time';
  const message = status === 'on_time' 
    ? 'Scheduler is running on time' 
    : `Scheduler is experiencing delays (max lag: ${maxLag.toFixed(1)} minutes)`;
  
  console.log('Generated mock scheduler lag data:', {
    status,
    message,
    dataPoints: values.length,
    maxLag
  });
  
  return {
    status,
    message,
    data: [
      [
        'scheduler_lag',
        timestamps.map((timestamp, i) => [timestamp, values[i]])
      ]
    ]
  };
}; 