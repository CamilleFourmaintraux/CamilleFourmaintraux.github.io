import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import {
  faCircleCheck,
  faComment,
  faEnvelope,
  faHeart,
  faPaperPlane,
  faPen,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { EMAIL, GITHUB_URL, LINKEDIN_URL } from "@/lib/links";
import { API_URL, validateEmail } from "@/lib/utils";
import { getVisitorContext, recordAction } from "@/lib/visitor/visitorContext";
import ExternalLink from "@/ui/ExternalLink";
import Icon from "@/ui/Icon";
import Page, { Section } from "@/ui/Page";

const STATUS_DISPLAY_MS = 8000;

type Status = {
  kind: "idle" | "sending" | "success" | "error";
  message: string;
};

type FieldProps = {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  maxLength?: number;
  multiline?: boolean;
  error?: string;
};

function Field({
  name,
  label,
  multiline,
  required,
  error,
  ...rest
}: FieldProps) {
  const id = `contact-${name}`;
  const control = {
    id,
    name,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    ...rest,
  };
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {/* The required attribute already informs screen readers. */}
        {required && (
          <span className="field-required" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {multiline ? (
        <textarea rows={6} {...control} />
      ) : (
        <input type="text" {...control} />
      )}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          <Icon icon={faTriangleExclamation} /> {error}
        </p>
      )}
    </div>
  );
}

function ContactForm() {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });
  const [emailError, setEmailError] = useState("");
  const sending = status.kind === "sending";

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  // Final messages disappear after a while, the "sending" one stays.
  const show = (kind: Status["kind"], message: string) => {
    window.clearTimeout(timerRef.current);
    setStatus({ kind, message });
    if (kind !== "sending") {
      timerRef.current = window.setTimeout(
        () => setStatus({ kind: "idle", message: "" }),
        STATUS_DISPLAY_MS,
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    const email = field("mail");

    if (!validateEmail(email)) {
      setEmailError(t("form.msg-invalidEmail"));
      form.querySelector<HTMLInputElement>("#contact-mail")?.focus();
      return;
    }
    setEmailError("");
    show("sending", t("form.msg-sent"));

    try {
      // The back-end relays the message to EmailJS.
      const response = await fetch(`${API_URL}/mail-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_name: `${field("forename")} ${field("name")}`.trim(),
          from_email: email,
          company: field("company"),
          role: field("role"),
          subject: field("subject"),
          message: field("message"),
          context: getVisitorContext(),
        }),
      });
      if (!response.ok) throw new Error(`Server responded ${response.status}`);
      recordAction("contact");
      show("success", t("form.msg-success"));
      formRef.current?.reset();
    } catch (error) {
      console.error("Mail send failed:", error);
      show("error", t("form.msg-error"));
    }
  };

  return (
    <>
      <form className="form" ref={formRef} onSubmit={handleSubmit}>
        {/* Disabling the fieldset disables every field and the button at once. */}
        <fieldset disabled={sending}>
          <div className="field-row">
            <Field
              name="name"
              label={t("form.name")}
              placeholder={t("form.name_placeholder")}
              autoComplete="family-name"
              required
            />
            <Field
              name="forename"
              label={t("form.forename")}
              placeholder={t("form.forename_placeholder")}
              autoComplete="given-name"
            />
          </div>
          <div className="field-row">
            <Field
              name="company"
              label={t("form.company")}
              placeholder={t("form.company_placeholder")}
              autoComplete="organization"
              maxLength={100}
            />
            <Field
              name="role"
              label={t("form.role")}
              placeholder={t("form.role_placeholder")}
              autoComplete="organization-title"
              maxLength={100}
            />
          </div>
          <Field
            name="mail"
            type="email"
            label={t("form.email")}
            placeholder={t("form.email_placeholder")}
            autoComplete="email"
            required
            error={emailError}
          />
          <Field
            name="subject"
            label={t("form.subject")}
            placeholder={t("form.subject_placeholder")}
            required
          />
          <Field
            name="message"
            label={t("form.message")}
            placeholder={t("form.message_placeholder")}
            required
            multiline
          />
          <p className="form-note">{t("form.required_note")}</p>
          <button type="submit" className="button button-primary">
            {sending ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              <Icon icon={faPaperPlane} />
            )}
            {sending ? t("form.sent") : t("form.send")}
          </button>
        </fieldset>
      </form>

      {/* Always rendered so screen readers announce status changes. */}
      <div role="status" className="form-status-region">
        {status.message && (
          <p className={`form-status is-${status.kind}`}>
            {status.kind === "success" && <Icon icon={faCircleCheck} />}
            {status.kind === "error" && <Icon icon={faTriangleExclamation} />}
            {status.message}
          </p>
        )}
      </div>

      <p className="form-note">
        <Trans
          i18nKey="form.privacy"
          components={{
            privacyLink: <Link to="/privacy" className="nowrap" />,
          }}
        />
      </p>
    </>
  );
}

export default function Contact() {
  const { t } = useTranslation();
  return (
    <Page
      title={t("contact.title")}
      icon={faComment}
      lead={<p>{t("contact.intro")}</p>}
    >
      <Section>
        <ul className="contact-list">
          <li>
            <span className="contact-label">{t("contact.mail")}</span>
            <a href={`mailto:${EMAIL}`}>
              <Icon icon={faEnvelope} /> {EMAIL}
            </a>
          </li>
          <li>
            <span className="contact-label">{t("contact.linkedin")}</span>
            <ExternalLink href={LINKEDIN_URL} plain>
              <Icon icon={faLinkedin} />{" "}
              www.linkedin.com/in/camille-fourmaintraux-708b34275
            </ExternalLink>
          </li>
          <li>
            <span className="contact-label">{t("contact.github")}</span>
            <ExternalLink href={GITHUB_URL} plain>
              <Icon icon={faGithub} /> {GITHUB_URL}
            </ExternalLink>
          </li>
        </ul>
        <p>{t("contact.footer")}</p>
      </Section>

      <Section title={t("form.title")} icon={faPen}>
        <ContactForm />
      </Section>

      <Section title={t("thanks.title")} icon={faHeart}>
        <p>{t("thanks.message")}</p>
      </Section>
    </Page>
  );
}
