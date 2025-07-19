import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App.tsx";
import ConvexPanel from "../../src/index.ts"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
      <ConvexPanel
          accessToken={import.meta.env.VITE_ACCESS_TOKEN!}
          deployKey={import.meta.env.VITE_CONVEX_DEPLOYMENT!} // CONVEX_DEPLOYMENT
          convex={convex} 
          useMockData={!import.meta.env.VITE_CONVEX_URL}
          deployUrl={import.meta.env.VITE_CONVEX_URL}
        />
    </ConvexAuthProvider>
  </StrictMode>,
);


