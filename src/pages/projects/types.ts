import type { Tags } from "@/lib/tags";

export type Tag = (typeof Tags)[keyof typeof Tags];

/** Picture of public/img with the translation key of its description. */
export type ProjectImage = { src: string; alt: string };

/** A bullet is a translation key, or a [bold label, text] pair of keys. */
export type Bullet = string | [label: string, text: string];

export type Block =
  | {
      kind: "section";
      /** Translation keys. */
      title: string;
      text?: string;
      bullets?: Bullet[];
      image?: ProjectImage;
    }
  | { kind: "text"; text: string }
  | { kind: "list"; title?: string; bullets: Bullet[]; plain?: boolean }
  | {
      kind: "link";
      /** External address, or route of this site when it starts with "/". */
      href: string;
      /** Translation key of the sentence before the link. */
      prefix?: string;
      label: string;
    };

export type Project = {
  id: string;
  /** Translation key. */
  title: string;
  start: Date;
  end: Date;
  tags: Tag[];
  blocks: Block[];
};
