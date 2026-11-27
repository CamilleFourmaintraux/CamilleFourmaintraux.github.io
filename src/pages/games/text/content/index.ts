import type { Content } from "../engine/world";
import { en } from "./en";
import { fr } from "./fr";
import {
  SCENE,
  entities,
  hints,
  intro,
  schedule,
  status,
  templates,
} from "./scene";

export const content: Content = {
  version: SCENE.version,
  worldSeed: SCENE.worldSeed,
  start: SCENE.start,
  player: SCENE.player,
  templates,
  entities,
  schedule,
  hints,
  intro,
  status,
  langs: { fr, en },
};
