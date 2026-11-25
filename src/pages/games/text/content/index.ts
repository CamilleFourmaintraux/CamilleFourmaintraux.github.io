import type { Content } from "../engine/world";
import { en } from "./en";
import { fr } from "./fr";
import { SCENE, entities, schedule, templates } from "./scene";

export const content: Content = {
  version: SCENE.version,
  worldSeed: SCENE.worldSeed,
  start: SCENE.start,
  player: SCENE.player,
  templates,
  entities,
  schedule,
  langs: { fr, en },
};
