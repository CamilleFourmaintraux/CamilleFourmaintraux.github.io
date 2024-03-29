import { Entity } from "./entity.js";
import {isInGame} from './main.js';

const keysPressed = {
 onPhone:false,
	MouseMode:false,
	ArrowUp: false,
	ArrowDown: false,
	ArrowLeft: false,
	ArrowRight: false,
	Space: false,
	MouseDown:false,
	alpha: 0,
	beta: 0,
	gamma: 0,
};

window.addEventListener('keydown', event => {
	if(isInGame){
		if (down(event)) {
			keysPressed.ArrowDown = true;
		}
		if (up(event)) {
			keysPressed.ArrowUp = true;
		}
		if (left(event)) {
			keysPressed.ArrowLeft = true;
		}
		if (right(event)) {
			keysPressed.ArrowRight = true;
		}
		if (event.key == ' ') {
			keysPressed.Space = true;
		}
		if (event.key == 'M' || event.key == 'm') {
			if(keysPressed.MouseMode){
				keysPressed.MouseMode=false;
			}else{
				keysPressed.MouseMode=true;
			}
		}
		if (event.key == 'C' || event.key == 'c') {
			if(Entity.showCollisions){
				Entity.showCollisions=false;
			}else{
				Entity.showCollisions=true;
			}
		}
	}
});

window.addEventListener('keyup', event => {
	if (down(event)) {
		keysPressed.ArrowDown = false;
	}
	if (up(event)) {
		keysPressed.ArrowUp = false;
	}
	if (left(event)) {
		keysPressed.ArrowLeft = false;
	}
	if (right(event)) {
		keysPressed.ArrowRight = false;
	}
	if (event.key == ' ') {
		keysPressed.Space = false;
	}
});

window.mouseX = 0;
window.mouseY = 0;
window.onmousemove = function(e) {
	window.mouseX = e.x;
	window.mouseY = e.y;
}

function down(event){
	return event.key == 'ArrowDown' || event.key == 's' ||event.key=='S';
}

function up(event){
	return event.key == 'ArrowUp' || event.key == 'z' || event.key == 'Z';
}

function right(event){
	return event.key == 'ArrowRight' || event.key == 'd' || event.key == 'D';
}

function left(event){
	return event.key == 'ArrowLeft' || event.key == 'q' || event.key == 'Q';
}

export default keysPressed;
