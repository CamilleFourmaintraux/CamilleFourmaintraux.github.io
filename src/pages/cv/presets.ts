// Starting points of the CV generator. The French and English presets give
// back the generic CVs of Camille Fourmaintraux.
import {
  contactLine,
  entry,
  item,
  skillGroup,
  uid,
  type CvDocument,
  type CvLanguage,
  type Photo,
  type Section,
} from "./model";

export type PresetKey = "generic-fr" | "generic-en" | "blank";

export const PRESETS: PresetKey[] = ["generic-fr", "generic-en", "blank"];

/** Picture used by the presets that show a photo. */
export const PORTRAIT_URL = "/img/header/me_green.jpg";
export const PORTRAIT_FRAMING: Omit<Photo, "source"> = {
  shape: "round",
  zoom: 1.12,
  x: 0.38,
  y: 0.38,
};

const LAYOUT: CvDocument["layout"] = {
  sidebar: "right",
  sidebarWidth: 30,
  sidebarColor: "#e8ffd2",
  accentColor: "#336450",
};

const base = (title: string, column: Section["column"]) => ({
  id: uid(),
  title,
  column,
  visible: true,
});

function genericFr(): CvDocument {
  const portfolio =
    "https://camillefourmaintraux.github.io/?src=basic_cv_fr#/home";
  return {
    version: 1,
    language: "fr",
    name: "Camille Fourmaintraux",
    headline: "Candidature pour un stage en développement applicatif",
    layout: { ...LAYOUT },
    photo: null,
    sections: [
      {
        ...base("Profil", "main"),
        kind: "text",
        body: "Étudiant ingénieur en quatrième année d'informatique à Polytech Grenoble (Université Grenoble Alpes) et diplômé d'un *BUT Informatique*. Lors de deux stages dans un cabinet de conseil (six mois au total), j'ai fait évoluer un outil utilisé en production par de grands comptes, au plus près de leurs besoins. Ce qui me motive, c'est de comprendre les besoins de ceux qui utiliseront un outil, puis de concevoir une solution claire qui leur simplifie vraiment le quotidien. Je recherche un stage d'au moins seize semaines à partir du 12 avril 2027, de préférence à Grenoble, et je suis mobile partout en France.",
      },
      {
        ...base("Expérience professionnelle", "main"),
        kind: "entries",
        variant: "experience",
        numbered: false,
        entries: [
          entry({
            title:
              "Stagiaire en développement logiciel, E-Mothep (avril à juin 2024 et mars à juin 2025)",
            subtitle:
              "Cabinet de conseil en intégration SOA (webMethods), clients : Decathlon, GIFI…",
            details: [
              "Repris pour un second stage après un premier stage réussi (26 semaines au total)",
              "Maintenance corrective et évolutive d'AMAT, un outil en production qui surveille les environnements webMethods des clients et signale les anomalies",
              "Création d'une API REST permettant aux clients de mettre à jour leurs référentiels de surveillance, avec de très bons retours clients",
              "Ajout de modules de surveillance (alertes d'expiration des licences, paramètres serveur) et automatisation de la création des référentiels",
              "Refonte de l'interface web (formulaires dynamiques, accessibilité)",
              "Regroupement de documents éparpillés en une documentation technique centrale",
            ],
          }),
          entry({
            title: "Tuteur, Université de Lille (octobre 2024 à février 2025)",
            details: [
              "Soutien aux étudiants de 1^re^ année en mathématiques, programmation et SQL",
            ],
          }),
          entry({
            title:
              "Employé polyvalent, Carrefour Contact (juillet à août 2022)",
          }),
        ],
      },
      {
        ...base("Projets", "main"),
        kind: "entries",
        variant: "projects",
        numbered: true,
        entries: [
          entry({
            title: "CodeSwipe, application web full-stack",
            tools: "Java, Spring Boot, Spring Security, React",
            details: [
              "Application façon Tinder où l'on swipe des extraits de code au lieu de profils",
              "Développement du back-end (API REST, authentification JWT) et du front-end",
              "Scrum Master d'une équipe de sept (user stories, sprints, burn-down chart, Git)",
            ],
          }),
          entry({
            title: "Site de réservation de rendez-vous",
            tools: "Spring Boot, Spring Security, JPA, React, Tailwind",
            details: [
              "Application web avec gestion des rôles et des droits d'accès (utilisateur, admin)",
              "Conception et développement en binôme, du modèle de données à l'interface",
            ],
          }),
          entry({
            title: "Portfolio numérique, projet personnel",
            tools: "Angular, TypeScript, Node.js, React",
            details: [
              "Réécriture en cours en Angular d'un site bilingue créé à l'origine en React",
              "Back-end Node.js relié à des services tiers (envoi d'e-mails, chatbot IA)",
              "Mise en production, front-end sur GitHub Pages et back-end sur Render",
            ],
          }),
          entry({
            title: "Moteur de jeu 2D",
            tools: "Java, GitLab",
            details: [
              "Moteur de jeu 2D complet développé à six (projet de fin d'année)",
              "Création d'un jeu avec ce moteur pour tester et démontrer ses fonctionnalités",
            ],
          }),
          entry({
            title: "Environnement d'apprentissage par renforcement",
            tools: "Java",
            details: [
              "Conception d'un environnement sur mesure et d'un agent RL simple pour l'évaluer",
            ],
          }),
          entry({
            title: "Jeu multijoueur en temps réel",
            tools: "JavaScript, Node.js, Socket.IO, HTML5 Canvas",
            details: [
              "Jeu complet développé en binôme, du moteur au serveur multijoueur avec salons",
            ],
          }),
        ],
      },
      {
        ...base("Formation", "main"),
        kind: "entries",
        variant: "education",
        numbered: false,
        entries: [
          entry({
            title: "Depuis 2025",
            details: [
              "Diplôme d'ingénieur en informatique, 4^e^ année, Polytech Grenoble",
              "Enseignements : génie logiciel, réseaux informatiques, intelligence artificielle (LLM), architecture matérielle, traitement du signal, méthodes numériques, programmation fonctionnelle (OCaml), preuve formelle (Rocq)",
            ],
          }),
          entry({
            title: "2025 :",
            text: "*BUT Informatique* (Bachelor universitaire de technologie), IUT de Lille",
          }),
          entry({
            title: "2024 :",
            text: "Séjour linguistique d'un mois en école d'anglais, Kaplan International, Londres",
          }),
          entry({
            title: "2022 :",
            text: "Baccalauréat général, mention Bien, Lycée Pierre d'Ailly, Compiègne",
          }),
        ],
      },
      {
        ...base("Contact", "side"),
        kind: "contact",
        lines: [
          contactLine("phone", "Téléphone", "06 65 29 34 36"),
          contactLine(
            "email",
            "E-mail",
            "camille.fourmaintraux@etu.univ-grenoble-alpes.fr",
          ),
          contactLine(
            "website",
            "Portfolio",
            "camillefourmaintraux.github.io",
            portfolio,
          ),
          contactLine(
            "linkedin",
            "LinkedIn",
            "https://www.linkedin.com/in/camille-fourmaintraux-708b34275/",
            "https://www.linkedin.com/in/camille-fourmaintraux-708b34275/",
          ),
          contactLine(
            "address",
            "Adresse",
            "341 Rue des Résidences\n38400 Saint-Martin-d'Hères, France",
          ),
        ],
      },
      {
        ...base("Compétences", "side"),
        kind: "skills",
        groups: [
          skillGroup(
            "Langages de programmation",
            "Java, TypeScript, JavaScript, SQL, HTML/CSS, Python, C",
          ),
          skillGroup(
            "Back-end",
            "Spring Boot, Spring Security, JPA/Hibernate, Java EE (Servlet, JSP), Node.js, Socket.IO",
          ),
          skillGroup(
            "Front-end",
            "Angular, React, Redux, Tailwind CSS, Bootstrap, Vite",
          ),
          skillGroup(
            "Bases de données",
            "SQL, PostgreSQL, MongoDB, Redis, Firebase, DBeaver",
          ),
          skillGroup(
            "API et intégration",
            "REST, SOAP, JWT, webMethods, Software AG Designer, Postman, Bruno",
          ),
          skillGroup(
            "Outils, tests et DevOps",
            "Git, GitHub, GitLab CI/CD, Docker, JUnit, Mantis, Render",
          ),
          skillGroup(
            "Méthodologie",
            "Agile Scrum (Scrum Master sur deux projets, trois projets agiles en tout)",
          ),
          skillGroup(
            "Langues",
            "Français : langue maternelle\nAnglais : niveau avancé (TOEIC C1, 2025)",
          ),
          skillGroup("Autre", "Permis B"),
        ],
      },
      {
        ...base("Qualités", "side"),
        kind: "list",
        items: ["Organisé", "attentif", "curieux", "patient"].map((text) =>
          item(text),
        ),
      },
      {
        ...base("Centres d'intérêt", "side"),
        kind: "list",
        items: [
          "Programmation de jeux vidéo (Godot, game jams)",
          "membre d'un club de jeux de société",
          "randonnée",
          "échecs",
          "casse-têtes et escape games",
        ].map((text) => item(text)),
      },
      {
        ...base("Portfolio", "side"),
        kind: "portfolio",
        description:
          "Mon site présente en détail tous mes projets universitaires, professionnels et personnels.",
        url: portfolio,
        qr: true,
      },
    ],
  };
}

function genericEn(): CvDocument {
  const portfolio =
    "https://camillefourmaintraux.github.io/?src=basic_cv_en_portfolio_website#/home";
  return {
    version: 1,
    language: "en",
    name: "Camille Fourmaintraux",
    headline: "Application for a software development internship",
    layout: { ...LAYOUT },
    photo: null,
    sections: [
      {
        ...base("Profile", "main"),
        kind: "text",
        body: "Fourth-year computer engineering student at Polytech Grenoble (Université Grenoble Alpes), with a *BUT Informatique* (Bachelor's degree in computer science). During two internships at a consulting firm (six months in total), I improved a tool used in production by major clients, staying close to their needs. What drives me is understanding the needs of the people who will use a tool, then designing a clear solution that truly makes their daily work easier. I am looking for an internship of at least sixteen weeks starting on 12 April 2027, preferably in Grenoble, and I am open to relocating anywhere in France.",
      },
      {
        ...base("Work experience", "main"),
        kind: "entries",
        variant: "experience",
        numbered: false,
        entries: [
          entry({
            title:
              "Software development intern, E-Mothep (April to June 2024, March to June 2025)",
            subtitle:
              "SOA integration consulting firm (webMethods), clients include Decathlon, GIFI…",
            details: [
              "Taken back for a second internship after a successful first one (26 weeks in total)",
              "Corrective and evolutive maintenance of AMAT, a production tool that monitors clients' webMethods environments and reports anomalies",
              "Built a REST API letting clients update their monitoring configurations themselves, with very positive client feedback",
              "Added monitoring modules (licence expiry alerts, server settings) and automated the creation of monitoring configurations",
              "Redesigned the web interface (dynamic forms, accessibility)",
              "Gathered scattered documents into a single central technical documentation",
            ],
          }),
          entry({
            title: "Tutor, Université de Lille (October 2024 to February 2025)",
            details: [
              "Supported first-year students in mathematics, programming and SQL",
            ],
          }),
          entry({
            title: "Store assistant, Carrefour Contact (July to August 2022)",
          }),
        ],
      },
      {
        ...base("Projects", "main"),
        kind: "entries",
        variant: "projects",
        numbered: true,
        entries: [
          entry({
            title: "CodeSwipe, full-stack web application",
            tools: "Java, Spring Boot, Spring Security, React",
            details: [
              "Tinder-like application where users swipe code snippets instead of profiles",
              "Developed the back end (REST API, JWT authentication) and the front end",
              "Scrum Master of a team of seven (user stories, sprints, burn-down chart, Git)",
            ],
          }),
          entry({
            title: "Appointment booking website",
            tools: "Spring Boot, Spring Security, JPA, React, Tailwind",
            details: [
              "Web application with role-based access control (user, admin)",
              "Designed and developed in pairs, from the data model to the interface",
            ],
          }),
          entry({
            title: "Digital portfolio, personal project",
            tools: "Angular, TypeScript, Node.js, React",
            details: [
              "Ongoing Angular rewrite of a bilingual website originally built with React",
              "Node.js back end connected to third-party services (emails, AI chatbot)",
              "Deployed to production, front end on GitHub Pages and back end on Render",
            ],
          }),
          entry({
            title: "2D game engine",
            tools: "Java, GitLab",
            details: [
              "Complete 2D game engine developed by a team of six (end-of-year project)",
              "Built a game with this engine to test and showcase its features",
            ],
          }),
          entry({
            title: "Reinforcement learning environment",
            tools: "Java",
            details: [
              "Designed a custom environment and a simple RL agent to evaluate it",
            ],
          }),
          entry({
            title: "Real-time multiplayer game",
            tools: "JavaScript, Node.js, Socket.IO, HTML5 Canvas",
            details: [
              "Complete game built in pairs, from the engine to a multiplayer server with lobbies",
            ],
          }),
        ],
      },
      {
        ...base("Education", "main"),
        kind: "entries",
        variant: "education",
        numbered: false,
        entries: [
          entry({
            title: "Since 2025",
            details: [
              "Engineering degree in computer science, 4^th^ year, Polytech Grenoble",
              "Coursework: software engineering, computer networks, artificial intelligence (LLM), hardware architecture, signal processing, numerical methods, functional programming (OCaml), formal proof (Rocq)",
            ],
          }),
          entry({
            title: "2025:",
            text: "*BUT Informatique* (Bachelor's degree in computer science), IUT de Lille",
          }),
          entry({
            title: "2024:",
            text: "One-month English language course, Kaplan International, London",
          }),
          entry({
            title: "2022:",
            text: "Baccalauréat (general), with honours, Lycée Pierre d'Ailly, Compiègne",
          }),
        ],
      },
      {
        ...base("Contact", "side"),
        kind: "contact",
        lines: [
          contactLine("phone", "Phone", "+33 6 65 29 34 36"),
          contactLine(
            "email",
            "Email",
            "camille.fourmaintraux@etu.univ-grenoble-alpes.fr",
          ),
          contactLine(
            "website",
            "Portfolio",
            "camillefourmaintraux.github.io",
            portfolio,
          ),
          contactLine(
            "linkedin",
            "LinkedIn",
            "https://www.linkedin.com/in/camille-fourmaintraux-708b34275/",
            "https://www.linkedin.com/in/camille-fourmaintraux-708b34275/",
          ),
          contactLine(
            "address",
            "Address",
            "341 Rue des Résidences\n38400 Saint-Martin-d'Hères, France",
          ),
        ],
      },
      {
        ...base("Skills", "side"),
        kind: "skills",
        groups: [
          skillGroup(
            "Programming languages",
            "Java, TypeScript, JavaScript, SQL, HTML/CSS, Python, C, Kotlin",
          ),
          skillGroup(
            "Back end",
            "Spring Boot, Spring Security, JPA/Hibernate, Java EE (Servlet, JSP), Node.js, Socket.IO",
          ),
          skillGroup(
            "Front end",
            "Angular, React, Redux, Tailwind CSS, Bootstrap, Vite",
          ),
          skillGroup(
            "Databases",
            "SQL, PostgreSQL, MongoDB, Redis, Firebase, DBeaver",
          ),
          skillGroup(
            "APIs and integration",
            "REST, SOAP, JWT, webMethods, Software AG Designer, Postman, Bruno",
          ),
          skillGroup(
            "Tools, testing and DevOps",
            "Git, GitHub, GitLab CI/CD, Docker, JUnit, Mantis, Render",
          ),
          skillGroup(
            "Methodology",
            "Agile Scrum (Scrum Master on two projects, three Agile projects in total)",
          ),
          skillGroup(
            "Languages",
            "French: native\nEnglish: advanced (TOEIC C1, 2025)",
          ),
          skillGroup("Other", "Driving licence (B)"),
        ],
      },
      {
        ...base("Qualities", "side"),
        kind: "list",
        items: ["Organised", "attentive", "curious", "patient"].map((text) =>
          item(text),
        ),
      },
      {
        ...base("Interests", "side"),
        kind: "list",
        items: [
          "Video game programming (Godot, game jams)",
          "board game club member",
          "hiking",
          "chess",
          "puzzles and escape games",
        ].map((text) => item(text)),
      },
      {
        ...base("Portfolio", "side"),
        kind: "portfolio",
        description:
          "My website presents all my university, professional and personal projects in detail.",
        url: portfolio,
        qr: true,
      },
    ],
  };
}

/** Same sections, all empty, with titles in the given language. */
function blank(language: CvLanguage): CvDocument {
  const t = (fr: string, en: string) => (language === "fr" ? fr : en);
  return {
    version: 1,
    language,
    name: "",
    headline: "",
    layout: { ...LAYOUT },
    photo: null,
    sections: [
      { ...base(t("Profil", "Profile"), "main"), kind: "text", body: "" },
      {
        ...base(t("Expérience professionnelle", "Work experience"), "main"),
        kind: "entries",
        variant: "experience",
        numbered: false,
        entries: [entry()],
      },
      {
        ...base(t("Projets", "Projects"), "main"),
        kind: "entries",
        variant: "projects",
        numbered: true,
        entries: [entry()],
      },
      {
        ...base(t("Formation", "Education"), "main"),
        kind: "entries",
        variant: "education",
        numbered: false,
        entries: [entry()],
      },
      {
        ...base("Contact", "side"),
        kind: "contact",
        lines: [
          contactLine("phone", t("Téléphone", "Phone")),
          contactLine("email", t("E-mail", "Email")),
          contactLine("address", t("Adresse", "Address")),
        ],
      },
      {
        ...base(t("Compétences", "Skills"), "side"),
        kind: "skills",
        groups: [skillGroup()],
      },
      {
        ...base(t("Qualités", "Qualities"), "side"),
        kind: "list",
        items: [item()],
      },
      {
        ...base(t("Centres d'intérêt", "Interests"), "side"),
        kind: "list",
        items: [item()],
      },
    ],
  };
}

export function createPreset(
  key: PresetKey,
  uiLanguage: CvLanguage,
): CvDocument {
  switch (key) {
    case "generic-fr":
      return genericFr();
    case "generic-en":
      return genericEn();
    case "blank":
      return blank(uiLanguage);
  }
}

/** The French preset shows the portrait, the others start without a photo. */
export const presetHasPortrait = (key: PresetKey) => key === "generic-fr";
