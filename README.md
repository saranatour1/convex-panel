# Convex Panel

![NPM Version](https://img.shields.io/npm/v/convex-panel)

A development panel for Convex applications that provides real-time logs, data inspection, and more.

![Convex Panel Data View](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2Flogs.png?alt=media&token=dd4bdff9-1e9a-41cc-a1da-aaae0f148517)

## Performance Monitoring

Monitor your function performance with detailed metrics and visualizations:

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0;">
  <img src="https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2Flogs-details.png?alt=media&token=4f286cc1-0cfb-4e95-ad63-11b2b1d82c87" alt="Function Invocation Rate" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  <img src="https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2Fhealth.png?alt=media&token=4d237dd8-65ab-44d3-ad47-09e7c765d16e" alt="Error Rate Monitoring" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  <img src="https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2Fdata.png?alt=media&token=805a79b4-f2aa-44d5-a076-5423d79a0705" alt="Execution Time Analysis" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  <img src="https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2Fdata-edit.png?alt=media&token=b2e7e686-7815-4f15-9265-b997adb7fe30" alt="Cache Hit Rate" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  <img src="https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2Ffunctions.png?alt=media&token=648a3a5f-154b-4435-8c52-7040f84f03dc" alt="Memory Usage" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
  <img src="https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2Ffunctions-code.png?alt=media&token=b632836c-66ee-4152-b505-d4a27219aeb5" alt="System Latency" style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
</div>



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

![Convex Panel Logs View](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2Fconvex-panel2.png?alt=media&token=685faba4-d9f8-4ca7-8112-2825cf3040ec)

## Installation

```bash
bun add convex-panel
# or
npm install convex-panel
# or
yarn add convex-panel
# or
pnpm add convex-panel
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


Make sure to set these environment variables in your `.env.local`:
```bash
NEXT_PUBLIC_CONVEX_URL="your_convex_url"
NEXT_PUBLIC_ACCESS_TOKEN="your_access_token"
NEXT_PUBLIC_DEPLOY_KEY="your_deploy_key"
```

To get your access token you can run

```bash
cat ~/.convex/config.json
# or
more %USERPROFILE%\.convex\config.json
```

> **Warning**: This component must be placed inside a `ConvexProvider` or `ConvexReactProvider` component.

### React Setup (Alternative)

For non-Next.js React applications, you can use the panel directly:

```tsx
import { ConvexPanel } from 'convex-panel';
import { ConvexReactClient } from "convex/react";

export default function YourComponent() {
  const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

  return (
    <>
      {/* Your app content */}
      <ConvexPanel
        accessToken="YOUR_ACCESS_TOKEN"
        deployUrl={process.env.CONVEX_DEPLOYMENT}
        convex={convex}
      />
    </>
  );
}
```

## Configuration

The Convex Panel accepts the following props:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `accessToken` | string | Yes | Your Convex access token (from `convex config`) |
| `deployKey` | string | No | Your Convex deployment key for admin-level access |
| `deployUrl` | string | No | Your Convex deployment URL (or use NEXT_PUBLIC_CONVEX_URL env var) |
| `convex` | ConvexReactClient | Yes | Convex client instance |
| `theme` | ThemeClasses | No | Custom theme options |
| `initialLimit` | number | No | Initial log limit (default: 100) |
| `initialShowSuccess` | boolean | No | Initially show success logs (default: true) |
| `initialLogType` | LogType | No | Initial log type filter (default: ALL) |
| `maxStoredLogs` | number | No | Maximum number of logs to store (default: 500) |
| `onLogFetch` | (logs: LogEntry[]) => void | No | Callback function when logs are fetched |
| `onError` | (error: string) => void | No | Callback function when an error occurs |
| `buttonPosition` | 'bottom-left' \| 'bottom-center' \| 'bottom-right' \| 'right-center' \| 'top-right' | No | Position of the ConvexPanel button (default: 'bottom-right') |
| `useMockData` | boolean | No | Whether to use mock data instead of real API data (default: false) |

## Features Documentation

### Health Monitoring

The health dashboard provides real-time insights into your Convex application's performance metrics:

- **Cache Rates**: Monitor your application's cache hit rates and efficiency
- **Scheduler Health**: Track the health and performance of your scheduled functions
- **Database Metrics**: View database throughput, operation counts, and response times
- **System Latency**: Visualize overall system response times and identify bottlenecks

### Data Editing

Convex Panel now supports in-place editing of table data:

- **Double-click Editing**: Simply double-click on any editable cell to modify its value
- **Smart Value Parsing**: Automatically converts edited values to the appropriate type (number, boolean, array, object)
- **Real-time Updates**: Changes are immediately reflected in your Convex database

## Troubleshooting

### Common Errors

1. **"Convex authentication required"**:
   - Make sure you've provided a valid access token via the `accessToken` prop
   - Get your access token by running `cat ~/.convex/config.json` or `more %USERPROFILE%\.convex\config.json`

2. **No logs appearing**:
   - Verify that your `deployKey` prop or `CONVEX_DEPLOYMENT` environment variable is correctly set
   - Check that you've passed the `convex` prop to the ConvexPanel component
   - Verify that your access token is valid

3. **Build warnings about "use client" directive**:
   - If you see warnings like `Module level directives cause errors when bundled, "use client" in "src/data/components/FilterMenu.tsx" was ignored`, this is expected and won't affect functionality. The package is designed to work in both client and server environments.

## Development

To contribute to this package:

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Publishing Updates

To publish a new version of the package:

1. Update the version in `package.json`
2. Run `npm run build` to build the package
3. Commit your changes and push to GitHub
4. Run `npm publish` to publish to npm

## License

MIT 