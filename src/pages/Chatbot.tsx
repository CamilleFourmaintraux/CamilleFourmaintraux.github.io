import { NavLink } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import { API_URL } from "../Utils";
import BotText from "../parts/chatbot/BotText";
import { ChatError, streamChat, type ChatTurn } from "../parts/chatbot/chatApi";
import {
  clearConversation,
  loadConversation,
  saveConversation,
  type Message,
  type Rating,
} from "../parts/chatbot/chatStorage";

const TYPING_SPEED_MS = 18;

/*
 * Number of previous exchanges (user message + bot reply) remembered and sent
 * back with each new message. When the limit is exceeded, the oldest exchange
 * is forgotten. The back-end applies its own cap (BUFFER_MEMORY env var), so
 * keep this value lower than or equal to the server's.
 */
const BUFFER_MEMORY = 5;

const SUGGESTION_KEYS = ["q1", "q2", "q3", "q4"] as const;

/** Plain-text transcript used for the conversation email. */
function buildTranscript(messages: Message[]): string {
  return messages
    .map((m) => {
      const text = m.fullText ?? m.text;
      if (m.isFromUser) return `USER: ${text}`;
      const provider = m.provider ? ` (${m.provider})` : "";
      const rating =
        m.rating === "up" ? " [👍]" : m.rating === "down" ? " [👎]" : "";
      const error = m.isError ? " [ERROR]" : "";
      return `BOT${provider}${rating}${error}: ${text}`;
    })
    .join("\n\n");
}

export default function ChatbotPage() {
  const { t, i18n } = useTranslation();

  // Restored once from sessionStorage (same browser tab).
  const [saved] = useState(loadConversation);
  const [messages, setMessages] = useState<Message[]>(saved.messages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // waiting for 1st word
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasWokenUp, setHasWokenUp] = useState(saved.messages.length > 0);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Conversation memory: only successful exchanges, oldest first.
  const historyRef = useRef<ChatTurn[]>(saved.history);
  // Always-current messages for the unmount/close handler to read.
  const messagesRef = useRef<Message[]>(saved.messages);
  // Transcript already emailed (survives page changes via sessionStorage).
  const loggedSignatureRef = useRef(saved.loggedSignature);

  const isBusy = isLoading || isStreaming;

  const persist = useCallback(() => {
    saveConversation({
      messages: messagesRef.current,
      history: historyRef.current,
      loggedSignature: loggedSignatureRef.current,
    });
  }, []);

  // Keep the ref in sync and save the conversation for this tab.
  useEffect(() => {
    messagesRef.current = messages;
    persist();
  }, [messages, persist]);

  /*
   * Emails the whole conversation, including feedback, unless this exact
   * transcript was already sent. A conversation continued later is sent
   * again in full, so the latest email is always the complete one.
   */
  const flushConversation = useCallback(() => {
    const finished = messagesRef.current.filter((m) => !m.streaming);
    if (finished.length === 0) return;
    const transcript = buildTranscript(finished);
    if (transcript === loggedSignatureRef.current) return;
    loggedSignatureRef.current = transcript;
    persist();

    fetch(`${API_URL}/mail-service`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_name: "Portfolio",
        from_email: "Back-end",
        subject: `Portfolio chatbot — ${finished.length} messages`,
        message: transcript,
      }),
      keepalive: true,
      credentials: "omit",
    }).catch((err) => console.error("Conversation log failed:", err));
  }, [persist]);

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
      abortRef.current?.abort();
      flushConversation(); // navigating away within the SPA
    };
  }, [flushConversation]);

  // Typing animation: reveals the last bot message progressively. It also
  // follows the stream, and speeds up when it falls behind.
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
        const remaining = target.fullText.length - target.text.length;
        const step = Math.max(1, Math.ceil(remaining / 120));
        updated[i] = {
          ...target,
          text: target.fullText.slice(0, target.text.length + step),
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

  /** Updates the last message (the bot answer being streamed). */
  const updateLast = (update: (m: Message) => Message) =>
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = update(updated[updated.length - 1]);
      return updated;
    });

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    // Finish the previous animation instantly, then add the user message.
    setMessages((m) => {
      const updated = m.map((msg) =>
        !msg.isFromUser && msg.fullText ? { ...msg, text: msg.fullText } : msg,
      );
      return [...updated, { isFromUser: true, text: trimmed }];
    });
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let reply = "";

    try {
      const result = await streamChat(
        {
          message: trimmed,
          // Empty for the first message of the conversation.
          history: historyRef.current,
          lang: i18n.language.split("-")[0],
        },
        (delta) => {
          if (!reply) {
            // First words: replace the "thinking" bubble by the answer.
            setIsLoading(false);
            setIsStreaming(true);
            setHasWokenUp(true);
            setMessages((m) => [
              ...m,
              { isFromUser: false, text: "", fullText: "", streaming: true },
            ]);
          }
          reply += delta;
          updateLast((m) => ({ ...m, fullText: reply }));
        },
        controller.signal,
      );

      updateLast((m) => ({
        ...m,
        streaming: false,
        provider: result.provider,
      }));

      // Remember the exchange, then forget the oldest beyond BUFFER_MEMORY.
      historyRef.current = [
        ...historyRef.current,
        { role: "user" as const, content: trimmed },
        { role: "assistant" as const, content: reply },
      ].slice(-BUFFER_MEMORY * 2);
      persist();
    } catch (err) {
      if (controller.signal.aborted) return;
      const kind = err instanceof ChatError ? err.kind : "network";
      const errorText =
        kind === "rate-limit"
          ? t("chatbot.chat.rate-limited")
          : kind === "unavailable"
            ? t("chatbot.chat.error")
            : t("chatbot.chat.network-error");
      if (kind !== "network") setHasWokenUp(true);
      setMessages((m) => [
        ...m,
        { isFromUser: false, text: errorText, isError: true },
      ]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  };

  const rateMessage = (index: number, rating: Rating) =>
    setMessages((prev) =>
      prev.map((m, i) =>
        i === index
          ? { ...m, rating: m.rating === rating ? undefined : rating }
          : m,
      ),
    );

  const resetConversation = () => {
    if (isBusy) return;
    flushConversation(); // keep a copy of the conversation by email
    historyRef.current = [];
    loggedSignatureRef.current = "";
    clearConversation();
    setMessages([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="container">
      <h2>
        <i className="fas fa-solid fa-robot"></i> {t("chatbot.title") + " v1.5"}
      </h2>
      <p>{t("chatbot.main")}</p>

      <div className="chat-box">
        <div className="chat-box-header">
          <h3>
            <i className="fas fa-comments"></i> {t("chatbot.chat.title")}
          </h3>
          {messages.length > 0 && (
            <button
              type="button"
              className="chat-reset-button"
              onClick={resetConversation}
              disabled={isBusy}
              title={t("chatbot.chat.reset")}
            >
              <i className="fas fa-rotate-left"></i>
              <span>{t("chatbot.chat.reset")}</span>
            </button>
          )}
        </div>

        <div className="chat-box-body" ref={chatBodyRef}>
          {messages.length === 0 && !isLoading && (
            <div className="chat-empty">
              <i className="fas fa-robot chat-empty-icon"></i>
              <p>{t("chatbot.chat.subtitle")}</p>
              <p className="chat-suggestions-title">
                {t("chatbot.chat.suggestions-title")}
              </p>
              <div className="chat-suggestions">
                {SUGGESTION_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="chat-suggestion"
                    onClick={() =>
                      sendMessage(t(`chatbot.chat.suggestions.${key}`))
                    }
                  >
                    {t(`chatbot.chat.suggestions.${key}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isBot = !msg.isFromUser;
            const isTyping =
              isBot &&
              (msg.streaming ||
                (msg.fullText !== undefined && msg.text !== msg.fullText));
            const canRate = isBot && !msg.isError && !isTyping;
            return (
              <div
                key={i}
                className={`chat-bubble-row ${msg.isFromUser ? "user" : "bot"}`}
              >
                <div className="chat-bubble-column">
                  <div
                    className={`chat-bubble ${msg.isFromUser ? "user" : "bot"}${
                      msg.isError ? " error" : ""
                    }`}
                  >
                    {isBot ? <BotText text={msg.text} /> : msg.text}
                    {isTyping && <span className="caret" />}
                  </div>
                  {canRate && (
                    <div className="chat-feedback">
                      <button
                        type="button"
                        aria-pressed={msg.rating === "up"}
                        aria-label={t("chatbot.chat.feedback-up")}
                        title={t("chatbot.chat.feedback-up")}
                        onClick={() => rateMessage(i, "up")}
                      >
                        <i
                          className={`${msg.rating === "up" ? "fas" : "far"} fa-thumbs-up`}
                        ></i>
                      </button>
                      <button
                        type="button"
                        aria-pressed={msg.rating === "down"}
                        aria-label={t("chatbot.chat.feedback-down")}
                        title={t("chatbot.chat.feedback-down")}
                        onClick={() => rateMessage(i, "down")}
                      >
                        <i
                          className={`${msg.rating === "down" ? "fas" : "far"} fa-thumbs-down`}
                        ></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

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
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatbot.chat.placeholder")}
            disabled={isBusy}
            maxLength={1000}
          />
          <button
            className="chat-button"
            onClick={() => sendMessage(input)}
            disabled={isBusy || !input.trim()}
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
