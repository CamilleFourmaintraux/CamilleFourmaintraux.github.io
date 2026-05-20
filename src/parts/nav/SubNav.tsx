interface SubNavProps {
  links: { href: string; label: string }[];
  takeSubnavHeightIntoAccount: boolean;
}

const bugOmeter = 300;
const bugOmeterFather = 20;
const bugOmeterSon = 4;
const bugOmeterSonBrother = 2;

export const handleScrollToSection = (
  event: React.MouseEvent<HTMLAnchorElement>,
  targetId: string,
  takeSubnavHeightIntoAccount: boolean,
) => {
  event.preventDefault();
  scrollToSection(targetId, takeSubnavHeightIntoAccount);
};

export const scrollToSection = (
  targetId: string,
  takeSubnavHeightIntoAccount: boolean,
) => {
  //console.log("Scroll to : "+targetId);
  const targetElement = document.getElementById(targetId);
  const subnav = document.getElementById("subnav");

  if (targetElement && subnav) {
    let targetPosition =
      targetElement.getBoundingClientRect().top + window.scrollY;
    let offsetPosition = targetPosition - bugOmeterFather;
    if (takeSubnavHeightIntoAccount) {
      let subnavHeight =
        subnav.offsetHeight *
        (window.scrollY < bugOmeter ? bugOmeterSon : bugOmeterSonBrother); // Hauteur de la sub-barre de navigation * NumberOfLife
      offsetPosition = targetPosition - subnavHeight; // Décalage pour éviter le chevauchement
    }
    //console.log(`${targetPosition} - ${subnavHeight} = ${offsetPosition}`);
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  } else console.error("Error target : " + targetId + " ==> " + targetElement);
};

const SubNav: React.FC<SubNavProps> = ({
  links,
  takeSubnavHeightIntoAccount,
}) => {
  return (
    <nav id="subnav">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={(e) =>
            handleScrollToSection(e, link.href, takeSubnavHeightIntoAccount)
          }
          className="navlink"
        >
          <i className="fas fa-circle"></i> {link.label}
        </a>
      ))}
    </nav>
  );
};

export default SubNav;
