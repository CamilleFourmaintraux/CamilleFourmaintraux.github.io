import type { ChatTurn } from "./chatApi";

export type Rating = "up" | "down";

export type Message = {
  isFromUser: boolean;
  text: string;
  fullText?: string;
  streaming?: boolean;
  isError?: boolean;
  provider?: string;
  rating?: Rating;
};

export type SavedConversation = {
  messages: Message[];
  history: ChatTurn[];
  loggedSignature: string;
};

const STORAGE_KEY = "camillegpt-conversation-v1";

const EMPTY: SavedConversation = {
  messages: [],
  history: [],
  loggedSignature: "",
};

// Storage may be unavailable (private mode): the chat works without it.
export function loadConversation(): SavedConversation {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw) as Partial<SavedConversation>;
    if (!Array.isArray(data.messages) || !Array.isArray(data.history)) {
      return EMPTY;
    }
    return {
      messages: data.messages.map((m) => ({
        ...m,
        text: m.fullText ?? m.text,
        streaming: false,
      })),
      history: data.history,
      loggedSignature:
        typeof data.loggedSignature === "string" ? data.loggedSignature : "",
    };
  } catch {
    return EMPTY;
  }
}

export function saveConversation(conversation: SavedConversation): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...conversation,
        messages: conversation.messages.map((m) => ({
          ...m,
          text: m.fullText ?? m.text,
          streaming: false,
        })),
      }),
    );
  } catch {
    // Persistence is optional.
  }
}

export function clearConversation(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Persistence is optional.
  }
}
