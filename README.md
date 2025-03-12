# Convex Panel

A development panel for Convex applications that provides real-time logs, data inspection, and more.

![Convex Panel Data View](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2F260_1x_shots_so.png?alt=media&token=ab319476-3e64-4348-83bc-0d2ca126533e)

## Features

- 📊 **Real-time Data Inspection**: Browse and filter your Convex tables with ease
- 📝 **Live Logs**: Monitor function calls, HTTP actions, and system events in real-time
- 🔍 **Advanced Filtering**: Filter logs and data with powerful query capabilities
- 🔄 **Health Monitoring**: Track the health of your Convex deployment
- 🎨 **Beautiful UI**: Sleek, developer-friendly interface that integrates with your app

![Convex Panel Logs View](https://firebasestorage.googleapis.com/v0/b/relio-217bd.appspot.com/o/convex%2F617_1x_shots_so.png?alt=media&token=0232b53b-a618-4a35-af46-c9c6b13324e4)

## Installation

```bash
npm install convex-panel
# or
yarn add convex-panel
# or
pnpm add convex-panel
```

## Usage

### Styling

The Convex Panel comes with built-in styling. No CSS imports are required! The styles are automatically injected when the component mounts.

#### CSS Isolation

Convex Panel uses a CSS isolation mechanism to ensure its styles don't interfere with your application:

- All styles are prefixed with `convex-panel-` to avoid naming conflicts
- Styles are injected into a separate `<style>` element with a unique ID
- Most style properties use `!important` to ensure they work correctly within your app
- The panel is rendered in a portal, keeping its DOM structure separate from your app

This approach ensures that Convex Panel's styles won't affect your application's styling, and vice versa.

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

2. **Import and use the Convex Panel in your application:**

```tsx
import { useState } from 'react';
import { ConvexPanel } from 'convex-panel';
import { useConvex } from 'convex/react';

export default function YourComponent() {
  const convex = useConvex();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 1000, height: 500 });

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle Convex Panel</button>
      
      <ConvexPanel
        isOpen={isOpen}
        toggleOpen={() => setIsOpen(!isOpen)}
        position={position}
        setPosition={setPosition}
        containerSize={size}
        setContainerSize={setSize}
        convex={convex}
        // The panel will automatically fetch the token from /api/convex-token
      />
    </div>
  );
}
```

### Option 2: Providing the Access Token Directly

If you prefer not to create an API route, you can provide the access token directly:

```tsx
import { useState } from 'react';
import { ConvexPanel } from 'convex-panel';
import { useConvex } from 'convex/react';

// Get the token from your environment or another source
const CONVEX_ACCESS_TOKEN = process.env.CONVEX_ACCESS_TOKEN;

export default function YourComponent() {
  const convex = useConvex();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 1000, height: 500 });

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle Convex Panel</button>
      
      <ConvexPanel
        convex={convex}
        convexAccessToken={CONVEX_ACCESS_TOKEN}
      />
    </div>
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
| `convexAccessToken` | string (optional) | Convex access token (if not using API route) |
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

3. **Styling issues or unstyled panel**:
   - The panel includes all necessary styling automatically - no CSS imports required!
   - If you're experiencing styling issues, it might be due to conflicting styles in your application. The panel uses `!important` flags to override conflicting styles.

4. **Missing Convex logo or 400 Bad Request error**:
   - The component uses Next.js Image component to display the Convex logo
   - By default, it looks for `/convex.png` in your public directory
   - If the image is not found, a fallback Convex logo SVG will be displayed automatically
   - You can provide a custom image by passing the `buttonIcon` prop:
     ```jsx
     <ConvexPanel buttonIcon="/your-custom-logo.png" />
     ```
   - To use the default Convex logo, add it to your public directory:
     ```
     public/
       └── convex.png
     ```

## Development

To contribute to this package:

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## License

MIT 