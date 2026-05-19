import { useEffect, useState } from "react";

export default function ChatbotSwitcher() {
  const [chat, setChat] = useState(() => localStorage.getItem("chat") || "off");

  useEffect(() => {
    console.log("Test chat : " + chat);
    document.documentElement.setAttribute("chat", chat);
    localStorage.setItem("chat", chat);
  }, [chat]);

  const togglechat = () => setChat(chat === "on" ? "off" : "on");

  return (
    <button onClick={togglechat} id="chatSwitcher">
      {chat === "on" ? "❌" : "💬"}
    </button>
  );
}
