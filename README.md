# Convex Panel

![NPM Version](https://img.shields.io/npm/v/convex-panel)

A development panel for Convex applications that provides real-time logs, data inspection, and more.

![Convex Panel Data View](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2Flogs.png?alt=media&token=dd4bdff9-1e9a-41cc-a1da-aaae0f148517)

## Features

- 📊 **Real-time Data View**: Browse and filter your Convex tables with ease
- 📝 **Live Logs**: Monitor function calls, HTTP actions, and system events in real-time
- 🔍 **Advanced Filtering**: Filter logs and data with query capabilities
- 🔄 **Health Monitoring**: Track the health of your application with metrics for cache rates, scheduler health, database performance, and system latency
- 📊 **Function Performance Monitoring**: Track invocation rates, error rates, execution times, and cache hit rates for your functions
- 🔍 **Function Code Inspection**: View and analyze your function source code with syntax highlighting
- 📈 **Performance Metrics Visualization**: See your function performance data with interactive charts and graphs
- 🧪 **Function Testing**: Execute functions directly from the panel with custom inputs and view results
- ✏️ **In-place Data Editing**: Directly edit your data values with double-click editing capability
- 🎨 **Beautiful UI**: Sleek, developer-friendly interface that integrates with your app
- 🔐 **Automatic Token Setup**: Automatically configures your Convex access token during installation
- 💾 **State Persistence**: Automatically saves panel position, size, and preferences

![Convex Panel Logs View](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2F683_1x_shots_so.png?alt=media&token=55f531d4-4fc9-4bc3-af9f-b1d4e01487dd)

## Installation

```bash
bun add convex-panel --dev
# or
npm install convex-panel --save-dev
# or
yarn add convex-panel --dev
# or
pnpm add convex-panel --save-dev
```

During installation, the package will automatically:
1. Check if you're logged in to Convex
2. If not logged in, prompt you to run `npx convex login`
3. Once logged in, detect your Convex access token from `~/.convex/config.json` (or `%USERPROFILE%\.convex\config.json` on Windows)
4. Add it to your project's `.env` file as `CONVEX_ACCESS_TOKEN`

The package will guide you through the login process if needed. You can also manually log in at any time by running:
```bash
npx convex login
```

## Environment Setup

Create a `.env.local` file in your project root with the following variables:

```bash
# Nextjs
NEXT_PUBLIC_CONVEX_URL="your_convex_url"
NEXT_PUBLIC_ACCESS_TOKEN="your_access_token"
NEXT_PUBLIC_DEPLOY_KEY="your_deploy_key"

# React
REACT_APP_CONVEX_URL="your_convex_url"
REACT_APP_ACCESS_TOKEN="your_access_token"
REACT_APP_DEPLOY_KEY="your_deploy_key"
```

To get your access token, run:
```bash
cat ~/.convex/config.json  # On Unix-based systems
# or
more %USERPROFILE%\.convex\config.json  # On Windows
```

## Usage

### Next.js Setup (Recommended)

Create a provider component in your app (e.g., `app/providers.tsx`):

```tsx
"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ReactNode } from "react";
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

import type ConvexPanelType from "convex-panel";

// Use dynamic import to avoid SSR issues
const ConvexPanel = dynamic<ComponentProps<typeof ConvexPanelType>>(() => import("convex-panel"), {
  ssr: false
});

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL! as string);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
      <ConvexPanel
        accessToken={process.env.NEXT_PUBLIC_ACCESS_TOKEN!}
        deployKey={process.env.NEXT_PUBLIC_DEPLOY_KEY!}
      />
    </ConvexAuthNextjsProvider>
  )
}
```

### React Setup (Alternative)

For non-Next.js React applications:

```tsx
import { ConvexPanel } from 'convex-panel';
import { ConvexReactClient } from "convex/react";

export default function YourComponent() {
  const convex = new ConvexReactClient(process.env.REACT_APP_CONVEX_URL);

  return (
    <>
      {/* Your app content */}
      <ConvexPanel
        accessToken={REACT_APP_ACCESS_TOKEN}
        deployUrl={process.env.REACT_APP_CONVEX_DEPLOYMENT}
      />
    </>
  );
}
```

## Configuration

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `deployKey` | string | undefined | Convex deployment key for admin-level access. Enables additional admin capabilities. |
| `accessToken` | string | Your Convex access token (from `~/.convex/config.json`). Required for API access. |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `convex` | ConvexReactClient | Initialized Convex client instance for API communication. |
| `deployUrl` | string | process.env.NEXT_PUBLIC_CONVEX_URL | Your Convex deployment URL. |
| `theme` | ThemeClasses | {} | Custom theme options (see Theme Customization below). |
| `initialLimit` | number | 100 | Initial number of logs to fetch and display. |
| `initialShowSuccess` | boolean | true | Whether to show success logs in the initial view. |
| `initialLogType` | LogType | 'ALL' | Initial log type filter. Options: 'ALL', 'SUCCESS', 'FAILURE', 'DEBUG', 'LOGINFO', 'WARNING', 'ERROR', 'HTTP' |
| `maxStoredLogs` | number | 500 | Maximum number of logs to store in memory. |
| `onLogFetch` | (logs: LogEntry[]) => void | undefined | Callback when logs are fetched. |
| `onError` | (error: string) => void | undefined | Callback when an error occurs. |
| `buttonPosition` | ButtonPosition | 'bottom-right' | Position of the panel button. Options: 'bottom-left', 'bottom-center', 'bottom-right', 'right-center', 'top-right' |
| `useMockData` | boolean | false | Use mock data instead of real API data. |

### Theme Customization

The `theme` prop accepts a `ThemeClasses` object with the following structure:

```typescript
interface ThemeClasses {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    // ... other color options
  };
  spacing?: {
    padding?: string;
    margin?: string;
    // ... other spacing options
  };
  components?: {
    button?: {
      backgroundColor?: string;
      color?: string;
      // ... other button styles
    };
    // ... other component styles
  };
}
```

Example theme usage:

```tsx
<ConvexPanel
  theme={{
    colors: {
      primary: '#6366f1',
      background: '#1f2937'
    },
    components: {
      button: {
        backgroundColor: '#4f46e5'
      }
    }
  }}
  // ... other props
/>
```

### State Persistence

The panel automatically persists several settings in localStorage:
- Panel position on screen
- Panel size (width/height)
- Active tab selection
- Log filter preferences
- Table view configurations

These settings are restored when the panel is reopened.

## Features Documentation

### Health Monitoring

The health dashboard provides real-time insights into your Convex application's performance metrics:

- **Cache Rates**: Monitor your application's cache hit rates and efficiency
- **Scheduler Health**: Track the health and performance of your scheduled functions
- **Database Metrics**: View database throughput, operation counts, and response times
- **System Latency**: Visualize overall system response times and identify bottlenecks

### Data Editing

The panel supports in-place editing of table data:

- **Double-click Editing**: Simply double-click on any editable cell to modify its value
- **Smart Value Parsing**: Automatically converts edited values to the appropriate type (number, boolean, array, object)
- **Real-time Updates**: Changes are immediately reflected in your Convex database
- **Validation**: Basic type checking and format validation for edited values

### Log Management

Advanced log filtering and management capabilities:

- **Type Filtering**: Filter by log types (SUCCESS, FAILURE, DEBUG, etc.)
- **Search**: Full-text search across log messages
- **Time Range**: Filter logs by time period
- **Export**: Download logs in JSON format
- **Auto-refresh**: Real-time log updates
- **Memory Management**: Automatic cleanup of old logs based on `maxStoredLogs`

## Troubleshooting

### Common Errors

1. **"Convex authentication required"**:
   - Ensure valid `accessToken` is provided
   - Check `.env.local` file configuration
   - Verify Convex login status

2. **No logs appearing**:
   - Verify `deployKey` and `CONVEX_DEPLOYMENT` settings
   - Check `convex` prop initialization
   - Confirm access token validity
   - Check network connectivity

3. **Build warnings about "use client" directive**:
   - Expected behavior for client components
   - Won't affect functionality
   - Use dynamic import as shown in setup examples

4. **Panel not appearing**:
   - Ensure component is mounted inside ConvexProvider
   - Check z-index conflicts
   - Verify styles are properly injected

### Performance Optimization

- Adjust `initialLimit` based on your needs
- Set appropriate `maxStoredLogs` to prevent memory issues
- Use `useMockData` for development/testing
- Consider lazy loading for large datasets

## Development

To contribute to this package:

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Run tests: `npm test`

### Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "feature-name"

# Run tests in watch mode
npm test -- --watch
```

## Publishing Updates

To publish a new version:

1. Update version in `package.json`
2. Run tests: `npm test`
3. Build the package: `npm run build`
4. Commit changes
5. Create a git tag: `git tag v1.x.x`
6. Push changes and tags: `git push && git push --tags`
7. Publish: `npm publish`

## License

MIT

## Using with Vite

If you're using Vite, you'll need to configure it to properly handle Monaco Editor. The package provides a pre-configured Vite configuration that you can extend:

1. First, install the required Vite plugin:
```bash
npm install vite-plugin-monaco-editor --save-dev
```

2. In your `vite.config.js`, import and use the provided configuration:
```javascript
import { defineConfig } from 'vite';
import convexPanelViteConfig from 'convex-panel/vite';

export default defineConfig({
  ...convexPanelViteConfig,
  // Your other Vite configurations...
});
```

This will set up the necessary Monaco Editor configuration for Vite. 