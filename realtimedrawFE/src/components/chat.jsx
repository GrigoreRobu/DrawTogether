export default function Chat({
  messages,
  messageInput,
  setMessageInput,
  handleSendMessage,
}) {
  return (
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
      <input
        type="text"
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSendMessage();
          }
        }}
        placeholder="Enter your message"
      ></input>
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}
