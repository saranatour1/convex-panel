export const EmptyState = ({ 
  /** Message to display when the table is empty. */
  message,
}: { 
  message: string
}) => (
  <div className="convex-panel-empty-logs">
    <div className="convex-panel-empty-message">
      <p>{message}</p>
    </div>
  </div>
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;