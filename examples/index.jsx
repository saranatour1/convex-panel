import React from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexPanel } from 'convex-panel';

// Initialize the Convex client
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

function App() {
  return (
    <ConvexProvider client={convex}>
      <div>
        <h1>My Convex App</h1>
        {/* Your app content here */}
      </div>
      
      {/* Add the ConvexPanel component */}
      <ConvexPanel 
        convex={convex} 
        deployKey={process.env.CONVEX_DEPLOY_KEY} 
        deployUrl={process.env.NEXT_PUBLIC_CONVEX_URL} // Optional
      />
    </ConvexProvider>
  );
}

export default App; 