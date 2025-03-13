import { useLocation } from "react-router-dom";
import Education from "./Education";
import Experiences from "./Experiences";
import Qualities from "./Qualities";
import Skills from "./Skills";
import { useEffect } from "react";
import { scrollToSection } from "../../parts/nav/SubNav";

export default function CurriculumPage() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      scrollToSection(location.hash.substring(1));
    }
  }, [location]);
  return (
    <>
      <Education />
      <Skills />
      <Qualities />
      <Experiences />
    </>
  );
}
