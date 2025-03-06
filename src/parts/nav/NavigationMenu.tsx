import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import MainNav from "./MainNav";
import SubNav from "./SubNav";

const NavigationMenu: React.FC = () => {
  const location = useLocation();
  const navbarTop = 220;

  // Définition des sous-sections en fonction de la page actuelle
  let subNavLinks: { href: string; label: string }[] = [];
  if (location.pathname === "/cursus") {
    subNavLinks = [
      { href: "#formation", label: "Formation" },
      { href: "#competences", label: "Compétences" },
      { href: "#qualites", label: "Qualités" },
      { href: "#experiences", label: "Expériences professionnelles" },
    ];
  }
  
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
    <div id="navbar" className={isFixed ? "fixed" : ""}>
      <MainNav />
      {subNavLinks.length > 0 && <SubNav links={subNavLinks} />}
      <Outlet />
    </div>
  );
};

export default NavigationMenu;
