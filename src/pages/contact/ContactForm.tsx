import { useRef, useState } from "react";
import { validateEmail, API_URL } from "../../Utils";
import { useTranslation } from "react-i18next";

export default function ContactForm() {
  const { t } = useTranslation();
  const lastnameRef = useRef<HTMLInputElement>(null);
  const firstnameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(true);
  const [isBeingSent, setIsBeingSent] = useState<boolean>(false);

  // Envoie l'email via le back-end (qui relaie vers EmailJS).
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

      setStatusMessage(t("form.msg-success"));
      setIsSuccess(true);
      resetForm();
    } catch (err) {
      console.error("Mail send failed:", err);
      setStatusMessage(t("form.msg-error"));
      setIsSuccess(false);
    } finally {
      setIsBeingSent(false);
      setTimeout(() => setStatusMessage(""), 8000);
    }
  };

  const resetForm = () => {
    if (lastnameRef.current) lastnameRef.current.value = "";
    if (firstnameRef.current) firstnameRef.current.value = "";
    if (emailRef.current) emailRef.current.value = "";
    if (subjectRef.current) subjectRef.current.value = "";
    if (messageRef.current) messageRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBeingSent) {
      console.warn("Le mail est déjà en train de s'envoyer.");
      return;
    }
    const lastname = lastnameRef.current?.value || "";
    const firstname = firstnameRef.current?.value || "";
    const email = emailRef.current?.value || "";
    const subject = subjectRef.current?.value || "";
    const message = messageRef.current?.value || "";

    if (validateEmail(email)) {
      setIsBeingSent(true);
      setIsSuccess(true);
      setStatusMessage(t("form.msg-sent"));
      sendMail(lastname, firstname, email, subject, message);
    } else {
      setIsSuccess(false);
      setStatusMessage(t("form.msg-invalidEmail"));
      setTimeout(() => setStatusMessage(""), 8000);
    }
  };

  return (
    <>
      <div className="container">
        <h2>
          <i className="fas fa-pen"></i> {t("form.title")}
        </h2>
        <section id="section_form">
          <form id="contact-form" onSubmit={handleSubmit}>
            <div className="next-to-each-other">
              <div className="form-name">
                <label htmlFor="name">{t("form.name")}</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder={t("form.name_placeholder")}
                  required
                  ref={lastnameRef}
                  disabled={isBeingSent}
                />
              </div>
              <div className="form-name">
                <label htmlFor="forename">{t("form.forename")}</label>
                <input
                  id="forename"
                  name="forename"
                  type="text"
                  placeholder={t("form.forename_placeholder")}
                  required
                  ref={firstnameRef}
                  disabled={isBeingSent}
                />
              </div>
            </div>

            <label htmlFor="mail" className="protected">
              {t("form.email")}
            </label>
            <input
              id="mail"
              name="mail"
              type="email"
              placeholder={t("form.email_placeholder")}
              required
              ref={emailRef}
              disabled={isBeingSent}
            />

            <label htmlFor="subject">{t("form.subject")}</label>
            <input
              id="subject"
              name="subject"
              type="text"
              placeholder={t("form.subject_placeholder")}
              required
              ref={subjectRef}
              disabled={isBeingSent}
            />

            <label htmlFor="message">{t("form.message")}</label>
            <textarea
              id="message"
              name="message"
              placeholder={t("form.message_placeholder")}
              required
              ref={messageRef}
              disabled={isBeingSent}
            />

            <button type="submit" id="submit_button">
              <i
                className={
                  isBeingSent ? "fas fa-truck-fast" : "fas fa-paper-plane"
                }
              ></i>{" "}
              {isBeingSent ? t("form.sent") : t("form.send")}
            </button>
          </form>
        </section>

        {statusMessage && (
          <section>
            <div
              id="message-status"
              className={
                isSuccess ? "mail_sent_successfully" : "mail_sending_error"
              }
            >
              {statusMessage}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
