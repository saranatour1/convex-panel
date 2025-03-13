export const LiveIndicator = () => (
  <div className="convex-panel-live-indicator">
    <svg className="convex-panel-live-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
    Live
  </div>
);

LiveIndicator.displayName = 'LiveIndicator';

export default LiveIndicator;