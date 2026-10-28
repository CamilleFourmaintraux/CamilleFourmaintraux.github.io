import { useState } from "react";
import { useTranslation } from "react-i18next";
import { validateEmail } from "../../Utils";

type Props = {
  onSubmit: (email: string, name: string) => Promise<void>;
  disabled?: boolean;
};

type Status = "closed" | "open" | "sending" | "sent" | "error";

export default function ContactRequest({ onSubmit, disabled }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("closed");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [invalid, setInvalid] = useState(false);

  if (status === "sent") {
    return (
      <p className="chat-contact chat-contact-done" role="status">
        <i className="fas fa-circle-check" aria-hidden="true"></i>{" "}
        {t("chatbot.contact.sent", { email })}
      </p>
    );
  }

  if (status === "closed") {
    return (
      <div className="chat-contact">
        <button
          type="button"
          className="chat-contact-toggle"
          onClick={() => setStatus("open")}
          disabled={disabled}
        >
          <i className="fas fa-envelope" aria-hidden="true"></i>{" "}
          {t("chatbot.contact.button")}
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email.trim())) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setStatus("sending");
    try {
      await onSubmit(email.trim(), name.trim());
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form
      className="chat-contact chat-contact-form"
      onSubmit={submit}
      noValidate
    >
      <p className="chat-contact-intro">{t("chatbot.contact.intro")}</p>
      <div className="chat-contact-fields">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setInvalid(false);
          }}
          placeholder={t("chatbot.contact.email")}
          aria-label={t("chatbot.contact.email")}
          autoComplete="email"
          required
          aria-invalid={invalid}
          disabled={status === "sending"}
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("chatbot.contact.name")}
          aria-label={t("chatbot.contact.name")}
          autoComplete="name"
          maxLength={80}
          disabled={status === "sending"}
        />
      </div>
      {invalid && (
        <p className="chat-contact-error">{t("form.msg-invalidEmail")}</p>
      )}
      {status === "error" && (
        <p className="chat-contact-error">{t("chatbot.contact.error")}</p>
      )}
      <div className="chat-contact-actions">
        <button type="submit" disabled={status === "sending"}>
          {status === "sending"
            ? t("chatbot.contact.sending")
            : t("chatbot.contact.submit")}
        </button>
        <button
          type="button"
          className="chat-contact-cancel"
          onClick={() => setStatus("closed")}
          disabled={status === "sending"}
        >
          {t("chatbot.contact.cancel")}
        </button>
      </div>
    </form>
  );
}
