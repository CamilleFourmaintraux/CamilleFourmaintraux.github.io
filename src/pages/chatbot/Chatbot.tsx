import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  faArrowLeft,
  faComments,
  faPaperPlane,
  faRobot,
  faRotateLeft,
  faShieldHalved,
  faThumbsDown,
  faThumbsUp,
} from "@fortawesome/free-solid-svg-icons";
import { API_URL } from "@/lib/utils";
import Icon from "@/ui/Icon";
import Page from "@/ui/Page";
import BotText from "./BotText";
import ContactRequest from "./ContactRequest";
import { getVisitorContext, recordAction } from "@/lib/visitor/visitorContext";
import { ChatError, streamChat, type ChatTurn } from "@/lib/chat/chatApi";
import {
  clearConversation,
  loadConversation,
  saveConversation,
  type Message,
  type Rating,
} from "@/lib/chat/chatStorage";

const TYPING_SPEED_MS = 18;

// Exchanges remembered. Keep <= the server's BUFFER_MEMORY.
const BUFFER_MEMORY = 5;

const SUGGESTION_KEYS = ["q1", "q2", "q3", "q4"] as const;

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

  const [saved] = useState(loadConversation);
  const [messages, setMessages] = useState<Message[]>(saved.messages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasWokenUp, setHasWokenUp] = useState(saved.messages.length > 0);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const historyRef = useRef<ChatTurn[]>(saved.history);
  const messagesRef = useRef<Message[]>(saved.messages);
  const loggedSignatureRef = useRef(saved.loggedSignature);

  const isBusy = isLoading || isStreaming;

  // The field is disabled while the bot answers: the focus can only come
  // back once it is enabled again.
  const refocusRef = useRef(false);
  useEffect(() => {
    if (isBusy || !refocusRef.current) return;
    refocusRef.current = false;
    inputRef.current?.focus();
  }, [isBusy]);

  // Screen readers get each finished answer once, not letter by letter.
  const lastMessage = messages[messages.length - 1];
  const announcement =
    lastMessage && !lastMessage.isFromUser && !lastMessage.streaming
      ? (lastMessage.fullText ?? lastMessage.text)
      : "";

  const persist = useCallback(() => {
    saveConversation({
      messages: messagesRef.current,
      history: historyRef.current,
      loggedSignature: loggedSignatureRef.current,
    });
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    persist();
  }, [messages, persist]);

  // Emails the full transcript, unless this exact one was already sent.
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
        context: getVisitorContext(),
      }),
      keepalive: true,
      credentials: "omit",
    }).catch((err) => console.error("Conversation log failed:", err));
  }, [persist]);

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
      flushConversation();
    };
  }, [flushConversation]);

  // Typing animation, speeds up when it falls behind the stream.
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

  useEffect(() => {
    const el = chatBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

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

    setMessages((m) => {
      const updated = m.map((msg) =>
        !msg.isFromUser && msg.fullText ? { ...msg, text: msg.fullText } : msg,
      );
      return [...updated, { isFromUser: true, text: trimmed }];
    });
    setInput("");
    setIsLoading(true);
    recordAction("chat");

    const controller = new AbortController();
    abortRef.current = controller;
    let reply = "";

    try {
      const result = await streamChat(
        {
          message: trimmed,
          history: historyRef.current,
          lang: i18n.language.split("-")[0],
        },
        (delta) => {
          if (!reply) {
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
      refocusRef.current = true;
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

  // Sends the conversation with the visitor's address so Camille can answer.
  const requestContact = async (email: string, name: string) => {
    const finished = messagesRef.current.filter((m) => !m.streaming);
    const transcript = buildTranscript(finished);
    const res = await fetch(`${API_URL}/mail-service`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_name: name || email,
        from_email: email,
        subject: `Demande de recontact (chatbot) — ${finished.length} messages`,
        message: `Le visiteur souhaite être recontacté à : ${email}${
          name ? ` (${name})` : ""
        }\n\n${transcript}`,
        context: getVisitorContext(),
      }),
      credentials: "omit",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    recordAction("recontact");
    // The transcript is already in this e-mail: do not send it again.
    loggedSignatureRef.current = transcript;
    persist();
  };

  const resetConversation = () => {
    if (isBusy) return;
    flushConversation();
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
    <Page
      title={`${t("chatbot.title")} v1.7`}
      icon={faRobot}
      lead={<p>{t("chatbot.main")}</p>}
    >
      <div className="chat-box">
        <div className="chat-box-header">
          <h2>
            <Icon icon={faComments} /> {t("chatbot.chat.title")}
          </h2>
          {messages.length > 0 && (
            <button
              type="button"
              className="chat-reset-button"
              onClick={resetConversation}
              disabled={isBusy}
            >
              <Icon icon={faRotateLeft} />
              <span>{t("chatbot.chat.reset")}</span>
            </button>
          )}
        </div>

        <div
          className="chat-box-body"
          ref={chatBodyRef}
          tabIndex={0}
          role="group"
          aria-label={t("chatbot.chat.title")}
        >
          {messages.length === 0 && !isLoading && (
            <div className="chat-empty">
              <Icon icon={faRobot} className="chat-empty-icon" />
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
                    {isTyping && <span className="caret" aria-hidden="true" />}
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
                        <Icon icon={faThumbsUp} />
                      </button>
                      <button
                        type="button"
                        aria-pressed={msg.rating === "down"}
                        aria-label={t("chatbot.chat.feedback-down")}
                        title={t("chatbot.chat.feedback-down")}
                        onClick={() => rateMessage(i, "down")}
                      >
                        <Icon icon={faThumbsDown} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="chat-bubble-row bot">
              <div className="chat-bubble bot loading" role="status">
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

        {messages.length > 0 && (
          <ContactRequest onSubmit={requestContact} disabled={isBusy} />
        )}

        <div className="chat-box-footer">
          <input
            id="chat-input"
            name="message"
            aria-label={t("chatbot.chat.placeholder")}
            autoComplete="off"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chatbot.chat.placeholder")}
            disabled={isBusy}
            maxLength={1000}
          />
          <button
            type="button"
            className="chat-button"
            onClick={() => sendMessage(input)}
            disabled={isBusy || !input.trim()}
            aria-label={t("chatbot.chat.label")}
          >
            <Icon icon={faPaperPlane} />
          </button>
        </div>
      </div>

      <p className="sr-only" role="status">
        {announcement}
      </p>

      <p className="chat-privacy">
        <Icon icon={faShieldHalved} />{" "}
        <Trans
          i18nKey="chatbot.privacy-notice"
          components={{
            privacyLink: <Link to="/privacy" className="nowrap" />,
          }}
        />
      </p>

      <p className="page-actions">
        <Link to="/" className="button">
          <Icon icon={faArrowLeft} />
          {t("chatbot.back")}
        </Link>
      </p>
    </Page>
  );
}
