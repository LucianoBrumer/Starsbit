
const server = 'http://localhost:3000' //'https://starsbit.io'
import {io} from './libs/socket.io.esm.min.js'
const socket = io.connect(server, {transports: ['websocket', 'polling', 'flashsocket'], upgrade: false, reconnection: false})


const World = {
    color: 'rgb(15, 15, 35)',

    onLoad: current => {
        current.x = -current.scene.worldLimit
        current.y = -current.scene.worldLimit
        current.width = current.scene.worldLimit * 2
        current.height = current.scene.worldLimit * 2
    }
}

const Star =  {
    target: {
        x: 0,
        y: 0,
    },
    speedRange: 500,
    speedValue: 0,

    onLoad: current => {
        current.x = randomFloatFromInterval(current.target.x - current.scene.game.width/2, current.target.x + current.scene.game.width/2);
        current.y = randomFloatFromInterval(current.target.y - current.scene.game.height/2, current.target.y + current.scene.game.height/2);

        current.size = randomFloatFromInterval(5, 15);
        current.width = current.size
        current.height = current.size

        current.speedValue = randomFloatFromInterval(-current.speedRange, current.speedRange);

        current.color = `
            rgb(
                ${randomIntFromInterval(0, 255)},
                ${randomIntFromInterval(0, 255)},
                ${randomIntFromInterval(0, 255)}
            )`;

        const world = current.scene.getGameObjectByName('world')
        if (!isInside(current, world)) {
            current.onLoad(current)
        }
    },

    onUpdate: current => {
        const player = current.scene.getGameObjectByName('player')
        current.target = {x: player.x, y: player.y}

        if (getDifference(current.x, current.target.x) > current.scene.game.width/1.5) current.onLoad(current)
        if (getDifference(current.y, current.target.y) > current.scene.game.height/1.5) current.onLoad(current)

        const world = current.scene.getGameObjectByName('world')
        if (!isInside(current, world)) {
            current.onLoad(current)
        }

        const dt = current.scene.game.deltaTime
        current.x += current.speedValue * dt;
    }
}

const Bullet = {
    tags: ['bullet'],

    speed: 0,
    playerID: null,
    active: false,
    disableDelay: 2000,
    disableTimeout: setTimeout(() => {}),

    disable: current => {
        clearTimeout(current.disableTimeout)

        current.active = false
    },

    shot: (current, x, y, speed) => {
        current.x = x
        current.y = y
        current.speed = speed
        current.active = true

        clearTimeout(current.disableTimeout);
        current.disableTimeout = setTimeout(() => current.disable(current), current.disableDelay)
    },

    onUpdate: current => {
        if(!current.active) return

        const world = current.scene.getGameObjectByName('world')
        if(!isInside(current, world)) {
            current.disable(current)
        }

        const dt = current.scene.game.deltaTime
        current.x += current.speed * dt;
    },
}

const Player = {
    color: 'transparent',
    width: 30,
    height: 30,
    tags: ['player'],

    local: false,
    size: 10,
    speedX: 0,
    speedY: 0,
    maxSpeed: 500,
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    shotDelay: 250,
    bulletsPool: 10,
    bullets: [],
    playerColor: '#ffffff',

    createBulletsPool: current => {
        current.bullets = []

        while (current.bullets.length < current.bulletsPool){
            const bullet = current.scene.instantGameObject({
                ...Bullet,
                x: current.x,
                y: current.y,
                color: current.playerColor,
                playerID: current.id,
            })
            current.bullets.push(bullet)
        }
    },

    shot: current => {
        const bulletSpeed = (current.maxSpeed * getSignWithOne(current.headPosition)) + (current.speedX * 1.25)
        const bulletSelected = current.bullets.shift()
        const bulletPosition = {
            x: current.x + (getSignWithOne(current.headPosition) == 1 ? current.width : -current.size),
            y: current.y + current.size
        }
        bulletSelected.shot(bulletSelected, bulletPosition.x, bulletPosition.y, bulletSpeed)
        current.bullets.push(bulletSelected)
    },

    death: current => {
        current.x = 0
        current.y = 0
        current.sendSocket(current)
    },

    sendSocket: current => {
        socket.emit('player', {
            id: current.id,
            x: current.x,
            y: current.y,
            playerColor: current.playerColor,
            speedX: current.speedX,
            speedY: current.speedY,
            moveUp: current.moveUp,
            moveDown: current.moveDown,
            moveLeft: current.moveLeft,
            moveRight: current.moveRight,
            headPosition: current.headPosition,
        })
    },

    sendSocketTimeout: current => setTimeout(() => {
        current.sendSocket(current)
        current.sendSocketTimeout(current)
    }, 1000),

    onLoad: current => {
        current.power = current.maxSpeed/12.5

        current.headPosition = current.size

        if(current.local) {
            current.playerColor = `
                rgb(
                    ${randomIntFromInterval(100, 255)},
                    ${randomIntFromInterval(100, 255)},
                    ${randomIntFromInterval(100, 255)}
                )`;

            current.createBulletsPool(current)

            current.sendSocketTimeout(current)
        }
    },

    onUpdate: current => {
        let worldLimit = current.scene.worldLimit

        if(current.x+current.size*3 > worldLimit) {
            current.moveRight = false
            current.x = worldLimit-current.size*3
        }
        if(current.x-current.size < -worldLimit) {
            current.moveLeft = false
            current.x = -worldLimit+current.size
        }
        if(current.y < -worldLimit) {
            current.moveUp = false
            current.y = -worldLimit
        }
        if(current.y+current.size*3 > worldLimit) {
            current.moveDown = false
            current.y = worldLimit-current.size*3
        }

        if(current.moveRight && current.speedX < current.maxSpeed) current.speedX += current.power;
        if(!current.moveRight && current.speedX > 0) current.speedX -= current.power;

        if(current.moveLeft && current.speedX > -current.maxSpeed) current.speedX -= current.power;
        if(!current.moveLeft && current.speedX < 0) current.speedX += current.power;

        if(current.moveDown && current.speedY < current.maxSpeed) current.speedY += current.power;
        if(!current.moveDown && current.speedY > 0) current.speedY -= current.power;

        if(current.moveUp && current.speedY > -current.maxSpeed) current.speedY -= current.power;
        if(!current.moveUp && current.speedY < 0) current.speedY += current.power;

        const dt = current.scene.game.deltaTime

        current.x += current.speedX * dt
        current.y += current.speedY * dt

        if (current.local) current.scene.game.camera.setTarget(current)

    },

    onRender: current => {
        current.scene.game.ctx.fillStyle = current.playerColor;

        current.scene.game.ctx.fillRect(current.x, current.y, current.size*2, current.size)
        current.scene.game.ctx.fillRect(current.x + current.headPosition, current.y + current.size, current.size*2, current.size)
        current.scene.game.ctx.fillRect(current.x, current.y + current.size*2, current.size*2, current.size)
    },

    onKeydown: ({event, current}) => {
        if(!current.local) return

        if (event.key == 'w') current.moveUp = true
        else if (event.key == 's') current.moveDown = true
        else if (event.key == 'a') {
            current.moveLeft = true
            current.headPosition = -current.size
        }
        else if (event.key == 'd') {
            current.moveRight = true
            current.headPosition = current.size
        }

        current.sendSocket(current)
    },
    onKeyup: ({event, current}) => {
        if(!current.local) return

        if (event.key == 'w') current.moveUp = false
        if (event.key == 's') current.moveDown = false
        if (event.key == 'a') current.moveLeft = false
        if (event.key == 'd') current.moveRight = false

        current.sendSocket(current)
    },
    onMousedown: ({event, current}) => {
        if(!current.local) return

        current.shot(current)

        current.sendSocket(current)
        socket.emit('shot', current.id)
    },
    onCollide: ({current, target}) => {
        if(!current.local) return

        if(target.tags.includes('bullet') && target.active && current.id != target.playerID) {
            target.disable(target)
            current.death(current)
        }
    },
}

const MainScene = {
    worldLimit: 1000,
    players: [],
    stars: [],
    maxStars: 7,

    gameObjects: {
        world: World,
        player: {
            ...Player,
            local: true
        }
    },

    onLoad: current => {
        while (current.stars.length < current.maxStars){
            const star = current.instantGameObject(Star)
            current.stars.push(star);
        }
    },
}

const game = new Game({
    backgroundColor: 'rgb(10, 10, 30)',
    fps: 60,
    cursor: false,
    title: 'Starsbit',
    width: window.screen.width,
    height: window.screen.height,

    scenes: {
        main: MainScene
    },

    onKeydown: ({event, current}) => {
        if (event.key == 'f') current.toggleFullscreen()
    },
})

game.run()

console.log('local player id:', game.getActiveScene().getGameObjectByName('player').id);

socket.on('player', socketPlayer => {
    const localPlayer = game.getActiveScene().getGameObjectByName('player')

    if (localPlayer.id !== socketPlayer.id) {
        const foundedSocketPlayer = game.getActiveScene().getGameObjectByID(socketPlayer.id)

        if (foundedSocketPlayer) {
            Object.entries(socketPlayer).forEach(([key, value]) => {
                foundedSocketPlayer[key] = value
            })
        } else {
            const newPlayer = game.getActiveScene().addGameObject(socketPlayer.id, {
                ...Player,
                ...socketPlayer,
            })


            newPlayer.createBulletsPool(newPlayer)
        }

        localPlayer.sendSocket(localPlayer)
    }
})

socket.on('shot', playerID => {
    const localPlayer = game.getActiveScene().getGameObjectByName('player')

    if (localPlayer.id !== playerID) {
        const targetPlayer = game.getActiveScene().getGameObjectByID(playerID)
        if (targetPlayer) targetPlayer.shot(targetPlayer)
    }
})

socket.on('displayer', playerID => {
    game.getActiveScene().removeGameObjectByID(playerID)
})