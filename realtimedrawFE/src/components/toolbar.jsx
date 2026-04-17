export default function Toolbar({
  color,
  setColor,
  width,
  setWidth,
  eraser,
  setEraser,
  handleClearClick,
  handleUndo,
  handleDownload,
}) {
  return (
    <div className="toolbar">
      <label className="tool-group">
        Color:{" "}
        <input
          className="tool-color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </label>
      <label className="tool-group tool-range-wrap">
        Width:{" "}
        <input
          className="tool-range"
          type="range"
          min="1"
          max="15"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
        />
        <span className="tool-width-value">{width}</span>
      </label>
      <button
        className="icon-btn"
        onClick={() => {
          setEraser(!eraser);
        }}
      ><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M690-240h190v80H610l80-80Zm-500 80-85-85q-23-23-23.5-57t22.5-58l440-456q23-24 56.5-24t56.5 23l199 199q23 23 23 57t-23 57L520-160H190Zm296-80 314-322-198-198-442 456 64 64h262Zm-6-240Z"/></svg>
      </button>
      <button onClick={handleClearClick}>Clear</button>
      <button onClick={handleUndo}>Undo</button>
      <button onClick={handleDownload}>Download</button>
    </div>
  );
}
