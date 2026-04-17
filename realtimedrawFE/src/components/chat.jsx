export default function Chat({
  messages,
  messageInput,
  setMessageInput,
  handleSendMessage,
}) {
  return (
    <section className="chat-panel" aria-label="Room chat">
      <div className="chat-header">Chat</div>

      <div className="chat-history">
        {messages.length === 0 ? (
          <p className="chat-empty">No messages yet.</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="chat-message">
              <strong className="chat-sender">{msg.sender}:</strong>
              <span className="chat-text">{msg.message}</span>
            </div>
          ))
        )}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          placeholder="Type a message"
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </section>
  );
}
