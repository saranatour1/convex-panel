# Convex Panel

A development panel for Convex applications that provides real-time logs, data inspection, and more.

![Convex Panel Data View](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2Fconvex-panel1.png?alt=media&token=d4b6da5e-db91-4b94-9d7a-a716ebebdedf)

## Features

- 📊 **Real-time Data View**: Browse and filter your Convex tables with ease
- 📝 **Live Logs**: Monitor function calls, HTTP actions, and system events in real-time
- 🔍 **Advanced Filtering**: Filter logs and data with query capabilities
- 🔄 **Health Monitoring**: Track the health of your application and see your cache rates, schedulers are more.
- 🎨 **Beautiful UI**: Sleek, developer-friendly interface that integrates with your app

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

## Usage

### Setting Up the Panel

There are two ways to use the Convex Panel in your application:

### Option 1: Using the API Route (Recommended)

1. **Create an API route in your application to provide the Convex access token:**

   This step is **required** for the panel to work properly. You need to create an API endpoint that reads your Convex access token from your local configuration.

   For **Next.js App Router**, create a file at `app/api/convex-token/route.ts`:

```typescript
// app/api/convex-token/route.ts (Next.js App Router)
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

async function getAccessToken() {
  const homeDir = os.homedir();
  const filePath = path.join(homeDir, ".convex", "config.json");

  try {
    const data = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(data);

    if (typeof json !== "object" || json === null) {
      throw new Error("Invalid JSON format");
    }
    if (!("accessToken" in json) || typeof json.accessToken !== "string") {
      throw new Error("Missing or invalid accessToken");
    }
    return json.accessToken;
  } catch (error) {
    console.error("Error reading access token:", error);
    return null;
  }
}

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Convex authentication required. Run npx convex login in your terminal.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to get access token' },
      { status: 500 }
    );
  }
}
```

   For **Next.js Pages Router**, create a file at `pages/api/convex-token.ts` with similar content, adjusting the imports and exports as needed.

   > **Important**: If this API route is not properly set up, you may encounter errors like `GET http://localhost:3000/api/convex-token 404 (Not Found)` or `Received Invalid JSON on websocket: missing field 'value'`.

**This component or button must be inside of a `ConvexReactProvider`**

```tsx
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ConvexPanel } from 'convex-panel';
import { useConvex } from 'convex/react';
import { ConvexProvider } from "@convex-dev/react-convex";

export default function YourComponent({ children: ReactNode }) {
  const convex = useConvex();

  return (
    <ConvexProvider>    
      {children}  
      <ConvexPanel
        deployUrl={process.env.CONVEX_DEPLOYMENT}
        convex={convex}
      />
    </ConvexProvider>
  );
}
```

## Configuration

The Convex Panel accepts the following props:

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | boolean | Whether the panel is open |
| `toggleOpen` | () => void | Function to toggle the panel open/closed |
| `position` | { x: number, y: number } | Position of the panel |
| `setPosition` | (pos) => void | Function to update the panel position |
| `containerSize` | { width: number, height: number } | Size of the panel |
| `setContainerSize` | (size) => void | Function to update the panel size |
| `convex` | ConvexReactClient | Convex client instance |
| `cloudUrl` | string (optional) | Convex cloud URL (if not using environment variable) |
| `deployKey` | string (optional) | Convex deploy key (for admin features) |
| `theme` | ThemeClasses (optional) | Custom theme options |
| `initialLimit` | number (optional) | Initial log limit (default: 100) |
| `initialShowSuccess` | boolean (optional) | Initially show success logs (default: true) |
| `initialLogType` | LogType (optional) | Initial log type filter (default: ALL) |
| `maxStoredLogs` | number (optional) | Maximum number of logs to store (default: 500) |

## Troubleshooting

### Common Errors

1. **"Received Invalid JSON on websocket: missing field 'value'"** or **"GET http://localhost:3000/api/convex-token 404 (Not Found)"**:
   - Make sure you've created the `/api/convex-token` endpoint as described above.
   - Ensure you're logged in to Convex by running `npx convex login` in your terminal.

2. **No logs appearing**:
   - Verify that your `NEXT_PUBLIC_CONVEX_URL` environment variable is correctly set.
   - Check that you've passed the `convex` prop to the ConvexPanel component.

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