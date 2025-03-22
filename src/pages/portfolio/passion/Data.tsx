import { RealisationProps } from "../Realisation";
import FirstGameJam from "./projects/FirstGameJam";
import First3DPlatformer from "./projects/First3DPlatformer";
import MazeGenerator from "./projects/MazeGenerator";
import MiniGames from "./projects/MiniGames";
import Miscellaneous from "./projects/Miscellaneous";
import { Tags } from "./Tags";

export const tagsPassionPath = `portfolio.passion.tags`;
const projectsWorkPath = `portfolio.passion.projects`;
const projectTitlePath = `title`;

const realisations: RealisationProps[] = [
  //const Tags = genTags();
  {
    idRealisation: "firstgamejam",
    title: `${projectsWorkPath}.firstgamejam.${projectTitlePath}`,
    date: new Date(2024, 7, 26),
    dateEnd: new Date(2024, 9, 11),
    tags: [Tags.VIDEOGAME, Tags.WEB, Tags.TWODIMENSIONAL, Tags.SHOOTER],
    children: <FirstGameJam />,
    tagsPath: tagsPassionPath,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "first3dplatformer",
    title: `${projectsWorkPath}.first3dplatformer.${projectTitlePath}`,
    date: new Date(2024, 7, 6),
    dateEnd: new Date(2024, 7, 14),
    tags: [Tags.VIDEOGAME, Tags.PLATFORMER, Tags.THREEDIMENSIONAL],
    children: <First3DPlatformer />,
    tagsPath: tagsPassionPath,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "mazegenerator",
    title: `${projectsWorkPath}.mazegenerator.${projectTitlePath}`,
    date: new Date(2023, 8, 24),
    dateEnd: new Date(2023, 8, 28),
    tags: [Tags.JAVA, Tags.TWODIMENSIONAL, Tags.MAZES],
    children: <MazeGenerator />,
    tagsPath: tagsPassionPath,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "minigames",
    title: `${projectsWorkPath}.minigames.${projectTitlePath}`,
    date: new Date(2023, 8, 3),
    dateEnd: new Date(2023, 11, 27),
    tags: [Tags.VIDEOGAME, Tags.JAVA, Tags.TWODIMENSIONAL, Tags.ARCADE],
    children: <MiniGames />,
    tagsPath: tagsPassionPath,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
  {
    idRealisation: "miscellaneous",
    title: `${projectsWorkPath}.miscellaneous.${projectTitlePath}`,
    date: new Date(2004, 0, 15),
    dateEnd: new Date(2073, 3, 21),
    tags: [],
    children: <Miscellaneous />,
    tagsPath: tagsPassionPath,
    current: "",
    isInPeriod: false,
    isInProgress: false,
  },
];
export default realisations;
