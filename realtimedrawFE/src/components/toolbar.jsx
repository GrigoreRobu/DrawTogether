import React from "react";
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
      <label>
        Color:{" "}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </label>
      <label>
        Width:{" "}
        <input
          type="range"
          min="1"
          max="15"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
        />
        <span style={{ marginLeft: "0.5rem" }}>{width}</span>
      </label>
      <button
        onClick={() => {
          setEraser(!eraser);
        }}
      >
        Eraser
      </button>
      <button onClick={handleClearClick}>Clear</button>
      <button onClick={handleUndo}>Undo</button>
      <button onClick={handleDownload}>Download</button>
    </div>
  );
}
