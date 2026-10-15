import type { ReactNode } from "react";

// Markdown link: [label](url)
const LINK_RE = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/**
 * Only these link targets are turned into clickable links. Anything else
 * (javascript:, data:, unknown domains written without https...) is shown as
 * plain text, so a manipulated answer can never produce a dangerous link.
 */
function isAllowedUrl(url: string): boolean {
  return (
    url.startsWith("#/") ||
    url.startsWith("/files/") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:")
  );
}

function renderLink(label: string, url: string, key: number): ReactNode {
  if (!isAllowedUrl(url)) return label;

  // Internal pages stay in the same tab (the conversation is kept in the
  // session, so the visitor finds it again when coming back).
  if (url.startsWith("#/")) {
    return (
      <a key={key} href={url} className="chat-link">
        {label}
      </a>
    );
  }
  return (
    <a
      key={key}
      href={url}
      className="chat-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </a>
  );
}

/** Renders a bot answer: plain text with Markdown links made clickable. */
export default function BotText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(LINK_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));
    parts.push(renderLink(match[1], match[2], index));
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <>{parts}</>;
}
