import { RealisationProps } from "../Realisation";
import Tags from "./Tags";
import FirstGameJam from "./projects/FirstGameJam";
import First3DPlatformer from "./projects/First3DPlatformer";
import MazeGenerator from "./projects/MazeGenerator";
import MiniGames from "./projects/MiniGames";
import Miscellaneous from "./projects/Miscellaneous";

const realisations: RealisationProps[] = [
  {
    idRealisation: "firstgamejam",
    title: "Ma  première gamejam !",
    date: new Date(2024, 7, 26),
    dateEnd: new Date(2024, 9, 11),
    tags: [Tags.VIDEOGAME, Tags.WEB, Tags.TWODIMENSIONAL, Tags.SHOOTER],
    children: <FirstGameJam />,
  },
  {
    idRealisation: "first3Dplatformer",
    title: "Création d'un jeu de mon premier jeu en 3D : un platformer !",
    date: new Date(2024, 7, 6),
    dateEnd: new Date(2024, 7, 14),
    tags: [Tags.VIDEOGAME, Tags.PLATFORMER, Tags.THREEDIMENSIONAL],
    children: <First3DPlatformer />,
  },
  {
    idRealisation: "mazegenerator",
    title: "Création d'un générateur de labyrinthe.",
    date: new Date(2023, 8, 24),
    dateEnd: new Date(2023, 8, 28),
    tags: [Tags.JAVA, Tags.TWODIMENSIONAL, Tags.MAZES],
    children: <MazeGenerator />,
  },
  {
    idRealisation: "minigames",
    title: "Création d'un Pong et d'un casse-brique",
    date: new Date(2023, 8, 3),
    dateEnd: new Date(2023, 11, 27),

    tags: [Tags.VIDEOGAME, Tags.JAVA, Tags.TWODIMENSIONAL, Tags.ARCADE],
    children: <MiniGames />,
  },
  {
    idRealisation: "miscellaneous",
    title: "Autres jeux en développement",
    date: new Date(2004, 0, 15),
    dateEnd: new Date(2073, 0, 15),
    tags: [],
    children: <Miscellaneous />,
  },
];
export default realisations;
