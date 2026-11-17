import { faMemory, faMicrochip } from "@fortawesome/free-solid-svg-icons";
import { GITHUB_URL } from "@/lib/links";
import { Tags } from "@/lib/tags";
import type { Block, Bullet, Project } from "./types";

const ROOT = "portfolio.work.saes";

const keys = (base: string, names: string[]): Bullet[] =>
  names.map((name) => `${base}.${name}`);

const pairs = (base: string, names: string[]): Bullet[] =>
  names.map((name) => [`${base}.${name}`, `${base}.${name}_text`]);

const section = (
  base: string,
  title: string,
  text: string,
  image?: [src: string, alt: string],
): Block => ({
  kind: "section",
  title: `${base}.${title}`,
  text: `${base}.${text}`,
  image: image && { src: `portfolio/${image[0]}`, alt: `${base}.${image[1]}` },
});

const skills = (bullets: Bullet[]): Block => ({
  kind: "list",
  title: `${ROOT}.skills`,
  bullets,
});

const knowHow = (bullets: Bullet[]): Block => ({
  kind: "list",
  title: `${ROOT}.know_how`,
  bullets,
});

const repository = (href: string): Block => ({
  kind: "link",
  href,
  prefix: `${ROOT}.linkText`,
  label: `${ROOT}.link`,
});

const internship: Block[] = [
  {
    kind: "link",
    href: "/cursus#experiences",
    label: `${ROOT}.internship1.text`,
  },
];

function project(
  id: string,
  key: string,
  start: [number, number, number],
  end: [number, number, number],
  tags: Project["tags"],
  blocks: (base: string) => Block[],
): Project {
  const base = `${ROOT}.${key}`;
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
  {
    ...project(
      "morse_stm32",
      "morse_stm32",
      [2025, 10, 1],
      [2025, 11, 19],
      [Tags.SYSTEMS, Tags.HARDWARE, Tags.C],
      (b) => [
        section(b, "presentation", "presentationDescription"),
        {
          kind: "list",
          title: `${b}.modes`,
          bullets: pairs(b, ["mode1", "mode2"]),
        },
        { kind: "video", videoId: "HpIkzpsNZ2k", title: `${b}.demo` },
        skills(keys(b, ["skill1", "skill2", "skill3", "skill4"])),
      ],
    ),
    icon: faMicrochip,
  },
  {
    ...project(
      "memory_allocator",
      "memory_allocator",
      [2025, 10, 1],
      [2025, 11, 19],
      [Tags.C],
      (b) => [
        section(b, "presentation", "presentationDescription"),
        skills(keys(b, ["skill1", "skill2", "skill3"])),
      ],
    ),
    icon: faMemory,
  },
  project(
    "2d_game_engine",
    "2d_game_engine",
    [2026, 6, 1],
    [2026, 7, 30],
    [Tags.JAVA, Tags.VIDEOGAME, Tags.TWODIMENSIONAL, Tags.ARCADE, Tags.MAZES],
    (b) => [
      section(b, "presentation", "presentationDescription", [
        "illustration_game_engine.png",
        "alt1",
      ]),
      section(b, "section", "section_text"),
      skills(keys(b, ["skill1", "skill2", "skill3"])),
      repository(GITHUB_URL),
    ],
  ),
  project(
    "mnia-env",
    "mnia-env",
    [2025, 11, 1],
    [2026, 4, 30],
    [Tags.AI, Tags.RL, Tags.JAVA],
    (b) => [
      section(b, "presentation", "presentationDescription", [
        "illustration_mnia_project.png",
        "alt1",
      ]),
      section(b, "section", "section_text"),
      skills(keys(b, ["skill1", "skill2", "skill3"])),
      repository(GITHUB_URL),
    ],
  ),
  project(
    "pagil2",
    "pagil2",
    [2025, 2, 3],
    [2025, 2, 7],
    [
      Tags.SCRUM,
      Tags.WEB,
      Tags.FRONTEND,
      Tags.JSTS,
      Tags.REACT,
      Tags.BACKEND,
      Tags.SPRING,
      Tags.APIREST,
      Tags.DB,
      Tags.JAVA,
    ],
    (b) => [
      section(b, "presentation", "presentationDescription", [
        "codeSwipe.gif",
        "alt1",
      ]),
      section(b, "role", "roleDescription", ["tabScrum2.jpg", "alt2"]),
      knowHow(keys(b, ["know_how1", "know_how2", "know_how3"])),
      repository(`${GITHUB_URL}/projet-agile`),
    ],
  ),
  project(
    "stage2025portfolio",
    "internship2",
    [2025, 2, 10],
    [2025, 5, 27],
    [Tags.INTERNSHIP, Tags.BACKEND, Tags.INTEGRATION, Tags.DB],
    () => internship,
  ),
  project(
    "stage2024portfolio",
    "internship1",
    [2024, 3, 15],
    [2024, 5, 21],
    [Tags.INTERNSHIP, Tags.BACKEND, Tags.INTEGRATION, Tags.DB],
    () => internship,
  ),
  project(
    "sae509",
    "sae509",
    [2024, 8, 19],
    [2025, 1, 24],
    [
      Tags.WEB,
      Tags.BACKEND,
      Tags.APIREST,
      Tags.DB,
      Tags.SPRING,
      Tags.JAVA,
      Tags.FRONTEND,
      Tags.JSP,
    ],
    (b) => [
      section(b, "presentation", "presentationDescription", [
        "saeProfile.png",
        "alt1",
      ]),
      section(b, "spring_framework", "spring_description", [
        "saeCalendrier.png",
        "alt2",
      ]),
      skills(keys(b, ["skill1", "skill2", "skill3", "skill4"])),
      repository(`${GITHUB_URL}/plateforme_covoiturage`),
    ],
  ),
  project(
    "sae501",
    "sae501",
    [2024, 8, 17],
    [2025, 1, 9],
    [Tags.SYSTEMS, Tags.C],
    (b) => [
      section(b, "presentation", "presentationDescription", [
        "riscV_encodage.png",
        "alt1",
      ]),
      section(b, "programming", "programmingDescription", [
        "riscV_codeExample.png",
        "alt2",
      ]),
      skills(keys(b, ["skill1", "skill2", "skill3"])),
    ],
  ),
  project(
    "sae402",
    "sae402",
    [2024, 1, 19],
    [2024, 2, 22],
    [Tags.VIDEOGAME, Tags.JSTS],
    (b) => [
      section(b, "presentation", "presentationDescription", [
        "versionBasique.gif",
        "alt1",
      ]),
      section(b, "multiplayer", "multiplayer_description", [
        "versionFinale.gif",
        "alt2",
      ]),
      skills(pairs(b, ["skill1", "skill2", "skill3", "skill4"])),
      knowHow(pairs(b, ["know_how1", "know_how2", "know_how3"])),
    ],
  ),
  project(
    "sae401",
    "sae401",
    [2024, 1, 5],
    [2024, 2, 18],
    [Tags.BACKEND, Tags.APIREST, Tags.DB, Tags.SPRING, Tags.JAVA, Tags.JSP],
    (b) => [
      {
        kind: "section",
        title: `${b}.presentation`,
        text: `${b}.presentationDescription`,
        bullets: [
          [`${b}.ingredients_table`, `${b}.ingredients_table_values`],
          [`${b}.pizza_table`, `${b}.pizza_table_value`],
          [`${b}.orders_table`, `${b}.orders_table_value`],
        ],
        image: { src: "portfolio/siteWebRestRequests.png", alt: `${b}.alt1` },
      },
      section(b, "security", "security_description", [
        "jwt-primer-token.png",
        "alt2",
      ]),
      skills(pairs(b, ["skill1", "skill2"])),
      knowHow(pairs(b, ["know_how1", "know_how2"])),
    ],
  ),
  project(
    "sae302",
    "sae302",
    [2023, 9, 2],
    [2023, 11, 4],
    [Tags.VIDEOGAME, Tags.JAVA],
    (b) => [
      section(b, "presentation", "presentationDescription", [
        "monsterhunt.png",
        "alt1",
      ]),
      section(b, "testing", "testingDescription", [
        "monsterhunt_tests.png",
        "alt2",
      ]),
      skills(keys(b, ["skill1", "skill2", "skill3"])),
      repository(`${GITHUB_URL}/plateforme_covoiturage`),
    ],
  ),
  project(
    "pagil1",
    "pagil1",
    [2023, 8, 1],
    [2023, 8, 5],
    [Tags.SCRUM, Tags.VIDEOGAME, Tags.JAVA],
    (b) => [
      section(b, "title1", "text1", ["dino.png", "alt1"]),
      section(b, "title2", "text2", ["tabScrum.jpg", "alt2"]),
      knowHow(keys(b, ["know_how1", "know_how2", "know_how3"])),
      repository(`${GITHUB_URL}/projet-agile`),
    ],
  ),
  project(
    "sae213",
    "sae213",
    [2023, 3, 24],
    [2023, 5, 19],
    [Tags.SCRUM, Tags.VIDEOGAME],
    (b) => [
      section(b, "presentation", "presentationDescription", [
        "trello.png",
        "alt1",
      ]),
      {
        kind: "section",
        title: "",
        text: `${b}.text1`,
        image: { src: "portfolio/escapeGame.png", alt: `${b}.alt2` },
      },
      { kind: "text", text: `${b}.text2` },
      skills(keys(b, ["skill1", "skill2", "skill3"])),
      {
        kind: "link",
        href: "https://view.genial.ly/63fcd8e96301550018245567/interactive-content-mysteres-et-disparitions-a-la-rentree-de-liut-avec-meilleur-timer",
        label: `${b}.escapeGameLink`,
      },
    ],
  ),
  project("sae207", "sae207", [2023, 1, 28], [2023, 3, 24], [Tags.DB], (b) => [
    section(b, "presentation", "presentationDescription", [
      "donnes.png",
      "alt1",
    ]),
    section(b, "postgresql", "postgresql_text", ["scriptSQL.png", "alt2"]),
    skills(keys(b, ["skill1", "skill2", "skill3"])),
    repository(`${GITHUB_URL}/plateforme_covoiturage`),
  ]),
  project(
    "sae202",
    "sae202",
    [2023, 0, 30],
    [2023, 2, 31],
    [Tags.JAVA],
    (b) => [
      section(b, "presentation", "presentationDescription", [
        "sae_IHM_code.png",
        "alt1",
      ]),
      section(b, "interface", "interface_description", ["saeIHM.png", "alt2"]),
      skills(keys(b, ["skill1", "skill2", "skill3"])),
      repository(`${GITHUB_URL}/plateforme_covoiturage`),
    ],
  ),
  project("sae105", "sae105", [2022, 8, 24], [2022, 11, 9], [Tags.WEB], (b) => [
    section(b, "presentation", "presentationDescription", [
      "siteWeb.png",
      "alt1",
    ]),
    section(b, "wordpress", "wordpress_text"),
    skills(keys(b, ["skill1", "skill2", "skill3"])),
    repository(`${GITHUB_URL}/plateforme_covoiturage`),
  ]),
  project(
    "sae103",
    "sae103",
    [2022, 8, 12],
    [2022, 9, 21],
    [Tags.SYSTEMS, Tags.C],
    (b) => [
      section(b, "presentation", "presentationDescription", [
        "reseau.png",
        "alt1",
      ]),
      section(b, "machine_install", "machine_install_text"),
      skills(keys(b, ["skill1", "skill2", "skill3"])),
      repository(`${GITHUB_URL}/sae1.3-2.3`),
    ],
  ),
];

export default projects;
