const server = 'http://localhost:3000' //'https://starsbit.io'
import {io} from '../libs/socket.io.esm.min.js'
const socket = io.connect(server, {transports: ['websocket', 'polling', 'flashsocket'], upgrade: false, reconnection: false})

import { getSignWithOne, randomIntFromInterval } from '../libs/Dazzle.js'
import Bullet from './Bullet.js'

export default {
    color: 'rgba(255, 255, 255, 0)',
    width: 30,
    height: 30,
    tags: ['player'],
    custom: {
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
        createBullets: current => {
            current.bullets = []
            while (current.bullets.length < current.bulletsPool){
                const bullet = current.scene.game.instantGameObject({
                    ...Bullet,
                    x: current.x,
                    y: current.y,
                    color: current.playerColor,
                    custom: {
                        ...Bullet.custom,
                        playerID: current.id,
                    }
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
    },
    load: current => {
        current.power = current.maxSpeed/12.5

        current.headPosition = current.size

        if(current.local) {
            current.playerColor = `
                rgb(
                    ${randomIntFromInterval(100, 255)},
                    ${randomIntFromInterval(100, 255)},
                    ${randomIntFromInterval(100, 255)}
                )`;

            current.createBullets(current)

            current.sendSocketTimeout(current)
        }
    },
    update: current => {
        current.scene.game.ctx.fillStyle = current.playerColor;
        current.scene.game.ctx.fillRect(current.x, current.y, current.size*2, current.size)
        current.scene.game.ctx.fillRect(current.x + current.headPosition, current.y + current.size, current.size*2, current.size)
        current.scene.game.ctx.fillRect(current.x, current.y + current.size*2, current.size*2, current.size)

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
    },
    keyDown: ({event, current}) => {
        if(!current.local) return

        if(event.key == 'w') current.moveUp = true
        else if(event.key == 's') current.moveDown = true
        else if(event.key == 'a') {
            current.moveLeft = true
            current.headPosition = -current.size
        }
        else if(event.key == 'd') {
            current.moveRight = true
            current.headPosition = current.size
        }

        current.sendSocket(current)
    },
    keyUp: ({event, current}) => {
        if(!current.local) return

        if(event.key == 'w') current.moveUp = false
        if(event.key == 's') current.moveDown = false
        if(event.key == 'a') current.moveLeft = false
        if(event.key == 'd') current.moveRight = false

        current.sendSocket(current)
    },
    mouseDown: ({event, current}) => {
        if(!current.local) return

        current.shot(current)

        // current.sendSocket(current)
        socket.emit('shot', current.id)
    },
    onCollide: ({current, target}) => {
        // if(!current.local) return

        if(target.tags.includes('bullet') && target.active && current.id != target.playerID) {
            target.disable(target)
            current.death(current)
        }
    },
}