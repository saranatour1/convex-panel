/**
 * Utility functions for handling images in the Convex Panel
 */

// Default Convex logo path
export const DEFAULT_CONVEX_LOGO = '/convex.png';

/**
 * Determines the correct image path to use
 * 
 * @param buttonIcon The user-provided button icon path
 * @returns The correct image path to use
 */
export function getImagePath(buttonIcon: string): string {
  // If the user provided a custom icon, use it
  if (buttonIcon !== DEFAULT_CONVEX_LOGO) {
    return buttonIcon;
  }
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Try to load the image from the public directory first
    const img = new Image();
    img.src = DEFAULT_CONVEX_LOGO;
    
    // If the image loads successfully, use it
    img.onload = () => {
      return DEFAULT_CONVEX_LOGO;
    };
    
    // If the image fails to load, use the bundled image
    img.onerror = () => {
      return '/node_modules/convex-panel/dist/assets/convex-logo.png';
    };
  }
  
  // Default to the bundled image in non-browser environments
  return '/node_modules/convex-panel/dist/assets/convex-logo.png';
} 