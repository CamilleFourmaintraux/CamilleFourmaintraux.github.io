export default function Experiences() {
    return (
      <>        
        <div className="container" id="experiences">
                <h2>Expériences professionnelle</h2>
                <div className="subcontainer" id="tutorat">
                    <h3>Tuteur pour l'université de Lille de octobre 2024 à mars 2025</h3>
                    <ul>
                        <li>Cours de soutien à des élèves en difficutés</li>
                        <li>Gérer un groupe d'élèves</li>
                        <li>Responsabilités</li>
                    </ul>
                </div>
                <div className="subcontainer" id="stage2024container">
                    <div>
                        <h3 id="stage2024" style={{ float: "left" }}>Stage intégrateur SOA webMethods pendant 10 semaines d'avril à juin 2024 chez <span className="protected">E-Mothep</span> [Lille]</h3>
                        <img src="/img/cursus/emothep_logo.png" alt="logo E-Mothep" style={{ float: "right" }}/>
                    </div>
                    <p><a href="https://e-mothep.fr/" className="protected">E-Mothep</a> est une entreprise spécialisée dans le développement de solutions logicielles.</p>
                    
                    <ul>
                        <li><strong>Projet principal : </strong>
                            <p>Maintenance d'AMAT (Automated Monitoring & Analysing Tool) par l'intégration de nouvelles fonctionnalités et correction de bugs.
                                Certains services avaient des comportements inatendu et je devais les analyser, les comprendre, puis les corriger. </p>
                        </li>
                        
                        <li><strong>Développement d'une API : </strong>
                            <p> Pour la mise à jour automatique des référentiels, optimisant les processus et réduisant les erreurs.</p>
                        </li>
                        
                        <li><strong>Rétrodocumentation : </strong> 
                            <p>Pour réaliser la mission concernant la rédaction de rétro-documentation sur l'un des projets internes de l'entreprise,
                                j’ai scruté le code sur le GitHub du projet et j’ai noté dans un document les interactions avec la base de données FireBase
                                ainsi que le code source de ce projet.</p>
                        </li>
                        
                        <li><strong>Développement sun un projet interne de base de connaissances : </strong>
                            <p>Dans ce projet, la gestion des erreurs est incomplète. Une gestion des erreurs
                            plus intéressante et modulable a été faite pour un autre projet. Je devais récupérer
                            cette gestion d’erreur et l’implémenter dans ce projet-là. Je devais ensuite utiliser POSTMAN
                            pour accéder à l’URL de l’API et tester si ça renvoyait les bons messages d’erreurs.</p>
                        </li>
                        <li><strong>Expérience en gestion de projet : </strong>
                            <p>Priorisation des tâches, Travail au sein d'une équipe et résolution de problèmes.</p>
                        </li>
                        <li><strong>Compétences technique acquises : </strong>
                            <p>Gestion des bases de données, développement d'API, documentation, gestion de projet, travail en équipe.</p>
                        </li>
                        <li><strong>Outils & langages de programmation employés : </strong>
                            <p>DBeaver, Software AG Designer, Postman, MANTIS, WinSCP, GitHub, Firebase, Angular, TypeScript.</p>
                        </li>
                    </ul>
                    <a href="/files/InternshipReportEmothep2024.pdf" target="_blank">Lire mon rapport de stage complet</a>
                    
                </div>
                
                <div className="subcontainer" id="carrefour">
                    <h3>Employé Polyvalent dans le Carrefour Contact de Ressons sur Matz de Juillet à Août 2022.</h3>
                    <ul>
                        <li>Intégration d’une équipe</li>
                        <li>Travail en autonomie</li>
                        <li>Prise d’initiatives</li>
                    </ul>
                </div>
        </div>
      </>
    );
}