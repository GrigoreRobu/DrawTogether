import React, { useEffect, useState } from "react";
import { ROOM_URL } from "../constants";

export default function Rooms({ handleConnect, username }) {
  const [data, setData] = useState({ rooms: [], connections: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(ROOM_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!mounted) return;
        setData({
          rooms: Array.isArray(json.rooms) ? json.rooms : [],
          connections: Array.isArray(json.connections) ? json.connections : []
        });
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="rooms-state">Loading rooms...</div>;
  if (error) return <div className="rooms-state rooms-error">Error: {error}</div>;

  return (
    <div className="rooms-wrap">
      <h3 className="rooms-title">Open Rooms</h3>
      <ul className="rooms-list">
        {data.rooms.map((room) => (
          <li key={room} className="room-item">
            <div className="room-id">{room}</div>
            <div className="room-count">
              {data.connections.filter(r => r === room).length}
            </div>
            <button className="join-btn" onClick={() => handleConnect(room, username)}>Join</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
