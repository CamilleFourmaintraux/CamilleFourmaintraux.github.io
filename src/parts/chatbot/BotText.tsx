import type { ReactNode } from "react";

const LINK_RE = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

// Anything else (javascript:, data:...) is rendered as plain text.
function isAllowedUrl(url: string): boolean {
  return (
    url.startsWith("#/") ||
    url.startsWith("/files/") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:")
  );
}

// Short labels never wrap, so a link is not split across two lines.
const MAX_UNBROKEN_LABEL = 40;

function renderLink(text: string, url: string, key: number): ReactNode {
  if (!isAllowedUrl(url)) return text;
  const label =
    text.length <= MAX_UNBROKEN_LABEL ? text.replace(/ /g, "\u00a0") : text;

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
