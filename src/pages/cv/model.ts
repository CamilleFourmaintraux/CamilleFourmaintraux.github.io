// Data model of the CV generator. The same document drives the live preview
// and the LaTeX source, so both always show the same content.

export type Column = "main" | "side";
export type CvLanguage = "fr" | "en";

/** A line of text. Supports **bold**, *italic* and ^superscript^. */
export type Item = { id: string; text: string };

export type IconKey =
  | "phone"
  | "email"
  | "website"
  | "linkedin"
  | "github"
  | "gitlab"
  | "address"
  | "link"
  | "youtube"
  | "discord"
  | "calendar"
  | "car"
  | "language"
  | "user";

export type ContactLine = {
  id: string;
  icon: IconKey;
  /** Read by CV parsers in place of the icon ("Téléphone", "LinkedIn"...). */
  label: string;
  /** Shown text. Several lines are allowed (address). */
  value: string;
  /** Optional link. Empty on an email line: a mailto link is made from the value. */
  href: string;
};

export type Entry = {
  id: string;
  /** Bold start of the line: job and dates, project name, year... */
  title: string;
  /** Plain text after the title. */
  text: string;
  /** Shown in italics, between parentheses, after the title. */
  tools: string;
  /** Italic line under the title. */
  subtitle: string;
  details: Item[];
};

/** Decides the labels of the entry fields in the form. */
export type EntryVariant = "experience" | "projects" | "education" | "generic";

type SectionBase = {
  id: string;
  title: string;
  column: Column;
  visible: boolean;
};

export type TextSection = SectionBase & { kind: "text"; body: string };

export type EntriesSection = SectionBase & {
  kind: "entries";
  variant: EntryVariant;
  numbered: boolean;
  entries: Entry[];
};

export type SkillGroup = { id: string; name: string; items: string };

export type SkillsSection = SectionBase & {
  kind: "skills";
  groups: SkillGroup[];
};

/** Short items written one after the other, separated by commas. */
export type ListSection = SectionBase & { kind: "list"; items: Item[] };

export type ContactSection = SectionBase & {
  kind: "contact";
  lines: ContactLine[];
};

export type PortfolioSection = SectionBase & {
  kind: "portfolio";
  description: string;
  url: string;
  qr: boolean;
};

export type Section =
  | TextSection
  | EntriesSection
  | SkillsSection
  | ListSection
  | ContactSection
  | PortfolioSection;

export type SectionKind = Section["kind"];

export type PhotoShape = "round" | "square";

export type Photo = {
  /** Picture as a JPEG data URL, at most 1200 px wide. */
  source: string;
  shape: PhotoShape;
  /** 1 shows the largest square that fits, 3 a three times closer view. */
  zoom: number;
  /** Position of the visible square, from 0 (left, top) to 1 (right, bottom). */
  x: number;
  y: number;
};

export type CvDocument = {
  version: 1;
  language: CvLanguage;
  name: string;
  headline: string;
  layout: {
    sidebar: "left" | "right";
    /** Width of the sidebar, in percent of the text width. */
    sidebarWidth: number;
    sidebarColor: string;
    accentColor: string;
  };
  photo: Photo | null;
  sections: Section[];
};

export const SIDEBAR_WIDTH = { min: 22, max: 45 };

let counter = 0;
/** Identifier stable for the life of an item, used as React key and anchor. */
export function uid(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const item = (text = ""): Item => ({ id: uid(), text });

export function entry(
  fields: Partial<Omit<Entry, "id" | "details">> & { details?: string[] } = {},
): Entry {
  return {
    id: uid(),
    title: fields.title ?? "",
    text: fields.text ?? "",
    tools: fields.tools ?? "",
    subtitle: fields.subtitle ?? "",
    details: (fields.details ?? []).map((text) => item(text)),
  };
}

export const contactLine = (
  icon: IconKey,
  label: string,
  value = "",
  href = "",
): ContactLine => ({ id: uid(), icon, label, value, href });

export const skillGroup = (name = "", items = ""): SkillGroup => ({
  id: uid(),
  name,
  items,
});

/** Default contact label of each icon, in each CV language. */
export const ICON_LABELS: Record<IconKey, Record<CvLanguage, string>> = {
  phone: { fr: "Téléphone", en: "Phone" },
  email: { fr: "E-mail", en: "Email" },
  website: { fr: "Site web", en: "Website" },
  linkedin: { fr: "LinkedIn", en: "LinkedIn" },
  github: { fr: "GitHub", en: "GitHub" },
  gitlab: { fr: "GitLab", en: "GitLab" },
  address: { fr: "Adresse", en: "Address" },
  link: { fr: "Lien", en: "Link" },
  youtube: { fr: "YouTube", en: "YouTube" },
  discord: { fr: "Discord", en: "Discord" },
  calendar: { fr: "Date de naissance", en: "Date of birth" },
  car: { fr: "Permis", en: "Driving licence" },
  language: { fr: "Langues", en: "Languages" },
  user: { fr: "Profil", en: "Profile" },
};

export const ICON_KEYS = Object.keys(ICON_LABELS) as IconKey[];

/** A new, empty section of the given kind. */
export function newSection(
  kind: SectionKind,
  title: string,
  column: Column,
): Section {
  const base = { id: uid(), title, column, visible: true };
  switch (kind) {
    case "text":
      return { ...base, kind, body: "" };
    case "entries":
      return {
        ...base,
        kind,
        variant: "generic",
        numbered: false,
        entries: [entry()],
      };
    case "skills":
      return { ...base, kind, groups: [skillGroup()] };
    case "list":
      return { ...base, kind, items: [item()] };
    case "contact":
      return { ...base, kind, lines: [contactLine("link", "")] };
    case "portfolio":
      return { ...base, kind, description: "", url: "", qr: true };
  }
}
