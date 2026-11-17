import { Tags } from "@/lib/tags";
import type { Block, Bullet, Project } from "./types";

const ROOT = "portfolio.passion.projects";

const section = (
  base: string,
  title: string,
  text: string,
  image?: [src: string, alt: string],
): Block => ({
  kind: "section",
  title: `${base}.${title}`,
  text: `${base}.${text}`,
  image: image && { src: `passions/${image[0]}`, alt: `${base}.${image[1]}` },
});

const skills = (base: string, names: string[]): Block => ({
  kind: "list",
  title: `${base}.skills_title`,
  bullets: names.map((name): Bullet => `${base}.skills_list.${name}`),
});

function project(
  id: string,
  start: [number, number, number],
  end: [number, number, number],
  tags: Project["tags"],
  blocks: (base: string) => Block[],
): Project {
  const base = `${ROOT}.${id}`;
  return {
    id,
    title: `${base}.title`,
    start: new Date(...start),
    end: new Date(...end),
    tags,
    blocks: blocks(base),
  };
}

// Months start at 0, as in the Date constructor.
const projects: Project[] = [
  project(
    "firstgamejam",
    [2024, 7, 26],
    [2024, 9, 11],
    [Tags.VIDEOGAME, Tags.WEB, Tags.TWODIMENSIONAL, Tags.SHOOTER],
    (b) => [
      section(b, "title1", "text1", ["firstgamejam.gif", "alt1"]),
      section(b, "title2", "text2", ["firstgamejamresult.png", "alt2"]),
      {
        kind: "link",
        href: "https://grotacam.itch.io/thelegendofknardwizight",
        label: `${b}.play_link`,
      },
      skills(b, ["godot", "physics", "sprites", "time"]),
    ],
  ),
  project(
    "matrices",
    [2026, 1, 26],
    [2026, 1, 28],
    [Tags.WEB, Tags.MATRIX],
    (b) => [
      { kind: "text", text: `${b}.text` },
      { kind: "link", href: "/matrix", label: `${b}.link` },
    ],
  ),
  project(
    "first3dplatformer",
    [2024, 7, 6],
    [2024, 7, 14],
    [Tags.VIDEOGAME, Tags.PLATFORMER, Tags.THREEDIMENSIONAL],
    (b) => [
      section(b, "learn_godot_title", "learn_godot_text", [
        "platformer.png",
        "img_alt",
      ]),
      section(b, "gameplay_elements_title", "gameplay_elements_text"),
      skills(b, ["godot", "physics", "game_design", "mesh_creation"]),
    ],
  ),
  project(
    "mazegenerator",
    [2023, 8, 24],
    [2023, 8, 28],
    [Tags.JAVA, Tags.TWODIMENSIONAL, Tags.MAZES],
    (b) => [
      section(b, "title1", "text1", ["laby.png", "alt1"]),
      section(b, "title2", "text2"),
      skills(b, ["algo", "javafx"]),
    ],
  ),
  project(
    "minigames",
    [2023, 8, 3],
    [2023, 11, 27],
    [Tags.VIDEOGAME, Tags.JAVA, Tags.TWODIMENSIONAL, Tags.ARCADE],
    (b) => [
      section(b, "title1", "text1", ["pong.png", "alt1"]),
      section(b, "title2", "text2", ["casseBrique.png", "alt2"]),
      skills(b, ["timer", "gameloop"]),
    ],
  ),
  project("miscellaneous", [2004, 0, 15], [2073, 3, 21], [], (b) => [
    { kind: "list", bullets: [`${b}.list`], plain: true },
    { kind: "text", text: `${b}.text` },
  ]),
];

export default projects;
