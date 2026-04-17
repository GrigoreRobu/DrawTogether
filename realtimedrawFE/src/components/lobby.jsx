export default function Lobby({
  usersCount,
  status,
  username,
  setUsername,
  setInsUsername,
  insertedUsername,
  roomId,
  setRoomId,
  setInsRoomId,
  insertedRoomId,
  handleConnect,
  handleRoomCreation,
}) {
  return (
    <div className="lobby-wrap">
      <div className="lobby-card">
        <h1 className="lobby-title">DrawTogether</h1>
        <p className="lobby-subtitle">Wanna connect? {usersCount} user(s) online.</p>
        <p className="status-chip">{status}</p>
        <div className="lobby-form">
        <input
          className="lobby-input"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setInsUsername(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && insertedRoomId) handleConnect();
          }}
          placeholder="Enter your username"
        />
        <input
          className="lobby-input"
          type="text"
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            setInsRoomId(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && insertedUsername) handleConnect();
          }}
          placeholder="Enter room id"
        />
        </div>
        <div className="lobby-actions">
        <button
          variant="text"
          onClick={() => {
            if (insertedRoomId && insertedUsername) {
              handleConnect();
            }
          }}
        >
          Connect
        </button>
        <button
          className="button-muted"
          variant="text"
          onClick={() => {
            handleRoomCreation();
          }}
        >
          Create
        </button>
        </div>
      </div>
    </div>
  );
}
