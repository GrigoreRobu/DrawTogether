import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

const HUB_URL = import.meta.env.VITE_HUB_URL;
const USER_URL = import.meta.env.VITE_USER_API_URL;

export default function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const connectionRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const pendingCanvasRef = useRef(null);

  const [status, setStatus] = useState("Connecting...");
  const [usersCount, setUsersCount] = useState(0);
  const [color, setColor] = useState("#000000");
  const [width, setWidth] = useState(3);
  const [eraser, setEraser] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      const response = await fetch(USER_URL);
      const count = await response.json();
      setUsersCount(count);
    };

    fetchCount();
  }, []);

  const handleConnect = async () => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { withCredentials: true })
      .withAutomaticReconnect()
      .build();

    connection.on("Joined", (count) => {
      setStatus("Connected");
      setUsersCount(count);
    });

    connection.on("UserJoined", (count) => {
      setUsersCount(count);
    });

    connection.on("UserLeft", (count) => {
      setUsersCount(count);
    });
    connection.on("RecieveCanvas", (imageData) => {
      pendingCanvasRef.current = imageData;
    });

    connection.on("RoomFull", () => {
      setStatus("Room is full max 4 users.");
    });

    connection.on("ReceiveDraw", (x0, y0, x1, y1, color, width) => {
      drawLine(x0, y0, x1, y1, color, width, false);
    });
    connection.on("RecieveErase", (x0, y0, x1, y1, color, width) => {
      drawLine(x0, y0, x1, y1, "#ffffff", width, false);
    });

    connection.on("ClearCanvas", () => {
      clearCanvas();
    });

    connection
      .start()
      .then(() => {
        setStatus("Connected");
        setIsConnected(true);
      })
      .catch((err) => {
        console.error(err);
        setStatus("Error connecting");
      });

    connectionRef.current = connection;
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.7;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctxRef.current=ctx;
    const img = new Image();
    if(pendingCanvasRef.current!=null){img.src = pendingCanvasRef.current;}
    img.onload = () => ctx.drawImage(img, 0, 0);
  }, [isConnected]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e) => {
    if (status !== "Connected") return;
    drawingRef.current = true;
    lastPosRef.current = getPos(e);
  };

  const handleMouseMove = (e) => {
    if (!drawingRef.current) return;
    const newPos = getPos(e);
    drawLine(
      lastPosRef.current.x,
      lastPosRef.current.y,
      newPos.x,
      newPos.y,
      color,
      width,
      true,
    );
    lastPosRef.current = newPos;
  };

  const handleMouseUp = () => {
    connectionRef.current
      .invoke("SaveCanvas", canvasRef.current.toDataURL("image/png"))
      .catch(console.error);
    drawingRef.current = false;
  };

  const drawLine = (x0, y0, x1, y1, color, width, send) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    eraser ? (ctx.strokeStyle = "#ffffff") : (ctx.strokeStyle = color);
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();

    if (send && connectionRef.current && eraser) {
      connectionRef.current
        .invoke("EraseDrawing", x0, y0, x1, y1, "#ffffff", width)
        .catch((err) => console.error(err));
    } else if (send && connectionRef.current) {
      connectionRef.current
        .invoke("SendDraw", x0, y0, x1, y1, color, width)
        .catch((err) => console.error(err));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClearClick = () => {
    clearCanvas();
    if (connectionRef.current) {
      connectionRef.current.invoke("ClearCanvas").catch(console.error);
    }
  };

  return (
    <div>
      {isConnected ? (
        <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
          <h1>Realtime Drawing (max 3 users)</h1>
          <p>Status: {status}</p>
          <p>Users connected: {usersCount}</p>

          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Color:{" "}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </label>
            <label style={{ marginLeft: "1rem" }}>
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
              onClick={(e) => {
                setEraser(!eraser);
              }}
              style={{ marginLeft: "1rem", padding: "0.3rem 0.8rem" }}
            >
              Eraser
            </button>
            <button
              onClick={handleClearClick}
              style={{ marginLeft: "1rem", padding: "0.3rem 0.8rem" }}
            >
              Clear
            </button>
          </div>

          <canvas
            ref={canvasRef}
            style={{ border: "1px solid #ccc", cursor: "crosshair" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              e.preventDefault();
              handleMouseDown(e);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              handleMouseMove(e);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleMouseUp(e);
            }}
          />
        </div>
      ) : (
        <div>
          <h1>Wanna connect? {usersCount} user(s) online.</h1>
          <button variant="text" onClick={(e) => handleConnect()}>
            Connect
          </button>
        </div>
      )}
    </div>
  );
}
