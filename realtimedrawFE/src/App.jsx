import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

const HUB_URL = import.meta.env.VITE_HUB_URL;
const USER_URL = import.meta.env.VITE_USER_API_URL;

export default function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const strokeChangedRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const connectionRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const pendingCanvasRef = useRef(null);
  const isConnectingRef = useRef(false);
  const [username, setUsername] = useState("");

  const [status, setStatus] = useState("Connecting...");
  const [usersCount, setUsersCount] = useState(0);
  const [color, setColor] = useState("#000000");
  const [width, setWidth] = useState(3);
  const [eraser, setEraser] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    const fetchCount = async () => {
      const response = await fetch(USER_URL);
      const count = await response.json();
      setUsersCount(count);
    };

    fetchCount();
  }, []);

  const handleConnect = async () => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;
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
    connection.on("ReceiveCanvas", (imageData) => {
      if (ctxRef.current) {
        if (!imageData) {
          clearCanvas();
        } else {
          const img = new Image();
          img.src = imageData;
          img.onload = () => {
            clearCanvas();
            ctxRef.current.drawImage(img, 0, 0);
          };
        }
      } else {
        pendingCanvasRef.current = imageData;
      }
    });

    connection.on("RoomFull", () => {
      setStatus("Room is full max 4 users.");
    });

    connection.on("ReceiveDraw", (x0, y0, x1, y1, color, width, isEraser) => {
      drawLine(x0, y0, x1, y1, color, width, false, isEraser);
    });

    connection.on("ClearCanvas", () => {
      clearCanvas();
    });
    connection.on("ReceiveMessage", (sender, message) => {
      setMessages((messages) => [...messages, { sender, message }]);
    });
    connectionRef.current = connection;
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
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 1200;
    canvas.height = 800;

    if (window.innerWidth < 900) {
      const scale = window.innerWidth / 1200;
      canvas.style.transform = `scale(${scale})`;
      canvas.style.transformOrigin = "top left";
    }
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctxRef.current = ctx;
    if (pendingCanvasRef.current) {
      const img = new Image();
      img.src = pendingCanvasRef.current;
      img.onload = () => ctx.drawImage(img, 0, 0);
    }
    const prevent = (e) => e.preventDefault();

    canvas.addEventListener("touchstart", prevent, { passive: false });
    canvas.addEventListener("touchmove", prevent, { passive: false });
    canvas.addEventListener("touchend", prevent, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", prevent);
      canvas.removeEventListener("touchmove", prevent);
      canvas.removeEventListener("touchend", prevent);
    };
  }, [isConnected]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e) => {
    if (status !== "Connected") return;
    drawingRef.current = true;
    strokeChangedRef.current = false;
    lastPosRef.current = getPos(e);
  };

  const handleMouseMove = (e) => {
    if (!drawingRef.current) return;
    strokeChangedRef.current = true;
    const newPos = getPos(e);
    drawLine(
      lastPosRef.current.x,
      lastPosRef.current.y,
      newPos.x,
      newPos.y,
      color,
      width,
      true,
      eraser,
    );
    lastPosRef.current = newPos;
  };

  const handleMouseUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (!strokeChangedRef.current || !connectionRef.current) return;

    connectionRef.current
      .invoke("SaveCanvas", canvasRef.current.toDataURL("image/png"))
      .catch(console.error);
  };

  const handleUndo = () => {
    if (!connectionRef.current) return;
    connectionRef.current.invoke("RequestUndo").catch(console.error);
  };
  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };
  const handleSendMessage = () => {
    connectionRef.current
      .invoke("SendMessage", username, messageInput)
      .catch(console.error);
    setMessageInput("");
  };
  const drawLine = (x0, y0, x1, y1, color, width, send, eraser) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (eraser) {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();
    if (send && connectionRef.current) {
      connectionRef.current
        .invoke("SendDraw", x0, y0, x1, y1, color, width, eraser)
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
    <div id="container">
      {isConnected ? (
        <div id="drawing-area">
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
              onClick={(e) => {
                setEraser(!eraser);
              }}
            >
              Eraser
            </button>
            <button onClick={handleClearClick}>Clear</button>
            <button onClick={handleUndo}>Undo</button>
            <button onClick={handleDownload}>Download</button>
            <t>Users connected: {usersCount}</t>
          </div>

          <canvas
            ref={canvasRef}
            style={{
              border: "1px solid #ccc",
              cursor: "crosshair",
              touchAction: "none",
            }}
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
          <div
            className="chat-history"
            style={{
              height: "150px",
              overflowY: "scroll",
              border: "1px solid #ccc",
              padding: "10px",
              marginTop: "10px",
            }}
          >
            {messages.map((msg, index) => (
              <div key={index}>
                <strong>{msg.sender}: </strong>
                <span>{msg.message}</span>
              </div>
            ))}
            <input type="text"
             value={messageInput}
             onChange={(e) => setMessageInput(e.target.value)}
             placeholder="Enter your message"
            ></input>
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      ) : (
        <div>
          <h1>Wanna connect? {usersCount} user(s) online.</h1>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
          <button variant="text" onClick={(e) => handleConnect()}>
            Connect
          </button>
        </div>
      )}
    </div>
  );
}
