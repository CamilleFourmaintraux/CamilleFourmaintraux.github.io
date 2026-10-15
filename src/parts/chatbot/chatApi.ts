import { API_URL } from "../../Utils";

/** One entry of the conversation memory, in the format the LLM API expects. */
export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ChatRequest = {
  message: string;
  history: ChatTurn[];
  /** Language the website is displayed in, used when the visitor's is unclear. */
  lang: string;
};

export type ChatResult = { provider?: string; truncated: boolean };

export type ChatErrorKind = "rate-limit" | "unavailable" | "network";

export class ChatError extends Error {
  readonly kind: ChatErrorKind;
  constructor(kind: ChatErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

type StreamEvent =
  | { type: "start"; provider: string }
  | { type: "delta"; text: string }
  | { type: "done"; provider: string; truncated: boolean }
  | { type: "error"; error: string };

/**
 * Sends a message to the back-end and streams the answer.
 * onDelta is called with each piece of text as soon as it arrives.
 * Rejects with a ChatError if no answer could be obtained at all.
 */
export async function streamChat(
  request: ChatRequest,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<ChatResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, stream: true }),
      signal,
    });
  } catch (err) {
    throw new ChatError("network", String(err));
  }

  if (res.status === 429)
    throw new ChatError("rate-limit", "Too many messages");
  if (!res.ok) throw new ChatError("unavailable", `HTTP ${res.status}`);

  // Older back-ends answer with plain JSON: { reply }.
  const contentType = res.headers.get("Content-Type") ?? "";
  if (!contentType.includes("ndjson") || !res.body) {
    const data = await res.json().catch(() => ({}));
    if (typeof data.reply !== "string" || !data.reply) {
      throw new ChatError("unavailable", "Empty reply");
    }
    onDelta(data.reply);
    return { provider: data.provider, truncated: Boolean(data.truncated) };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let provider: string | undefined;
  let receivedText = false;

  const handle = (event: StreamEvent): ChatResult | null => {
    switch (event.type) {
      case "start":
        provider = event.provider;
        return null;
      case "delta":
        receivedText = true;
        onDelta(event.text);
        return null;
      case "done":
        return { provider: event.provider, truncated: event.truncated };
      case "error":
        return { provider, truncated: true };
    }
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const result = handle(JSON.parse(line) as StreamEvent);
        if (result) return result;
      }
    }
  } catch (err) {
    if (!receivedText) throw new ChatError("network", String(err));
  }

  // The stream stopped without a "done" event (connection lost).
  if (!receivedText) throw new ChatError("unavailable", "Empty reply");
  onDelta("…");
  return { provider, truncated: true };
}
