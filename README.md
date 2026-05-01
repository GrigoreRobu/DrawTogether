# DrawTogether

A real-time collaborative drawing app where users can draw together on a shared canvas simultaneously.

🔗 **Live demo:** [drawtogether-b1988.web.app](https://drawtogether-b1988.web.app)

## Features

- Real-time canvas synchronization across connected users
- Real-time chat between users of the same room
- Drawing tools: pen, color picker, adjustable brush size
- Clear canvas (synced for all users)
- Download your drawing as an image

## Tech Stack

**Frontend**
- React
- Firebase Hosting

**Backend**
- ASP.NET Core (C#)
- SignalR for real-time WebSocket communication
- REST API endpoints
- Deployed on Render

## How it works

When a user draws on the canvas, the stroke data is sent to the SignalR hub on the backend, which immediately broadcasts it to all other connected clients. Each client applies the incoming strokes to their local canvas, keeping everyone in sync in real time. Alo has a live chat.

## Running locally

### Backend
```bash
cd realtimedrawBE
dotnet restore
dotnet run
```

### Frontend
```bash
cd realtimedrawFE
npm install
npm start
```

The frontend expects the backend running at `localhost` — check the SignalR hub URL in the frontend config if you need to change the port.
