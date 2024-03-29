import { Entity } from './entity.js';
import { Shot } from './shot.js';
import canvas from './main.js';
import { WavesManager } from './wavesManager.js';
import { getRandomInt } from './utils.js';
import { imageShield1, imageShield2, imageSpaceShip } from './imageLoader.js';

export class Player extends Entity {
	//Les variables de gameplay
	static width = 50;
	static height = 50;

	static defaultNumberOfLife = 4;
	static playerSpeed = 3;
	static bulletSpeed = Shot.defaultSpeed;

	//Timer
	static maxTimeBeforeShooting = 10;
	static maxTimeForInvincibility = 600;
	static maxTimeForScoreMultiplierBonus = 456;
	static maxTimeIceMalus = 300;

	//Movement
	static accelerationMultiplier = 1.2;
	static inertiaMultiplier = 1.5; //Lié à l'accéleration : si inertia==accelration alors c'est comme si on désactivait l'accélération et qu'on revenait au déplacement d'avant
	static maxAcceleration = 12;

	//declarations
	static teamLifes; //vies de départ : default 4-WavesManager.difficulty dans main.js
	static players = [];

	constructor(posX, posY) {
		super(posX, posY, Player.width, Player.height);
		//Declarations
		this.alive = true;
		this.invincible = true;
		this.score = 0;
		this.shots = [];
		this.pseudo = 'player';

		//Timer
		this.timerBeforeShots = 0;
		this.maxTimeBeforeRespawn = 50;
		this.timerBeforeRespawn = this.maxTimeBeforeRespawn;

		//Bonus
		this.timerBeforeLosingInvincibility = Player.maxTimeForInvincibility;
		this.timerBeforeLosingIceMalus = 0;
		this.iceMultiplierMalus=1;
		this.timerBeforeLosingScoreMultiplierBonus = 0;
		this.scoreMultiplierBonus = 1;

		//Graphic
		this.invincibleAnimation = (20 / this.animationSpeed) | 0;
		this.animationSpeed = 0.6; //Vitesse 0,25x 0,5x 0,75x 1x 2x 3x etc (du plus lent au plus rapide) Max 10 car après c'est tellemnt rapide c'est imperceptible.

		//Movement
		this.accelerationX = 0;
		this.accelerationY = 0;
	}

	//Tue le joueur, initialise le timer avant sa réapparition
	die() {
		this.alive = false;
		this.maxTimeBeforeRespawn =
			(this.maxTimeBeforeRespawn *
				(Math.round((1 + WavesManager.difficulty / 10) * 100) / 100)) |
			0; //Le respawn devient de plus en plus long plus on meurt.
		this.timerBeforeRespawn = this.maxTimeBeforeRespawn;
	}

	//Fais réapparaitre le jouer à ses coordonnées de départ et le rend invincible quelques instants
	respawn() {
		
		Player.teamLifes--;
		document.querySelector('#lifesValue').innerHTML = Player.teamLifes;
		this.alive = true;
		this.becomeInvincible(
			(Player.maxTimeForInvincibility / WavesManager.difficulty) | 0
		);
		this.posY = canvas.height / 2;
		this.posX = 100;
		this.speedX = 0;
		this.speedY = 0;
		this.accelerationX = 0;
		this.accelerationY = 0;
		this.timerBeforeShots = 0;
	}

	becomeInvincible(duration) {
		//default 100 for respawn and 500 for power up
		this.invincible = true;
		this.timerBeforeLosingInvincibility = duration;
		this.animationSpeed = 0.6;
	}

	//Affiche les tirs causés par le joueur.
	renderShots(context) {
		for (let i = 0; i < this.shots.length; i++) {
			this.shots[i].render(context);
		}
	}

	//met à jour les tirs causés par le joueur.
	updateShots() {
		for (let i = 0; i < this.shots.length; i++) {
			this.shots[i].update();
			if (this.shots[i].posX > canvas.width) {
				this.shots.shift();
			}
		}
	}

	//Affiche le joueur.
	render() {
		const context = canvas.getContext('2d');
		this.renderShots(context);
		if (this.alive) {
			super.render(context);
			//context.fillStyle = 'blue';
			//context.fillRect(this.posX+3, this.posY+3, this.width-3, this.width-3);
			context.drawImage(
				imageSpaceShip,
				this.posX,
				this.posY,
				this.width,
				this.height
			);
			if (this.invincible) {
				this.invincibleAnimation--;
				if ((this.invincibleAnimation < 10 / this.animationSpeed) | 0) {
					context.strokeStyle = 'purple';
					context.rect(this.posX+2, this.posY+2, this.width-2, this.width-2);
					/*context.drawImage(
						imageShield1,
						this.posX,
						this.posY,
						this.width,
						this.height
					);*/
					if (this.invincibleAnimation < 0) {
						this.invincibleAnimation = (20 / this.animationSpeed) | 0;
					}
				}else{
					context.strokeStyle = 'pink';
					context.rect(this.posX+2, this.posY+2, this.width-2, this.width-2);
					/*context.drawImage(
						imageShield2,
						this.posX,
						this.posY,
						this.width,
						this.height
					);*/
				}
				context.stroke();
				
			}
			context.lineWidth = 1;
			context.font = '16px Minecraft Regular';
			context.imageSmoothingEnabled = false;
			context.fillStyle = 'white';
			context.fillText(this.pseudo, this.posX, this.posY - 10);
		}
	}

	//met à jour le joueur.
	update(keysPressed) {
		super.update(); //Essentiel pour les collisions entre entités
		this.updateShots();
		if (this.alive) {
			if (this.gotScoreMultiplierBonus()) {
				this.timerBeforeLosingScoreMultiplierBonus--;
				if (this.timerBeforeLosingScoreMultiplierBonus < 0) {
					this.loseScoreMuliplierBonus();
				}
			}

			if(this.gotIceMalus()){
				this.timerBeforeLosingIceMalus--;
				if(this.timerBeforeLosingIceMalus<0){
					this.loseIceMalus();
				}
			}
			
			//On vérifie le timer de l'invincibilité du joueur et on la retire si nécessaire.
			if (this.invincible) {
				this.timerBeforeLosingInvincibility--;
				if (this.timerBeforeLosingInvincibility < 0) {
					this.invincible = false;
				}
				//Moins il reste de temps d'invincibilité, plus l'animation s'accélère
				this.animationSpeed =
					Math.floor(
						(this.animationSpeed +
							(0.005 - this.timerBeforeLosingInvincibility / 100000)) *
							100000
					) / 100000;
			}

			//On vérifie le timer avant que le joueur ne puisse tirer à nouveau
			this.timerBeforeShots--;
			if (this.timerBeforeShots < 0) {
				this.timerBeforeShots = 0;
			}

			//On met à jour la position du joueur
			this.speedY = 0;
			this.speedX = 0;
			this.deceleration();
			this.acceleration(keysPressed);

			//Le joueur déclenche un tir et active le cooldown si il appuie sur espace
			if (keysPressed.Space) {
				this.shootWithRecharge();
			}
			if (keysPressed.MouseDown) {
				this.shootWithRecharge();
			}

			//Collisions avec les bords du canvas
			this.borderCollision();
		} else {
			//Si le joueur n'est pas vivant,
			//on vérifie le timer avant sa réapparition
			//et on le fais réapparaître si nécessaire.
			this.timerBeforeRespawn--;
			if (this.timerBeforeRespawn <= 0) {
				this.respawn();
			}
		}
	}

	borderCollision() {
		if (this.posX > canvas.width - this.width) {
			this.posX = canvas.width - this.width;
			this.accelerationX = 0;
			this.speedX = 0;
		} else if (this.posX < 0) {
			this.posX = 0;
			this.accelerationX = 0;
			this.speedX = 0;
		}
		if (this.posY > canvas.height - this.width) {
			this.posY = canvas.height - this.width;
			this.speedY = 0;
			this.accelerationY = 0;
		} else if (this.posY < 0) {
			this.posY = 0;
			this.speedY = 0;
			this.accelerationY = 0;
		}
	}

	shootWithRecharge() {
		if (this.timerBeforeShots <= 0) {
			this.shoot();
			this.timerBeforeShots = Player.maxTimeBeforeShooting;
		}
	}

	//Fais tirer au joueur un projectile.
	shoot() {
		this.shots.push(
			new Shot(
				this.posX + this.width,
				this.posY + this.height / 3,
				true,
				Player.bulletSpeed
			)
		);
	}


	//Ajoute des points au joueur pour chaque kill d'ennemis
	addScorePointOnEnemyKill(ennemy) {
		this.score +=
			ennemy.value * WavesManager.difficulty * this.scoreMultiplierBonus;
	}

	//Réinitialise le joueur pour le préparer à une nouvelle partie.
	restart() {
		this.score = 0;
		document.querySelector('#scoreValue').innerHTML = this.score;
		this.shots = [];
		this.maxTimeBeforeRespawn = 50;
		this.respawn();
		Player.resetTeamLivesNumber();
	}

	static resetTeamLivesNumber() {
		Player.teamLifes = Player.defaultNumberOfLife - WavesManager.difficulty;
		document.querySelector('#lifesValue').innerHTML = Player.teamLifes;
	}

	//Collisions des tirs du joueurs avec les ennemis
	playerShotsCollideWithEnnemy(ennemy) {
		for (let s = 0; s < this.shots.length; s++) {
			if (this.shots[s].active) {
				if (this.shots[s].isCollidingWith(ennemy)) {
					this.shots[s].active = false;
					if (ennemy.getHurt()) {
						this.addScorePointOnEnemyKill(ennemy);
						document.querySelector('#scoreValue').innerHTML = this.score;
					}
				}
			}
		}
	}

	///// Accélère en fonction des directions.
	//Distance sert uniquement lors du controle à la souris,
	//en cas de controle clavier il faut laisser la valeur par défaut
	//et donc ne pas mettre de 2ème argument.

	accelerateLeft(acceleration, distance = 0.1) {
		acceleration =
			Math.round(
				(acceleration - distance * Player.accelerationMultiplier) * 1000
			) / 1000;
		return acceleration;
	}

	accelerateUp(acceleration, distance = 0.1) {
		return this.accelerateLeft(acceleration, distance);
	}

	accelerateRight(acceleration, distance = 0.1) {
		acceleration =
			Math.round(
				(acceleration + distance * Player.accelerationMultiplier) * 1000
			) / 1000;
		return acceleration;
	}

	accelerateDown(acceleration, distance = 0.1) {
		return this.accelerateRight(acceleration, distance);
	}

	/////

	acceleration(keysPressed) {
		if (keysPressed.MouseMode) {
   this.gyroscopeMovement(keysPressed);
			/*this.mouseMovement();*/
		} else {
			this.keyBoardMovement(keysPressed);
		}
		this.checkMaxAcceleration();
		this.speedX += this.accelerationX;
		this.speedY += this.accelerationY;
	}

	checkMaxAcceleration() {
		if (this.accelerationX > Player.maxAcceleration) {
			this.accelerationX = Player.maxAcceleration;
		}
		if (this.accelerationX < -Player.maxAcceleration) {
			this.accelerationX = -Player.maxAcceleration;
		}
		if (this.accelerationY > Player.maxAcceleration) {
			this.accelerationY = Player.maxAcceleration;
		} else if (this.accelerationY < -Player.maxAcceleration) {
			this.accelerationY = -Player.maxAcceleration;
		}
	}

	deceleration() {
		this.accelerationX = this.decelerate(this.accelerationX);
		this.accelerationY = this.decelerate(this.accelerationY);
	}

	decelerate(acceleration) {
		if (acceleration < 0) {
			acceleration =
				Math.round(
					(acceleration + 1 / (10 * (Player.inertiaMultiplier*this.iceMultiplierMalus))) * 1000
				) / 1000;
		} else if (acceleration > 0) {
			acceleration =
				Math.round(
					(acceleration - 1 / (10 * (Player.inertiaMultiplier*this.iceMultiplierMalus))) * 1000
				) / 1000;
		}
		return acceleration;
	}

	keyBoardMovement(keysPressed) {
		if (keysPressed.ArrowDown) {
			this.speedY = Player.playerSpeed;
			this.accelerationY = this.accelerateDown(this.accelerationY);
		}
		if (keysPressed.ArrowUp) {
			this.speedY = -Player.playerSpeed;
			this.accelerationY = this.accelerateUp(this.accelerationY);
		}
		if (keysPressed.ArrowLeft) {
			this.speedX = -Player.playerSpeed;
			this.accelerationX = this.accelerateLeft(this.accelerationX);
		}
		if (keysPressed.ArrowRight) {
			this.speedX = Player.playerSpeed;
			this.accelerationX = this.accelerateRight(this.accelerationX);
		}
	}

	mouseMovement() {
		const vaguely = 10;
		const distanceX = Math.round(Math.abs(window.mouseX - this.posX)) / 2000;
		const distanceY = Math.round(Math.abs(window.mouseY - this.posY)) / 2000;

		if (
			!(
				this.posX + this.width / 2 > window.mouseX - vaguely &&
				this.posX + this.width / 2 < window.mouseX + vaguely
			)
		) {
			if (this.posX + this.width / 2 > window.mouseX) {
				this.speedX = -Player.playerSpeed;
				this.accelerationX = this.accelerateLeft(this.accelerationX, distanceX);
			} else {
				this.speedX = Player.playerSpeed;
				this.accelerationX = this.accelerateRight(
					this.accelerationX,
					distanceX
				);
			}
		}
		if (
			!(
				this.posY + this.height / 2 < window.mouseY + vaguely &&
				this.posY + this.height / 2 > window.mouseY - vaguely
			)
		) {
			if (this.posY + this.height / 2 > window.mouseY) {
				this.speedY = -Player.playerSpeed;
				this.accelerationY = this.accelerateUp(this.accelerationY, distanceY);
			} else {
				this.speedY = Player.playerSpeed;
				this.accelerationY = this.accelerateDown(this.accelerationY, distanceY);
			}
		}
	}

	gyroscopeMovement(keysPressed) {
  if(keysPressed.beta != null && keysPressed.gamma != null){
		  this.accelerationY=keysPressed.beta;
    this.accelerationX=keysPressed.gamma/10 | 0;
  }
	}

	
	obtainScoreMultiplierBonus(){
		this.timerBeforeLosingScoreMultiplierBonus = Player.maxTimeForScoreMultiplierBonus;
		this.scoreMultiplierBonus=getRandomInt(WavesManager.difficulty)+2;
		document.querySelector('#scoreBonusValue').innerHTML = "x"+this.scoreMultiplierBonus;
	}

	loseScoreMuliplierBonus(){
		this.scoreMultiplierBonus=1;
		document.querySelector('#scoreBonusValue').innerHTML = "x1";
	}

	gotScoreMultiplierBonus(){
		return this.scoreMultiplierBonus!=1;
	}



	obtainIceMalus(){
		this.iceMultiplierMalus=1+WavesManager.difficulty;
		this.timerBeforeLosingIceMalus=Player.maxTimeIceMalus+((Player.maxTimeIceMalus/10 | 0)*WavesManager.difficulty);
	}

	loseIceMalus(){
		this.iceMultiplierMalus=1;
	}

	gotIceMalus(){
		return this.iceMultiplierMalus!=1;
	}


}