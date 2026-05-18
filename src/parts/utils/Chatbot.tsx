import { useState } from "react";

type Message = {
  isFromUser: boolean; //"user"->true | "bot"->false
  text: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input) return;

    const newMessages = [...messages, { isFromUser: true, text: input }];
    setMessages(newMessages);

    const res = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    setMessages([...newMessages, { isFromUser: false, text: data.reply }]);

    setInput("");
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
      <h3>Ask me about my projects</h3>

      <div style={{ minHeight: "200px" }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.isFromUser ? "user" : "bot"}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
