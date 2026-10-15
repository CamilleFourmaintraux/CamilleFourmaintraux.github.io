import type { ChatTurn } from "./chatApi";

export type Rating = "up" | "down";

export type Message = {
  isFromUser: boolean;
  /** Text currently displayed (grows during the typing animation). */
  text: string;
  /** Complete text received so far (bot messages only). */
  fullText?: string;
  /** True while the answer is still being streamed. */
  streaming?: boolean;
  /** Error messages are not rated, remembered or sent back to the bot. */
  isError?: boolean;
  /** Which LLM provider answered (useful when reading the logs). */
  provider?: string;
  rating?: Rating;
};

export type SavedConversation = {
  messages: Message[];
  history: ChatTurn[];
  /** Transcript already emailed, to avoid sending the same one twice. */
  loggedSignature: string;
};

const STORAGE_KEY = "camillegpt-conversation-v1";

const EMPTY: SavedConversation = {
  messages: [],
  history: [],
  loggedSignature: "",
};

/**
 * Restores the conversation of the current browser tab. sessionStorage is
 * cleared when the tab is closed, so a new visit starts a new conversation.
 * Storage can be unavailable (private mode, blocked cookies): every access
 * is guarded and the chat simply works without persistence.
 */
export function loadConversation(): SavedConversation {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw) as Partial<SavedConversation>;
    if (!Array.isArray(data.messages) || !Array.isArray(data.history)) {
      return EMPTY;
    }
    return {
      // Finish any animation that was interrupted when leaving the page.
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
    // Storage full or unavailable: persistence is a convenience only.
  }
}

export function clearConversation(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore, see loadConversation.
  }
}
