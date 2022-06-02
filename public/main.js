const socket = io()
let players = []
let bullets = []
let stars = []

class Cube extends TruonObject{
    constructor(x, y, z, width, height, color){
        super(x, y, z, width, height);
        this.element.style.backgroundColor = color;
    }
}

class Star extends TruonObject{
    constructor(){
        super();
        this.create()
        this.element.classList.add("box");
    }
    update(){
        this.timeout = setTimeout(() => {

            if (getDistance(this, player) > Window.element.clientWidth) this.create()

            getDistance(this, player) > Window.element.clientWidth/2
                ? this.setVisible(false)
                : this.setVisible(true)

            this.x += this.speed;
            this.translate(this.x, this.y, this.z);
            // if(
            //     this.x < this.minX ||
            //     this.x > this.maxX ||
            //     this.y < this.minY ||
            //     this.y > this.maxY
            // )   this.create()
            // this.x < 0 && this.create();
            this.update();
        }, 1)
    }
    create(){
        this.x = getRandomArbitrary(player.x - Window.element.clientWidth, player.x + Window.element.clientWidth);
        this.y = getRandomArbitrary(player.y - Window.element.clientHeight, player.y + Window.element.clientHeight);
        this.size = getRandomArbitrary(5, 15);
        this.scale(this.size, this.size)
        this.speed = getRandomArbitrary(-2.5, 2.5);
        // this.speed > 0 ? this.x = 0 : this.x = Window.element.clientWidth
        // this.speed == 0 ? this.speed = 0.5 : this.speed;
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
    constructor(x, y, z, width, height, color, speed, playerId, id){
        super(x, y, z, width, height);

        this.element.classList.add("box");

        this.cube = new Cube(0, 0, 0, width, height, color);
        this.element.appendChild(this.cube.element);

        this.speed = speed;
        this.playerId = playerId;
        this.id = id;

        this.timeout;

        setTimeout(() => {
            clearTimeout(this.timeout);
            if(document.body.contains(this.element)){
                this.destroy();
                socket.emit('bulletdead', {
                    id: this.id
                });
            }
        }, 1250)

    }
    update(){
        this.timeout = setTimeout(() => {
            this.x += this.speed;
            this.translate(this.x, this.y, this.z);
            this.update();
        }, 1)
    }
}

class Starship extends TruonObject{
    constructor(x, y, z, width, height, size, power, maxSpeed, bulletSpeed, shotPush, control, mainPlayer, facing, id){
        super(x, y, z, width, height);

        this.element.classList.add("box");

        this.size = size;
        this.control = control
        this.mainPlayer = mainPlayer;
        this.id = id;

        this.power = power; 
        this.speedLeft = 0;
        this.speedRight = 0;
        this.speedUp = 0;
        this.speedDown = 0;
        this.maxSpeed = maxSpeed;

        this.bulletSpeed = bulletSpeed;
        this.shotPush = shotPush;

        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;

        this.cubex0y0 = new Cube(0, 0, 0, this.size * 2, this.size, "#fff");

        this.cubex1y1 = new Cube(this.size, this.size, 0, this.size * 2, this.size, "#fff");
        this.cubex_1y1 = new Cube(-this.size, this.size, 0, this.size * 2, this.size, "#fff");

        this.cubex0y2 = new Cube(0, this.size*2, 0, this.size * 2, this.size, "#fff");

        this.element.appendChild(this.cubex0y0.element);

        this.facing = facing;
        this.element.appendChild(this.cubex1y1.element);
        this.cubex1y1.setVisible(true);

        this.element.appendChild(this.cubex_1y1.element);
        this.cubex_1y1.setVisible(false);

        this.element.appendChild(this.cubex0y2.element);
    }
    update(){
        setTimeout(() => {
            if(this.mainPlayer){
                // Camera.smoothTarget(this.x + this.size * 2, this.y + this.size *2, 25)
                // console.log(this.x, this.y);
                // Camera.target(this.x + this.size * 2, this.y + this.size *2)
                // console.log(bullets);
                let existBullets = bullets.filter(bullet => {return document.body.contains(bullet.element)});
                // console.log(existBullets);
                existBullets.forEach(bullet => {
                    if(isCollide(player, bullet) && this.id !== bullet.playerId) {

                        this.x = 0;
                        this.y = 0;

                        socket.emit('kill', {
                            id: bullet.playerId
                        })

                        bullet.destroy();
                        socket.emit('bulletdead', {
                            id: bullet.id
                        });

                    }
                })

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
            }else{
                getDistance(this, player) > Window.element.clientWidth/2
                    ? this.setVisible(false)
                    : this.setVisible(true)
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

            this.translate(this.x, this.y, this.z);

            socket.emit('player', {
                id: this.id,
                x: this.x,
                y: this.y,
                facing: this.facing,
            })

            // if(this.mainPlayer) Camera.smoothTarget(this.x, this.y, 15)
            if(this.mainPlayer) Camera.target(this.x, this.y)

            this.update();
        }, 1)

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
    mouseDown(){
        if(this.mainPlayer){
            // this.facing == "right" 
            //         ? this.x -= this.shotPush
            //         : this.x += this.shotPush 
            this.bullet = new Bullet(
                this.x + (this.facing == "right" 
                    ? this.size 
                    : -this.size), 
                this.y + this.size, 
                this.z, 
                this.size, 
                this.size, 
                "#fff", 
                this.facing == "right" 
                    ? this.bulletSpeed 
                    : -this.bulletSpeed,
                this.id,
                uuidv4()
            )
            bullets.push(this.bullet);
            socket.emit('bullet', {
                id: this.bullet.id,
                x: this.bullet.x,
                y: this.bullet.y,
                speed: this.bullet.speed,
                playerId: this.bullet.playerId,
            });
        }
    }
}

let playerControl = {
    up: 'w',
    down: 's',
    left: 'a',
    right: 'd'
}

const player = new Starship(0, 0, 0, 30, 30, 10, 0.025, 3.75, 7.5, 10, playerControl, true, "right", uuidv4());

Window.cursor("none");
Window.backgroundColor("rgb(0, 0, 15)");

for (let index = 0; index < 50; index++) {
    stars.push(new Star())
}

// function loop(){
//     setTimeout(() => {

//         TopKills[player.id] = player.kills
//         players.forEach(pl => {
//             TopKills[pl.id] = pl.kills
//         })
        
//         for (let i = 0; i < 10; i++) {
//             scoreBoard.children[i].textContent = `${i+1}#`
//         }

//         loop()
//     }, 1)
// }
// loop()

///////////////////////////////////////////////////////
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////

socket.on('players', socketPlayers => {
    socketPlayers.forEach(socketPlayer => {
        if(socketPlayer.id !== player.id){
            if(!players.some(e => e.id === socketPlayer.id)){
                // console.log('new Player');
                players.push(new Starship(socketPlayer.x, socketPlayer.y, 0, 30, 30, 10, 0.025, 3.75, 7.5, 10, playerControl, false, socketPlayer.facing, socketPlayer.id))
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

socket.on('bullets', socketBullets => {
    //console.log('bullets?');
    socketBullets.forEach(socketBullet=> {
        if(!bullets.some(e => e.id === socketBullet.id)){
            // console.log(
            //     'new Bullet', 
            //     socketBullet.x, 
            //     socketBullet.y, 
            //     0, 
            //     10, 
            //     10, 
            //     "#fff", 
            //     socketBullet.speed,
            //     socketBullet.playerId,
            //     socketBullet.id
            // );
            bullets.push(new Bullet(
                socketBullet.x, 
                socketBullet.y, 
                0, 
                10, 
                10, 
                "#fff", 
                socketBullet.speed,
                socketBullet.playerId,
                socketBullet.id
            ))
        }
    });
})

const scoreBoard = document.getElementById('scoreboard')

socket.on('kills', kills => {

    Object.entries(kills).forEach(([key, value], index) => {
        if(index < 10) scoreBoard.children[index].textContent = `${index+1}# ${key}: ${value}`
    })

})

socket.on('displayer', id => {

    displayer(id)
    
})

function displayer(id){
    console.log(`Player dis: ${id}`);
    players.find(x => x.id === id).destroy();
}