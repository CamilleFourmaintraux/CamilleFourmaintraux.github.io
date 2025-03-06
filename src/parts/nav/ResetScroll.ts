import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
        top: 0,
        //behavior: 'smooth',
      });
  }, [pathname]); // Se déclenche à chaque changement d'URL

  return null;
};

export default ScrollToTop;
