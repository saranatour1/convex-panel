# Convex Panel

A React component for monitoring and debugging Convex applications.

## Installation

```bash
npm install convex-panel
# or
yarn add convex-panel
```

## Usage

```jsx
import { ConvexPanel } from 'convex-panel';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

// Initialize the Convex client
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

function App() {
  return (
    <ConvexProvider client={convex}>
      <YourApp />
      <ConvexPanel 
        convex={convex} 
        DEPLOY_KEY={process.env.CONVEX_DEPLOY_KEY} 
      />
    </ConvexProvider>
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| convex | ConvexReactClient | Yes | - | The Convex React client instance |
| DEPLOY_KEY | string | Yes | - | Your Convex deployment key |
| CLOUD_URL | string | No | - | Your Convex cloud URL (defaults to NEXT_PUBLIC_CONVEX_URL) |
| initialLimit | number | No | 100 | Initial number of logs to fetch |
| initialShowSuccess | boolean | No | true | Whether to show success logs initially |
| initialLogType | LogType | No | LogType.ALL | Initial log type filter |
| onLogFetch | function | No | - | Callback when logs are fetched |
| onError | function | No | - | Callback when an error occurs |
| onToggle | function | No | - | Callback when the panel is toggled |
| theme | ThemeClasses | No | {} | Custom theme classes |
| buttonIcon | string | No | "/convex.png" | Custom button icon |
| maxStoredLogs | number | No | 500 | Maximum number of logs to store in memory |

## Features

- Real-time log monitoring
- Database table explorer
- System health monitoring
- Customizable theme
- Draggable and resizable panel
- Filter logs by type and status
- Search logs by request ID

## License

MIT 