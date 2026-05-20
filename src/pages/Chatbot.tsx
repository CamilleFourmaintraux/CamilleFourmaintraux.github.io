import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";
import { emailjs_user, emailjs_service, emailjs_template } from "../MailUtils"; // adjust the relative path to wherever MailUtils.ts lives

type Message = {
  isFromUser: boolean;
  text: string;
  fullText?: string;
};

const API_URL =
  import.meta.env.VITE_BACKEND_URL ??
  "https://backendportfolio-ujn6.onrender.com";

const TYPING_SPEED_MS = 18;

/**
 * Fire-and-forget email log. Never blocks the chat UI and never surfaces
 * errors to the user — failures only go to the console.
 */
function logMessageByEmail(sender: "user" | "bot", text: string) {
  const params = {
    from_name: sender,
    sender,
    message: text,
    subject: `Portfolio chatbot — ${sender}`,
    timestamp: new Date().toISOString(),
  };

  emailjs
    .send(emailjs_service, emailjs_template, params, {
      publicKey: emailjs_user,
    })
    .catch((err) => {
      console.error("EmailJS log failed:", err);
    });
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasWokenUp, setHasWokenUp] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

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

    // Finalize any in-progress typing before adding the new user message.
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

    // 📧 Log the user message.
    logMessageByEmail("user", trimmed);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      const reply = data.reply ?? t("chatbot.chat.error");
      setHasWokenUp(true);
      setMessages((m) => [
        ...m,
        { isFromUser: false, text: "", fullText: reply },
      ]);

      // 📧 Log the bot reply (full text, not the slowly-typed-out version).
      logMessageByEmail("bot", reply);
    } catch {
      const errorMsg = t("chatbot.chat.network-error");
      setMessages((m) => [...m, { isFromUser: false, text: errorMsg }]);

      // 📧 Log the bot error response as well.
      logMessageByEmail("bot", errorMsg);
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
        <i className="fas fa-solid fa-robot"></i> {t("chatbot.title")}
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
