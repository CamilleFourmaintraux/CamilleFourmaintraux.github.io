import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";
import {
  faFileExport,
  faFileImport,
  faRotateLeft,
  faScroll,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "@/ui/Icon";
import Page from "@/ui/Page";
import { content } from "./text/content";
import { newGame, play } from "./text/engine/game";
import { render } from "./text/engine/lang";
import { deserialize, serialize } from "./text/engine/save";
import { period, periodHalf, weekday } from "./text/engine/time";
import { nameKey, placeOf, type Game } from "./text/engine/world";
import type { Lang, Turn } from "./text/engine/types";

const STORAGE_KEY = "text-adventure";
// Automatic saves rotate on this many slots, so that a dead end never
// locks the whole game: the player can always go back a little.
const AUTO_SLOTS = 3;
const HISTORY_LIMIT = 50;

interface Slot {
  save: string;
  /** Game clock and place, for the label. */
  t: number;
  place: string;
}

interface Stored {
  current?: string;
  autos: Slot[];
}

function readStorage(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Stored) : undefined;
    if (parsed && Array.isArray(parsed.autos)) return parsed;
  } catch {
    // Private browsing or a broken entry: start fresh.
  }
  return { autos: [] };
}

function writeStorage(stored: Stored) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage full or disabled: the game goes on without saving.
  }
}

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

function startGame(): Game {
  const stored = readStorage();
  if (stored.current) {
    try {
      return deserialize(content, stored.current);
    } catch {
      // An unreadable save: a new game rather than a broken page.
    }
  }
  return newGame(content, randomSeed());
}

function slotOf(g: Game): Slot {
  return {
    save: serialize(g),
    t: g.st.clock,
    place: nameKey(g, placeOf(g, g.st.player)),
  };
}

export default function TextAdventure() {
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language.startsWith("en") ? "en" : "fr";
  const L = content.langs[lang];

  const gameRef = useRef<Game | null>(null);
  const [journal, setJournal] = useState<Turn[]>([]);
  const [autos, setAutos] = useState<Slot[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const [confirmNew, setConfirmNew] = useState(false);
  const [chosen, setChosen] = useState(0);
  const history = useRef<string[]>([]);
  const historyAt = useRef(-1);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Loading happens once, on the first visit of the page.
  useEffect(() => {
    const g = startGame();
    gameRef.current = g;
    setJournal([...g.st.journal]);
    setAutos(readStorage().autos);
  }, []);

  // The newest lines stay in view.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [journal]);

  useEffect(() => {
    if (!confirmNew) return;
    const timer = window.setTimeout(() => setConfirmNew(false), 5000);
    return () => window.clearTimeout(timer);
  }, [confirmNew]);

  function persist(g: Game, autosave: boolean) {
    const stored = readStorage();
    stored.current = serialize(g);
    if (autosave)
      stored.autos = [slotOf(g), ...stored.autos].slice(0, AUTO_SLOTS);
    writeStorage(stored);
    setAutos(stored.autos);
  }

  function replace(g: Game, message: string) {
    gameRef.current = g;
    persist(g, false);
    setJournal([...g.st.journal]);
    setStatus(message);
    inputRef.current?.focus();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const g = gameRef.current;
    if (!g) return;
    const text = input.trim();
    const { placeChanged } = play(g, lang, text);
    if (text) {
      history.current = [
        text,
        ...history.current.filter((h) => h !== text),
      ].slice(0, HISTORY_LIMIT);
    }
    historyAt.current = -1;
    setInput("");
    persist(g, placeChanged);
    setJournal([...g.st.journal]);
  }

  // Up and down bring back earlier commands, like a terminal.
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const list = history.current;
    const next =
      event.key === "ArrowUp"
        ? Math.min(historyAt.current + 1, list.length - 1)
        : Math.max(historyAt.current - 1, -1);
    historyAt.current = next;
    setInput(next >= 0 ? list[next] : "");
  }

  function restart() {
    if (!confirmNew) return setConfirmNew(true);
    setConfirmNew(false);
    replace(newGame(content, randomSeed()), t("textgame.started"));
  }

  function loadSlot() {
    const slot = autos[chosen];
    if (!slot) return;
    try {
      replace(deserialize(content, slot.save), t("textgame.loaded"));
    } catch {
      setStatus(t("textgame.importError"));
    }
  }

  function exportGame() {
    const g = gameRef.current;
    if (!g) return;
    const blob = new Blob([serialize(g)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), {
      href: url,
      download: "aventure-textuelle.json",
    });
    link.click();
    URL.revokeObjectURL(url);
    setStatus(t("textgame.exported"));
  }

  async function importGame(file: File | undefined) {
    if (!file) return;
    try {
      replace(deserialize(content, await file.text()), t("textgame.loaded"));
    } catch {
      setStatus(t("textgame.importError"));
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const slotLabel = (slot: Slot) =>
    render(L, {
      k: "slot.label",
      p: {
        day: { k: `weekday.${weekday(slot.t)}` },
        when: { k: `when.${period(slot.t)}.${periodHalf(slot.t)}` },
        place: { n: slot.place },
      },
    });

  return (
    <Page
      title={t("textgame.title")}
      icon={faScroll}
      lead={<p>{t("textgame.lead")}</p>}
    >
      <div className="tg">
        <div
          className="tg-screen"
          lang={lang}
          onClick={() =>
            window.getSelection()?.isCollapsed && inputRef.current?.focus()
          }
        >
          <div
            ref={logRef}
            className="tg-log"
            role="log"
            aria-live="polite"
            aria-label={t("textgame.logLabel")}
            tabIndex={0}
          >
            {journal.map((turn, i) => (
              <div key={i} className="tg-turn">
                {turn.in && <p className="tg-in">&gt; {turn.in}</p>}
                {turn.out.map((msg, j) => (
                  <p
                    key={j}
                    className={msg.k === "place.title" ? "tg-title" : undefined}
                  >
                    {render(L, msg)}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <form className="tg-form" onSubmit={submit}>
            <label htmlFor="tg-input" className="sr-only">
              {t("textgame.inputLabel")}
            </label>
            <span className="tg-prompt" aria-hidden="true">
              &gt;
            </span>
            <input
              ref={inputRef}
              id="tg-input"
              className="tg-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t("textgame.placeholder")}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={200}
              aria-describedby="tg-hint"
            />
            <button type="submit" className="tg-send">
              {t("textgame.send")}
            </button>
          </form>
        </div>
        <p className="tg-hint" id="tg-hint">
          {t("textgame.hint")}
        </p>

        <div className="tg-tools">
          <button
            type="button"
            className={`button${confirmNew ? " button-primary" : ""}`}
            onClick={restart}
          >
            <Icon icon={faRotateLeft} />{" "}
            {confirmNew ? t("textgame.newConfirm") : t("textgame.newGame")}
          </button>
          {autos.length > 0 && (
            <div className="tg-load">
              <label htmlFor="tg-slot">{t("textgame.autosaves")}</label>
              <select
                id="tg-slot"
                value={chosen}
                onChange={(event) => setChosen(Number(event.target.value))}
              >
                {autos.map((slot, i) => (
                  <option key={i} value={i}>
                    {slotLabel(slot)}
                  </option>
                ))}
              </select>
              <button type="button" className="button" onClick={loadSlot}>
                <Icon icon={faUpload} /> {t("textgame.load")}
              </button>
            </div>
          )}
          <button type="button" className="button" onClick={exportGame}>
            <Icon icon={faFileExport} /> {t("textgame.export")}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => fileRef.current?.click()}
          >
            <Icon icon={faFileImport} /> {t("textgame.import")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => void importGame(event.target.files?.[0])}
          />
        </div>
        <p className="tg-status" role="status">
          {status}
        </p>
      </div>
    </Page>
  );
}
