import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import {
  faCalendar,
  faCar,
  faEnvelope,
  faGlobe,
  faLanguage,
  faLink,
  faLocationDot,
  faMobileScreenButton,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import {
  faDiscord,
  faGithub,
  faGitlab,
  faLinkedin,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import type { IconKey } from "./model";

/** Icons of the preview. The LaTeX file uses the matching fontawesome5 commands. */
export const ICONS: Record<IconKey, IconDefinition> = {
  phone: faMobileScreenButton,
  email: faEnvelope,
  website: faGlobe,
  linkedin: faLinkedin,
  github: faGithub,
  gitlab: faGitlab,
  address: faLocationDot,
  link: faLink,
  youtube: faYoutube,
  discord: faDiscord,
  calendar: faCalendar,
  car: faCar,
  language: faLanguage,
  user: faUser,
};
