"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ReactNode, useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type ConvexPanelType from "convex-panel";

// Use dynamic import to avoid SSR issues
const ConvexPanel = dynamic<ComponentProps<typeof ConvexPanelType>>(() => import("convex-panel"), {
  ssr: false
});

// Initialize the Convex client
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL! as string);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render ConvexPanel on the client side
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
      {mounted && (
        <ConvexPanel
          accessToken={process.env.NEXT_PUBLIC_ACCESS_TOKEN!}
          deployKey={process.env.NEXT_PUBLIC_DEPLOY_KEY!}
          convex={convex}
          useMockData={!process.env.NEXT_PUBLIC_CONVEX_URL}
        />
      )}
    </ConvexAuthNextjsProvider>
  );
}