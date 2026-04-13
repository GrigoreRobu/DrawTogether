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
    <div>
      <div>
        <h1>Wanna connect? {usersCount} user(s) online.</h1>
        <h1>{status}</h1>
        <input
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
          variant="text"
          onClick={() => {
            handleRoomCreation();
          }}
        >
          Create
        </button>
      </div>
    </div>
  );
}
