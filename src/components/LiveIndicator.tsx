import { LiveIndicatorIcon } from "./icons";

export const LiveIndicator = () => (
  <div className="convex-panel-live-indicator">
    <LiveIndicatorIcon />
    Live
  </div>
);

LiveIndicator.displayName = 'LiveIndicator';

export default LiveIndicator;