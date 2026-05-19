import { useState } from "react";

type Message = { isFromUser: boolean; text: string };

const API_URL =
  import.meta.env.VITE_BACKEND_URL ??
  "https://backendportfolio-ujn6.onrender.com";

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { isFromUser: true, text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { isFromUser: false, text: data.reply ?? "Error" },
      ]);
    } catch (e) {
      setMessages((m) => [...m, { isFromUser: false, text: "Network error" }]);
    }
  };

  return (
    <div className="chat-box">
      <div className="chat-box-header">
        <h3>Ask me about my projects</h3>
        <p id="close-btn">&times;</p>
      </div>
      <div className="chat-box-body" style={{ minHeight: "200px" }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong className="message">
              {msg.isFromUser ? "user" : "bot"}:
            </strong>{" "}
            {msg.text}
          </div>
        ))}
      </div>
      <div className="chat-box-footer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
        />
        <button id="sendBtn" onClick={sendMessage}>
          Send
        </button>
      </div>
      <div className="chat-button" id="chatBtn">
        💬
      </div>
    </div>
  );
}
