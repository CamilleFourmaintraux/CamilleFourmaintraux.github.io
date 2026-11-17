import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import Page from "@/ui/Page";
import SectionNav from "@/ui/SectionNav";
import Education from "./Education";
import Experiences from "./Experiences";
import Qualities from "./Qualities";
import Skills from "./Skills";

export default function Cursus() {
  const { t } = useTranslation();
  const sections = useMemo(
    () => [
      { id: "formation", label: t("header.subnav.education") },
      { id: "competences", label: t("header.subnav.skills") },
      { id: "qualites", label: t("header.subnav.softskills") },
      { id: "experiences", label: t("header.subnav.experience") },
    ],
    [t],
  );
  return (
    <Page title={t("header.mainnav.career")} icon={faGraduationCap}>
      <SectionNav items={sections} />
      <Education />
      <Skills />
      <Qualities />
      <Experiences />
    </Page>
  );
}
