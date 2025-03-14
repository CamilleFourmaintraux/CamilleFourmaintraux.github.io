import { Link } from "react-router-dom";
import Sae509 from "./saes/Sae509";
import Sae501 from "./saes/Sae501";
import Sae402 from "./saes/Sae402";
import Sae302 from "./saes/Sae302";
import Sae401 from "./saes/Sae401";
import Pagil1 from "./saes/Pagil1";
import Sae213 from "./saes/Sae213";
import Sae207 from "./saes/Sae207";
import Sae202 from "./saes/Sae202";
import Sae105 from "./saes/Sae105";
import Sae103 from "./saes/Sae103";
import Pagil2 from "./saes/Pagil2";
import Tags from "./Tags";
import { RealisationProps } from "../Realisation";

const realisations: RealisationProps[] = [
  {
    idRealisation: "pagil2",
    title: "Création d'un BACK-END et d'un FRONT-END pour un site web",
    date: new Date(2025, 2, 3),
    dateEnd: new Date(2025, 2, 7),
    tags: [
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
    children: <Pagil2 />,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "stage2025portfolio",
    title: "Stage intégrateur SOA webMethods chez EMothep",
    date: new Date(2025, 2, 10),
    dateEnd: new Date(2025, 5, 27),
    tags: [Tags.INTERNSHIP, Tags.BACKEND, Tags.INTEGRATION, Tags.DB],
    children: (
      <p>
        <Link to="/cursus#experiences">
          Voir mes réalisations durant le stage
        </Link>
        .
      </p>
    ),
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "stage2024portfolio",
    title: "Stage intégrateur SOA webMethods chez EMothep",
    date: new Date(2024, 3, 15),
    dateEnd: new Date(2024, 5, 21),
    tags: [Tags.INTERNSHIP, Tags.BACKEND, Tags.INTEGRATION, Tags.DB],
    children: (
      <p>
        <Link to="/cursus#stage2024container">
          Voir mes réalisations durant le stage
        </Link>
        .
      </p>
    ),
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "sae509",
    title: "WEB BACK",
    date: new Date(2024, 8, 19),
    dateEnd: new Date(2025, 1, 24),

    tags: [
      Tags.WEB,
      Tags.BACKEND,
      Tags.APIREST,
      Tags.DB,
      Tags.SPRING,
      Tags.JAVA,
      Tags.FRONTEND,
      Tags.JSP,
    ],
    children: <Sae509 />,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "sae501",
    title: "Emulateur RiscV",
    date: new Date(2024, 8, 17),
    dateEnd: new Date(2025, 1, 9),
    tags: [Tags.SYSTEMS, Tags.C],
    children: <Sae501 />,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "sae402",
    title: "Développement d'une application complexe",
    date: new Date(2024, 1, 19),
    dateEnd: new Date(2024, 2, 22),
    tags: [Tags.VIDEOGAME, Tags.JSTS],
    children: <Sae402 />,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "sae401",
    title: "Développement d'une API REST",
    date: new Date(2024, 1, 5),
    dateEnd: new Date(2024, 2, 18),
    tags: [
      Tags.BACKEND,
      Tags.APIREST,
      Tags.DB,
      Tags.SPRING,
      Tags.JAVA,
      Tags.JSP,
    ],
    children: <Sae401 />,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "sae302",
    title: "Création d'un jeu avec JavaFX",
    date: new Date(2023, 9, 2),
    dateEnd: new Date(2023, 11, 4),
    tags: [Tags.VIDEOGAME, Tags.JAVA],
    children: <Sae302 />,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "pagil1",
    title: "Création d'un Jeu dans le Terminal avec Méthodologie Agile SCRUM",
    date: new Date(2023, 8, 1),
    dateEnd: new Date(2023, 8, 5),
    tags: [Tags.SCRUM, Tags.VIDEOGAME, Tags.JAVA],
    children: <Pagil1 />,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "sae213",
    title: "Escape Game",
    date: new Date(2023, 3, 24),
    dateEnd: new Date(2023, 5, 19),
    tags: [Tags.SCRUM, Tags.VIDEOGAME],
    children: <Sae213 />,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "sae207",
    title: "Création d'une Base de Données - Ventilation de Données",
    date: new Date(2023, 1, 28),
    dateEnd: new Date(2023, 3, 24),
    tags: [Tags.DB],
    children: <Sae207 />,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "sae202",
    title: "Création d'une Application d'Échanges Scolaires en Java et JavaFX",
    date: new Date(2023, 0, 30),
    dateEnd: new Date(2023, 2, 31),
    tags: [Tags.JAVA],
    children: <Sae202 />,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "sae105",
    title:
      "Conception et développement d'un site web pour présenter une entreprise",
    date: new Date(2022, 8, 24),
    dateEnd: new Date(2022, 11, 9),
    tags: [Tags.WEB],
    children: <Sae105 />,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "sae103",
    title: "Installation de service réseau",
    date: new Date(2022, 8, 12),
    dateEnd: new Date(2022, 9, 21),
    tags: [Tags.SYSTEMS, Tags.C],
    children: <Sae103 />,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
];

export default realisations;
