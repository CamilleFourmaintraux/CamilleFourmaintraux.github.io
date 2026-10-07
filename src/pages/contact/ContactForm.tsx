import { useEffect, useRef, useState } from "react";
import { validateEmail, API_URL } from "../../Utils";
import { useTranslation } from "react-i18next";

const STATUS_DISPLAY_MS = 8000;

export default function ContactForm() {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const statusTimerRef = useRef<number | undefined>(undefined);

  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(true);
  const [isBeingSent, setIsBeingSent] = useState<boolean>(false);

  // Clear the pending status timer when leaving the page.
  useEffect(() => () => window.clearTimeout(statusTimerRef.current), []);

  /**
   * Shows a status message. Messages that auto-hide restart the timer, so an
   * older timeout can no longer erase a newer message.
   */
  const showStatus = (message: string, success: boolean, autoHide = true) => {
    window.clearTimeout(statusTimerRef.current);
    setStatusMessage(message);
    setIsSuccess(success);
    if (autoHide) {
      statusTimerRef.current = window.setTimeout(
        () => setStatusMessage(""),
        STATUS_DISPLAY_MS,
      );
    }
  };

  // Sends the email through the back-end (which relays it to EmailJS).
  const sendMail = async (
    lastname: string,
    firstname: string,
    email: string,
    subject: string,
    message: string,
  ) => {
    try {
      const res = await fetch(`${API_URL}/mail-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_name: `${firstname} ${lastname}`.trim(),
          from_email: email,
          subject,
          message,
        }),
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      showStatus(t("form.msg-success"), true);
      formRef.current?.reset();
    } catch (err) {
      console.error("Mail send failed:", err);
      showStatus(t("form.msg-error"), false);
    } finally {
      setIsBeingSent(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isBeingSent) return;

    const data = new FormData(e.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const email = field("mail");

    if (!validateEmail(email)) {
      showStatus(t("form.msg-invalidEmail"), false);
      return;
    }

    setIsBeingSent(true);
    // Stays visible until the request finishes.
    showStatus(t("form.msg-sent"), true, false);
    sendMail(
      field("name"),
      field("forename"),
      email,
      field("subject"),
      field("message"),
    );
  };

  return (
    <div className="container">
      <h2>
        <i className="fas fa-pen"></i> {t("form.title")}
      </h2>
      <section id="section_form">
        <form id="contact-form" ref={formRef} onSubmit={handleSubmit}>
          {/* Disabling the fieldset disables every field and the button at once. */}
          <fieldset disabled={isBeingSent}>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="name">{t("form.name")}</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="family-name"
                  placeholder={t("form.name_placeholder")}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="forename">{t("form.forename")}</label>
                <input
                  id="forename"
                  name="forename"
                  type="text"
                  autoComplete="given-name"
                  placeholder={t("form.forename_placeholder")}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="mail">{t("form.email")}</label>
              <input
                id="mail"
                name="mail"
                type="email"
                autoComplete="email"
                placeholder={t("form.email_placeholder")}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="subject">{t("form.subject")}</label>
              <input
                id="subject"
                name="subject"
                type="text"
                placeholder={t("form.subject_placeholder")}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="message">{t("form.message")}</label>
              <textarea
                id="message"
                name="message"
                placeholder={t("form.message_placeholder")}
                required
              />
            </div>

            <button type="submit" id="submit_button">
              <i
                className={
                  isBeingSent ? "fas fa-truck-fast" : "fas fa-paper-plane"
                }
              ></i>{" "}
              {isBeingSent ? t("form.sent") : t("form.send")}
            </button>
          </fieldset>
        </form>
      </section>

      {/* Always rendered so screen readers announce status changes. */}
      <section aria-live="polite">
        {statusMessage && (
          <div
            id="message-status"
            className={
              isSuccess ? "mail_sent_successfully" : "mail_sending_error"
            }
          >
            {statusMessage}
          </div>
        )}
      </section>
    </div>
  );
}
