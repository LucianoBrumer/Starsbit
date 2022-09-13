const socket = io({transports: ['websocket'], upgrade: false})
let players = []
let bullets = []
let stars = []
let worldLimit = 2000
let maxStars = 10

try {
    if("ontouchstart" in document.documentElement){
        screen.orientation.lock('landscape');
        console.log('joysitck');
        document.addEventListener('orientationchange', e => {
            e.preventDefault()
            screen.orientation.lock('landscape');
        });
    }
} catch (error) {
    console.log(error);
}

class Star extends TruonObject{
    constructor(){
        super();
        this.create()
        this.element.classList.add("box");
    }
    update(){
        this.timeout = setTimeout(() => {

            if (getDistance(this, player) > Window.element.clientWidth/2) this.create()

            getDistance(this, player) > Window.element.clientWidth/2
                ? this.setVisible(false)
                : this.setVisible(true)

            this.x += this.speed;
            this.translate(this.x, this.y, this.z);
            this.update();
        }, 0)
    }
    create(){
        this.x = getRandomArbitrary(player.x - Window.element.clientWidth, player.x + Window.element.clientWidth);
        this.y = getRandomArbitrary(player.y - Window.element.clientHeight, player.y + Window.element.clientHeight);
        this.size = getRandomArbitrary(5, 15);
        this.scale(this.size, this.size)
        this.speed = getRandomArbitrary(-2.5, 2.5);
        this.color = `
            rgb(
                ${getRandomArbitrary(0, 255)},
                ${getRandomArbitrary(0, 255)},
                ${getRandomArbitrary(0, 255)}
            )`;
        this.element.style.backgroundColor = this.color;
    }
}

class Bullet extends TruonObject{
    constructor(x, y, z, width, height, color, playerId, id){
        super(x, y, z, width, height, color);

        this.element.classList.add("box");

        this.speed;
        this.playerId = playerId;
        this.id = id;

        this.active = false;
		this.deadTimeoutBool = false
    }
    update(){
        this.timeout = setTimeout(() => {
            if(this.active){
                this.setVisible(true)

                this.x += this.speed;
                this.translate(this.x, this.y, this.z);

				if(this.deadTimeoutBool == false){
					this.deadTimeoutBool = true
					this.deadTiemout = setTimeout(() => {
						clearTimeout(this.deadTimeout)
						this.active = false
					}, 1000)
				}
            }else{
                this.setVisible(false)
				clearTimeout(this.deadTimeout)
				this.deadTimeoutBool = false
            }
            this.update();
        }, 0)
    }
}

class Starship extends TruonObject{
    constructor(x, y, z, width, height, size, color, power, maxSpeed, bulletSpeed, control, mainPlayer, facing, id, name){
        super(x, y, z, width, height);

        this.element.classList.add("box");
        this.element.style.backgroundColor = 'transparent'

        this.color = color;
        this.size = size;
        this.control = control
        this.mainPlayer = mainPlayer;
        this.id = id;
        this.name = name;

        this.power = power;
        this.speedLeft = 0;
        this.speedRight = 0;
        this.speedUp = 0;
        this.speedDown = 0;
        this.maxSpeed = maxSpeed;

        this.bulletSpeed = bulletSpeed;

        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;

        this.cubex0y0 = new TruonObject(0, 0, 0, this.size * 2, this.size, this.color);

        this.cubex1y1 = new TruonObject(this.size, this.size, 0, this.size * 2, this.size, this.color);
        this.cubex_1y1 = new TruonObject(-this.size, this.size, 0, this.size * 2, this.size, this.color);

        this.cubex0y2 = new TruonObject(0, this.size*2, 0, this.size * 2, this.size, this.color);

        this.element.appendChild(this.cubex0y0.element);

        this.facing = facing;
        this.element.appendChild(this.cubex1y1.element);
        this.cubex1y1.setVisible(true);

        this.element.appendChild(this.cubex_1y1.element);
        this.cubex_1y1.setVisible(false);

        this.element.appendChild(this.cubex0y2.element);

        this.bullets = []
        for (let i = 0; i < 5; i++) {
            this.bullet = new Bullet(
                this.x + (this.facing == "right"
                    ? this.size
                    : -this.size),
                this.y + this.size,
                this.z,
                this.size,
                this.size,
                this.color,
                this.id,
                uuidv4()
            )
            this.bullets.push(this.bullet);
        }

        document.addEventListener("touchstart", e => this.touchStart(e));
    }
    update(){
        setTimeout(() => {
            if(this.mainPlayer){
                players.forEach(xPlayer => {
                    xPlayer.bullets.forEach(xBullet => {
                        if(isCollide(this, xBullet) && this.id !== xBullet.playerId && xBullet.active){
                            this.x = getRandomArbitrary(-worldLimit/3, worldLimit/3);
                            this.y = getRandomArbitrary(-worldLimit/3, worldLimit/3);

                            socket.emit('kill', xBullet.playerId)

                            xBullet.active = false;
                        }
                    })
                })

                this.element.setAttribute('id', this.id)
            }else{
                getDistance(this, player) > Window.element.clientWidth/2
                    ? this.setVisible(false)
                    : this.setVisible(true)
            }

            this.power = 0.1
            this.maxSpeed = 2.75
            this.bulletSpeed = 5
            worldLimit = 2000

            if(this.moveLeft){
                if(this.speedLeft < this.maxSpeed) this.speedLeft += this.power;
            }else{
                if(this.speedLeft > 0) this.speedLeft -= this.power;
            }

            if(this.moveRight){
                if(this.speedRight < this.maxSpeed) this.speedRight += this.power;
            }else{
                if(this.speedRight > 0) this.speedRight -= this.power;
            }

            if(this.moveUp){
                if(this.speedUp < this.maxSpeed) this.speedUp += this.power;
            }else{
                if(this.speedUp > 0) this.speedUp -= this.power;
            }

            if(this.moveDown){
                if(this.speedDown < this.maxSpeed) this.speedDown += this.power;
            }else{
                if(this.speedDown > 0) this.speedDown -= this.power;
            }

            if(this.facing == "left"){
                this.cubex1y1.setVisible(false);
                this.cubex_1y1.setVisible(true);
            }else{
                this.cubex1y1.setVisible(true);
                this.cubex_1y1.setVisible(false);
            }

            this.x = this.x - this.speedLeft + this.speedRight;
            this.y = this.y - this.speedUp + this.speedDown;

            this.translate(this.x, this.y, this.z)

            socket.emit('player', {
                id: this.id,
                x: this.x,
                y: this.y,
                color: this.color,
                facing: this.facing,
                name: this.name,
                bullets: this.bullets,
            })

            let xTarget = this.x
            let yTarget = this.y

            if(this.x + this.width + Window.element.clientWidth/2 > worldLimit) xTarget = worldLimit - Window.element.clientWidth/2 
            if(this.x - this.width - Window.element.clientWidth/2 < -worldLimit) xTarget = -worldLimit + Window.element.clientWidth/2 
            if(this.y + this.height + Window.element.clientHeight/2 > worldLimit) yTarget = worldLimit - Window.element.clientHeight/2 
            if(this.y - this.height - Window.element.clientHeight/2 < -worldLimit) yTarget = -worldLimit + Window.element.clientHeight/2 

			if(this.x + this.width > worldLimit) this.x = worldLimit - this.width
			if(this.x < -worldLimit) this.x = -worldLimit
			if(this.y + this.height > worldLimit) this.y = worldLimit - this.height
			if(this.y < -worldLimit) this.y = -worldLimit

            if(this.mainPlayer) Camera.smoothTarget(xTarget, yTarget, 15)

            if(Joystick.left) {
                this.keyDown({key: 'a'})
                this.rightTouch = true
            }else if(this.rightTouch){
                this.keyUp({key: 'a'})
            }

            if(Joystick.right) {
                this.keyDown({key: 'd'})
                this.leftTouch = true
            }else if(this.leftTouch){
                this.keyUp({key: 'd'})
            }

            if(Joystick.up) {
                this.keyDown({key: 'w'})
                this.upTouch = true
            }else if(this.upTouch){
                this.keyUp({key: 'w'})
            }

            if(Joystick.down) {
                this.keyDown({key: 's'})
                this.downTouch = true
            }else if(this.downTouch){
                this.keyUp({key: 's'})
            }

            this.update();
        }, 0)

    }
    keyDown(e){
        if(this.mainPlayer){
            if(e.key == this.control.up) this.moveUp = true;
            if(e.key == this.control.down) this.moveDown = true;
            if(e.key == this.control.right) {
                this.moveRight = true;
                this.facing = "right";
            }
            if(e.key == this.control.left) {
                this.moveLeft = true;
                this.facing = "left";
            }
        }
    }
    keyUp(e){
        if(this.mainPlayer){
            if(e.key == this.control.up) this.moveUp = false;
            if(e.key == this.control.down) this.moveDown = false;
            if(e.key == this.control.right) this.moveRight = false;
            if(e.key == this.control.left) this.moveLeft = false;
        }
    }
    shot(){
        this.bullet = this.bullets.find(bullet => !bullet.active)
        if(!this.bullet) {
            let bestBulletDis = 0
            let index = 0
            this.bullets.forEach((bullet, i) => {
                const bulletDis = getDistance(bullet, this)
                if(bulletDis > bestBulletDis) {
                    bestBulletDis = bulletDis
                    index = i
                }
            })
            this.bullet = this.bullets[index]
        }
        if(this.bullet){
            this.bullet.x = this.x + (this.facing == "right" ? this.size : -this.size)
            this.bullet.y = this.y + this.size
            this.bullet.speed = this.facing == "right" ? this.bulletSpeed : -this.bulletSpeed
            this.bullet.active = true
        }
    }
    mouseDown(){
        if(this.mainPlayer && !("ontouchstart" in document.documentElement)){
            this.shot()
            socket.emit('shot', this.id)
        }
    }
    touchStart(){
        if(this.mainPlayer){
            this.shot()
            socket.emit('shot', this.id)
        }
    }
    setName(name){
        this.name = name;
    }
}

let playerControl = {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd'
}

let player = {
    x: Window.element.clientWidth/2,
    y: Window.element.clientHeight/2
}

const nameForm = document.getElementById("name")
const nameInput = document.getElementById("name-input")
nameInput.focus()
const nameButton = document.getElementById("name-button")

nameForm.addEventListener('submit', e => {
    e.preventDefault()
    nameButton.parentElement.parentElement.style.display = 'none';
    Cursor.set('none')
    player = new Starship(10, 10, 0, 30, 30, 10, `rgb(${getRandomArbitrary(150,255)},${getRandomArbitrary(150,255)},${getRandomArbitrary(150,255)})`, 0.1, 2.75, 5, playerControl, true, "right", uuidv4(), nameInput.value);
    if("ontouchstart" in document.documentElement) {
        openFullscreen(Window.element)
        Joystick.setActive(true)
    }
})

Window.backgroundColor("rgb(0, 0, 15)");

for (let index = 0; index < maxStars; index++) {
    stars.push(new Star())
}

///////////////////////////////////////////////////////
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////

socket.on('players', socketPlayers => {
    socketPlayers.forEach(socketPlayer => {
        if(socketPlayer.id && socketPlayer.id !== player.id){
            if(!players.some(e => e.id === socketPlayer.id)){
                const newPlayer = new Starship(socketPlayer.x, socketPlayer.y, 0, 30, 30, 10, socketPlayer.color, 0.1, 2.75, 5, playerControl, false, socketPlayer.facing, socketPlayer.id, socketPlayer.name)
                players.push(newPlayer)
            }else{
                players.forEach(editPlayer => {
                    if(editPlayer.id === socketPlayer.id){
                        editPlayer.x = socketPlayer.x;
                        editPlayer.y = socketPlayer.y;
                        editPlayer.facing = socketPlayer.facing;
                    }
                })
            }
        }
    });
})

socket.on('shot', id => {
    if(player.id !== id) {
        players.find(x => x.id === id).shot()
    }
})

const scoreBoard = document.getElementById("scoreboard");
socket.on("kills", (kills) => {
	kills.forEach((kill, index) => {
		scoreBoard.children[index].textContent = `${index + 1}# ${kill.name}: ${kill.kills}`
	});
});

socket.on('ping', () => {
    socket.emit('pong', player.id)
})

socket.on('displayer', id => {
    if(id && id !== player.id) {
        players.find(x => x.id === id).destroy()
    }
})