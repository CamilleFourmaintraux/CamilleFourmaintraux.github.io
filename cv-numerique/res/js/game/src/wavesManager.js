import { Entity } from './entity.js';
import { Ennemy } from './ennemy.js';
import { getRandomInt } from './utils.js';
import canvas from './main.js';

export class WavesManager {
	static difficultyMax = 4;
	static difficulty = 0;
	// Nombre max d'ennemis pouvant apparaitre à l'écran. A ajuster en fonction des lags.
	static ennemyBuffer = 5;


	//Waves
	static waveMaxNumberOfEnnemys = 5;
	static waveNumberOfEnnemysSpawned = 0;
	static waveNumber = 1;
	static waveMultiplier = 1;
	static maxRandomSpawnDistance = 400;
	static spawnDistance = 100;

	constructor() {
		this.ennemys = [];
	}

	//Déclenche la 1ère vague. Lancer cette fonction réitialise donc les ennemis.
	firstWave() {
		WavesManager.waveNumber = 1;
		document.querySelector('#wavesValue').innerHTML = WavesManager.waveNumber;
		WavesManager.waveMaxNumberOfEnnemys = (WavesManager.ennemyBuffer*WavesManager.difficulty)/2 + 1 | 0;
		WavesManager.waveNumberOfEnnemysSpawned = 0;
		Entity.speedMultiplier = 0.8;
		for (let i = 0; i < WavesManager.ennemyBuffer*WavesManager.difficulty; i++) {
			this.ennemys[i] = new Ennemy(
				window.innerWidth +
					getRandomInt(WavesManager.maxRandomSpawnDistance) +
					WavesManager.spawnDistance,
				getRandomInt(window.innerHeight - Ennemy.height - Ennemy.spawnOffset) +
					Ennemy.spawnOffset
			);
			this.ennemys[i].index = i;
			WavesManager.waveNumberOfEnnemysSpawned++;
			if (
				WavesManager.waveNumberOfEnnemysSpawned >
				WavesManager.waveMaxNumberOfEnnemys
			) {
				this.ennemys[i].die();
			}
		}
		console.log(
			'Vague n°' +
				WavesManager.waveNumber +
				' : ' +
				WavesManager.waveMaxNumberOfEnnemys +
				' ennemies.'
		);
	}

	//Appelle la vague suivante
	nextWave() {
		Entity.speedMultiplier;
		WavesManager.waveNumber++;
		document.querySelector('#wavesValue').innerHTML = WavesManager.waveNumber;
		WavesManager.waveNumberOfEnnemysSpawned = 0;
		//a vitesse du jeu augmente à chaque complétion d'une vague
		Entity.addToSpeed(0.01*WavesManager.difficulty);
		console.log(
			'Vague n°' +
				WavesManager.waveNumber +
				' : ' +
				WavesManager.waveMaxNumberOfEnnemys +
				' ennemies.'
		);
		WavesManager.waveMaxNumberOfEnnemys =
			(((3+WavesManager.difficulty+getRandomInt(WavesManager.difficulty)) + WavesManager.waveNumber / 2) *
				WavesManager.waveMultiplier) |
			0; // | 0 convertit en 'int' (permet d'éviter les chiffres à virgules).
		for (let a = 0; a < this.ennemys.length; a++) {
			this.ennemys[a].fate();
		}
	}

	//Gêre le mise à jour des vagues
	wavesUpdates(player) {
		//Renvoie un boolean en fonction de si la vague est finie (tous les ennemis ont disparues).
		let allDead = true;
		for (let a = 0; a < this.ennemys.length; a++) {
			this.ennemys[a].updateShots();
			this.ennemys[a].ennemyShotsCollideWithPlayer(player);
			if (!this.ennemys[a].isDead) {
				allDead = false;
				this.ennemys[a].update();
				if (player.alive && !player.invincible) {
					if (this.ennemys[a].isCollidingWith(player)) {
						player.die();
						this.ennemys[a].fate();
					}
				}
				player.playerShotsCollideWithEnnemy(this.ennemys[a]);
			}
		}
		return allDead;
	}

	//Affiche les ennemis appartenant à la vague en cours.
	wavesRender() {
		for (let i = 0; i < this.ennemys.length; i++) {
			this.ennemys[i].render();
		}
	}
}
