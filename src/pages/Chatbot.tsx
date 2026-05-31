import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { API_URL } from "../Utils";

type Message = {
  isFromUser: boolean;
  text: string;
  fullText?: string;
};

const TYPING_SPEED_MS = 18;

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasWokenUp, setHasWokenUp] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Always-current transcript for the unmount/close handler to read.
  const transcriptRef = useRef<Message[]>([]);
  // Guards against sending the same conversation twice (unmount + tab close).
  const loggedRef = useRef(false);

  // Keep the transcript ref in sync. We store final text, not mid-typing text.
  useEffect(() => {
    transcriptRef.current = messages.map((m) => ({
      isFromUser: m.isFromUser,
      text: m.fullText ?? m.text,
    }));
    // A new message means there's fresh content worth logging again.
    loggedRef.current = false;
  }, [messages]);

  // Send the whole conversation as a single email.
  const flushConversation = useCallback(() => {
    const transcript = transcriptRef.current;
    if (loggedRef.current || transcript.length === 0) return;
    loggedRef.current = true;

    const conversationText = transcript
      .map((m) => `${m.isFromUser ? "USER" : "BOT"}: ${m.text}`)
      .join("\n\n");

    fetch(`${API_URL}/mail-service`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_name: "Portfolio",
        from_email: "Back-end",
        subject: `Portfolio chatbot — ${transcript.length} messages`,
        message: conversationText,
      }),
      keepalive: true,
      credentials: "omit",
    }).catch((err) => console.error("Conversation log failed:", err));
  }, []);

  // Flush on tab close/hide and on component unmount (leaving the page).
  useEffect(() => {
    const handleHide = () => {
      if (document.visibilityState === "hidden") flushConversation();
    };
    window.addEventListener("visibilitychange", handleHide);
    window.addEventListener("pagehide", flushConversation);

    return () => {
      window.removeEventListener("visibilitychange", handleHide);
      window.removeEventListener("pagehide", flushConversation);
      flushConversation(); // navigating away within the SPA
    };
  }, [flushConversation]);

  // Typing animation — reveals the last bot message one character at a time.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.isFromUser || !last.fullText) return;
    if (last.text === last.fullText) return;

    const timer = setTimeout(() => {
      setMessages((prev) => {
        const updated = [...prev];
        const i = updated.length - 1;
        const target = updated[i];
        if (!target.fullText) return prev;
        updated[i] = {
          ...target,
          text: target.fullText.slice(0, target.text.length + 1),
        };
        return updated;
      });
    }, TYPING_SPEED_MS);

    return () => clearTimeout(timer);
  }, [messages]);

  // Auto-scroll to bottom on new content.
  useEffect(() => {
    const el = chatBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setMessages((m) => {
      const updated = [...m];
      const last = updated[updated.length - 1];
      if (
        last &&
        !last.isFromUser &&
        last.fullText &&
        last.text !== last.fullText
      ) {
        updated[updated.length - 1] = { ...last, text: last.fullText };
      }
      return [...updated, { isFromUser: true, text: trimmed }];
    });
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      const reply = data.reply ?? "Sorry, I didn't get a response.";
      setHasWokenUp(true);
      setMessages((m) => [
        ...m,
        { isFromUser: false, text: "", fullText: reply },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { isFromUser: false, text: "Network error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="container">
      <h2>
        <i className="fas fa-solid fa-robot"></i> {t("chatbot.title") + " v1.2"}
      </h2>
      <p>{t("chatbot.main")}</p>

      <div className="chat-box">
        <div className="chat-box-header">
          <h3>
            <i className="fas fa-comments"></i> {t("chatbot.chat.title")}
          </h3>
        </div>

        <div className="chat-box-body" ref={chatBodyRef}>
          {messages.length === 0 && !isLoading && (
            <div className="chat-empty">
              <i className="fas fa-robot chat-empty-icon"></i>
              <p>{t("chatbot.chat.subtitle")}</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-bubble-row ${msg.isFromUser ? "user" : "bot"}`}
            >
              <div className={`chat-bubble ${msg.isFromUser ? "user" : "bot"}`}>
                {msg.text}
                {!msg.isFromUser &&
                  msg.fullText &&
                  msg.text !== msg.fullText && <span className="caret" />}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-bubble-row bot">
              <div className="chat-bubble bot loading">
                <span>
                  {hasWokenUp
                    ? t("chatbot.chat.thinking")
                    : t("chatbot.chat.wakingup")}
                </span>
                <span className="typing-dots" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-box-footer">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatbot.chat.placeholder")}
            disabled={isLoading}
          />
          <button
            className="chat-button"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            aria-label={t("chatbot.chat.label")}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      <NavLink to="/" className="chat-back-link">
        <i className="fas fa-arrow-left"></i> {t("chatbot.back")}
      </NavLink>
    </div>
  );
}
