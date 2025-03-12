const HealthContainer = () => {
  return (
    <div 
      className="convex-panel-settings-health-placeholder"
      style={{
        height: "100%",
        fontFamily: "ui-monospace, Menlo, Monaco, Cascadia Mono, Segoe UI Mono, Roboto Mono, Oxygen Mono, Ubuntu Mono, Source Code Pro, Fira Mono, Droid Sans Mono, Consolas, Courier New, monospace",
        MozTabSize: 4,
        OTabSize: 4,
        tabSize: 4,
        whiteSpace: "break-spaces", 
        wordBreak: "break-word",
        overflowWrap: "anywhere",
        flexGrow: 2,
        backgroundColor: "#1e1c1a",
        cursor: "not-allowed",
        backgroundImage: "linear-gradient(-45deg, rgba(204, 204, 204, .1) 12.5%, #0000 0, #0000 50%, rgba(204, 204, 204, .1) 0, rgba(204, 204, 204, .1) 62.5%, #0000 0, #0000)",
        backgroundSize: "12px 12px"
      }}
    >
      <h3 className="convex-panel-settings-health-text">
        Health checks coming soon
      </h3>
    </div>
    )
};

export default HealthContainer;