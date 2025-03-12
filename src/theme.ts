import { ThemeClasses } from "./types";

// Default theme (dark)
export const defaultTheme: ThemeClasses = {
  container: "convex-panel-container-theme",
  header: "convex-panel-header-theme",
  toolbar: "convex-panel-toolbar-theme",
  table: "convex-panel-table-theme",
  tableHeader: "convex-panel-table-header-theme",
  tableRow: "convex-panel-table-row-theme",
  text: "convex-panel-text-theme",
  button: "convex-panel-button-theme",
  input: "convex-panel-input-theme",
  successText: "convex-panel-success-text-theme",
  errorText: "convex-panel-error-text-theme",
  warningText: "convex-panel-warning-text-theme"
};

// Animation variants for the card
export const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.2,
      ease: "easeOut"
    } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { 
      duration: 0.1,
      ease: "easeIn"
    } 
  }
};

// Animation variants for the button
export const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.1 },
  tap: { scale: 0.95 }
};

export const detailPanelVariants = {
  hidden: { opacity: 0, x: 20, width: 0 },
  visible: { opacity: 1, x: 0, width: '50%', transition: { duration: 0.3, ease: 'easeOut' } }
};