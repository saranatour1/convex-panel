# Convex Panel

A development panel for Convex applications that provides real-time logs, data inspection, and more.

## Installation

```bash
npm install convex-panel
# or
yarn add convex-panel
# or
pnpm add convex-panel
```

## Usage

There are two ways to use the Convex Panel in your application:

### Option 1: Using the API Route (Recommended)

1. Create an API route in your application to provide the Convex access token:

```typescript
// app/api/convex-token/route.ts (Next.js App Router)
import { NextResponse } from 'next/server';
import { getConvexToken } from 'convex-panel/utils/getConvexToken';

export async function GET() {
  try {
    const accessToken = await getConvexToken();
    
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

2. Import and use the Convex Panel in your application:

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
| `theme` | ThemeClasses (optional) | Custom theme options |
| `initialLimit` | number (optional) | Initial log limit (default: 100) |
| `initialShowSuccess` | boolean (optional) | Initially show success logs (default: true) |
| `initialLogType` | LogType (optional) | Initial log type filter (default: ALL) |
| `maxStoredLogs` | number (optional) | Maximum number of logs to store (default: 500) |

## Development

To contribute to this package:

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## License

MIT 