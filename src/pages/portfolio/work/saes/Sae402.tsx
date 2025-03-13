export default function Sae402() {
    return (
      <>
        <ul>
            <li><h4>Idées de gameplay</h4></li>
            <p>Nous avons reçu un cahier des charges,
                avec toutes les fonctionnalités minimales que devrais avoir l'application finale.
                Notre première mission était donc de réfléchir à des éléments de gameplay ainsi qu'à un thème permettant de répondre aux consignes.
                Nous nous sommes d'abord concentré sur les éléments de gameplay, en fournissant deux versions prototypes sans aucun thèmes ou élément audio visuel, uniquement une base de gameplay et des formes géométriques pour répresenter les élements du jeu.</p>
            <img src="/img/portfolio/versionBasique.gif" alt="capture du jeu"/>
            <li><h4>Multijoueurs avec node.js et socket.io</h4></li>
            <p>C'était la première fois que nous devions développer un jeu multijoueur, ce fut un défi très intéressant et cela nous à fait réfléchir et comprendre à comment fonctionnent les jeux multijoueurs en général. Grâce à cette saé, nous avons appris à utiliser socket.iio pour connecter le server et les clients entre eux, et permettre la création de différentes parties indépendantes sur le même serveur grâce aux rooms.</p>
            <img src="/img/portfolio/versionFinale.gif" alt="capture des tests"/>
            <h4>Compétences et savoir-faire acquis</h4>
                <ul>
                    <li><b>JavaScript ES6</b> : Nous n'avions jamais codé en javascript avant ce projet. Ce fut l'occasion d'apprendre et de mettre en pratique ces nouvelles compétences.</li>
                    <li><b> Nodes.js, socket.io</b> : Grâce à socket.io, nous avons pu créer un jeu multijoueur où plusieurs parties peuvent se dérouler en même temps.</li>
                    <li><b> Babel, Prettier</b> : gérer des dépendances (package.json) dans un projet js.</li>
                    <li><b> Canvas</b> : dessiner des formes, des images dans un canvas</li>
                </ul>
            <h4>Savoir-êtres acquis</h4>
                <ul>
                    <li><b> Travail d'équipe</b> : Nous avons réalisé ce projet en binôme, qui était prévu d'être fait en trinôme, ce qui nous à mis à l'épreuve pour finir dans les temps avec un tiers de notre force de travail.</li>
                    <li><b> Collaboration</b> : Afin de pouvoir finir dans les temps, une bonne répartition du travail était essentielle. Nous avons relevé ce défi haut la main, en respectant le cahier des charges et en ayant même des fonctionnalités suplémentaires.</li>
                    <li><b> Qualité des dépôts git (Commits,Milestones)</b> : le professeur avait particulièrement insisté sur la qualité de notre dépôt git et sur la gestion des tâches, nous avons donc appris à mieux utiliser les outils collaboratif de GitLab.</li>
                </ul>
        </ul>
      </>
    );
}