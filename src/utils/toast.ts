type ToastType = "success" | "error" | "info" | "warning";

/**
 * Display a toast notification
 * @param type The type of toast (success, error, info, warning)
 * @param message The message to display
 */
export const toast = (type: ToastType, message: string) => {
  // For now, just console.log the message
  // You can replace this with your preferred toast library implementation
  console.log(`[${type.toUpperCase()}] ${message}`);
}; 