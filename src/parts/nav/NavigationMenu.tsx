import React, { useEffect, useState } from "react";
import { Outlet } from "react-router";
import MainNav from "./MainNav";
import SubNav from "./SubNav";
import BackToTopButton from "./BackToTopButton";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "./LanguageSwitcher";

export interface subNavLink {
  href: string;
  label: string;
}

export interface subNavLinks {
  subNavLinks: subNavLink[];
}

const NavigationMenu: React.FC<subNavLinks> = ({ subNavLinks }) => {
  const navbarTop = 220;

  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    setIsFixed(window.scrollY > navbarTop);
    const handleScroll = () => {
      setIsFixed(window.scrollY > navbarTop);
      //console.log(`${window.scrollY} > ${navbarTop} == ${isFixed}`);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div id="navbar">
      <div id="main_nav-wrapper" className={isFixed ? "fixed" : ""}>
        <MainNav />
        {subNavLinks.length > 0 && (
          <SubNav links={subNavLinks} takeSubnavHeightIntoAccount={true} />
        )}
      </div>
      <div className="configButtons">
        {isFixed && <BackToTopButton />}
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
      <Outlet />
    </div>
  );
};

export default NavigationMenu;
