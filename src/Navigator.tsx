import {Routes, Route } from "react-router-dom";
import IntroductionPage from './pages/Introduction';

import CursusPage from './pages/cursus/Curriculum';
import PortfolioPage from './pages/Portfolio';
import PassionsPage from './pages/Passions';
import RedirectionPage from './pages/Redirection';
import DocumentsPage from './pages/Documents';
import ContactPage from './pages/contact/Contact';

export default function Navigator() {
    //<Route path="/detail/:slug" element={<GameDetail />} />
	return (
			<Routes>
				<Route path="/*" element={<RedirectionPage />} />

				<Route index element={<IntroductionPage />} />
				<Route path="/index" element={<IntroductionPage />} />
				<Route path="/home" element={<IntroductionPage />} />
				<Route path="/welcome" element={<IntroductionPage />} />
				<Route path="/reception" element={<IntroductionPage />} />
				<Route path="/bienvenue" element={<IntroductionPage />} />
				<Route path="/accueil" element={<IntroductionPage />} />

				<Route path="/cursus" element={<CursusPage />} />
				<Route path="/parcours" element={<CursusPage />} />
				<Route path="/courses" element={<CursusPage />} />
				<Route path="/curriculum" element={<CursusPage />} />

				<Route path="/portfolio" element={<PortfolioPage />} />
				<Route path="/saes" element={<PortfolioPage />} />
				<Route path="/projets" element={<PortfolioPage />} />
				<Route path="/projects" element={<PortfolioPage />} />

				<Route path="/passions" element={<PassionsPage />} />
				<Route path="/loisirs" element={<PassionsPage />} />
				<Route path="/hobbies" element={<PassionsPage />} />

				<Route path="/contact" element={<ContactPage />} />

				<Route path="/documents" element={<DocumentsPage />} />
			</Routes>
	);
}
