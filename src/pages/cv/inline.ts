// Light text formatting shared by the preview and the LaTeX export:
// **bold**, *italic* and ^superscript^ (as in "1^re^ année").

export type Segment = {
  text: string;
  style: "plain" | "bold" | "italic" | "sup";
};

// Markup only counts when it hugs its text: "a * b" or "x ^ y" stay as typed.
const MARKUP =
  /\*\*(?!\s)(.+?)(?<!\s)\*\*|\*(?![\s*])([^*]+?)(?<!\s)\*|\^([^\s^]+)\^/g;

export function parseInline(source: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of source.matchAll(MARKUP)) {
    const index = match.index ?? 0;
    if (index > last)
      segments.push({ text: source.slice(last, index), style: "plain" });
    if (match[1] !== undefined)
      segments.push({ text: match[1], style: "bold" });
    else if (match[2] !== undefined)
      segments.push({ text: match[2], style: "italic" });
    else segments.push({ text: match[3], style: "sup" });
    last = index + match[0].length;
  }
  if (last < source.length)
    segments.push({ text: source.slice(last), style: "plain" });
  return segments;
}

/** The text without its markup, as a CV parser reads it. */
export const plainText = (source: string) =>
  parseInline(source)
    .map((segment) => segment.text)
    .join("");
