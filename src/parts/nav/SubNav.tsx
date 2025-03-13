interface SubNavProps {
  links: { href: string; label: string }[];
}

const bugOmeter = 300;

export const handleScrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
  event.preventDefault();
  scrollToSection(targetId);
};

export const scrollToSection = (targetId: string) => {
  console.log("Scroll to : "+targetId);
  const targetElement = document.getElementById(targetId);
  const subnav = document.getElementById("subnav");

  if (targetElement && subnav) {
    const subnavHeight = subnav.offsetHeight*(window.scrollY<bugOmeter ? 4 : 2) // Hauteur de la sub-barre de navigation * NumberOfLife
    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY; // Position absolue
    const offsetPosition = targetPosition - subnavHeight; // Décalage pour éviter le chevauchement
    //console.log(`${targetPosition} - ${subnavHeight} = ${offsetPosition}`);
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }else console.error("Error target : "+targetId+" ==> "+targetElement);
}

const SubNav: React.FC<SubNavProps> = ({ links }) => {
  return (
    <nav id="subnav">
      {links.map((link) => (
        <a key={link.href} href={link.href} onClick={(e) => handleScrollToSection(e, link.href.substring(1))} className="navlink">
          <i className="fas fa-circle"></i> {link.label}
        </a>
      ))}
    </nav>
  );
};

export default SubNav;
