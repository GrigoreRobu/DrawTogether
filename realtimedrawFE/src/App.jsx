import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { HUB_URL, USER_URL, ROOM_URL } from "./constants";
import Lobby from "./components/lobby";
import Toolbar from "./components/toolbar";
import Chat from "./components/chat";
import Rooms from "./components/rooms.jsx";

export default function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const strokeChangedRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const connectionRef = useRef(null);
  const pendingCanvasRef = useRef(null);
  const isConnectingRef = useRef(false);

  const [status, setStatus] = useState("Connecting...");
  const [usersCount, setUsersCount] = useState(0);
  const [color, setColor] = useState("#000000");
  const [width, setWidth] = useState(3);
  const [eraser, setEraser] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [username, setUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [insertedUsername, setInsUsername] = useState(false);
  const [insertedRoomId, setInsRoomId] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      const response = await fetch(USER_URL);
      const count = await response.json();
      setUsersCount(count);
    };

    fetchCount();
  }, []);
  const handleRoomCreation = async () => {
    const response = await fetch(`${ROOM_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(roomId),
    });
    if (response.ok) {
      setStatus("Room created!");
      handleConnect();
    } else {
      const data = await response.json();
      setStatus(data.message);
      isConnectingRef.current = false;
    }
  };
  const handleConnect = async (roomOverride, usernameOverride) => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    const roomToJoin = roomOverride ?? roomId;
    const usernameToJoin = usernameOverride ?? username;

    if (!roomToJoin || !usernameToJoin) {
      setStatus("Enter username and room id");
      isConnectingRef.current = false;
      return;
    }

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
    connection.on("RoomJoined", (initialImgRef) => {
      setStatus("Connected");
      setIsConnected(true);
      pendingCanvasRef.current = initialImgRef;
    });
    connection.on("JoinRoomError", (error) => {
      setStatus(error);
      isConnectingRef.current = false;
    });
    connectionRef.current = connection;
    connection
      .start()
      .then(() => {
        connection.invoke("JoinRoom", roomToJoin, usernameToJoin);
      })
      .catch((err) => {
        console.error(err);
        setStatus("Error connecting");
        isConnectingRef.current = false;
      });
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 1200;
    canvas.height = 800;

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
          <div className="board-layout">
            <Toolbar
              color={color}
              setColor={setColor}
              width={width}
              setWidth={setWidth}
              eraser={eraser}
              setEraser={setEraser}
              handleClearClick={handleClearClick}
              handleUndo={handleUndo}
              handleDownload={handleDownload}
            />

            <div className="board-main">
              <canvas
                id="room-canvas"
                ref={canvasRef}
                style={{
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
              >
              </canvas>

              <Chat
                messages={messages}
                messageInput={messageInput}
                setMessageInput={setMessageInput}
                handleSendMessage={handleSendMessage}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="landing-shell">
          <Lobby
            usersCount={usersCount}
            status={status}
            username={username}
            setUsername={setUsername}
            setInsUsername={setInsUsername}
            insertedUsername={insertedUsername}
            roomId={roomId}
            setRoomId={setRoomId}
            setInsRoomId={setInsRoomId}
            insertedRoomId={insertedRoomId}
            handleConnect={handleConnect}
            handleRoomCreation={handleRoomCreation}
          />
          <Rooms handleConnect={handleConnect} username={username} />
        </div>
      )}
    </div>
  );
}
