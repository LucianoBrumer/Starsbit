const server = 'http://localhost:3000' //'https://starsbit.io'
const socket = io.connect(server, {transports: ['websocket', 'polling', 'flashsocket'], upgrade: false, reconnection: false})

import {Game} from '../libs/Dazzle.js'

import Player from '../GameObjects/Player.js'
import Star from '../GameObjects/Star.js'
import World from '../GameObjects/World.js'

const game = new Game({
    backgroundColor: 'rgb(10, 10, 30)',
    fps: 60,
    cursor: false,
    fullWindow: true,
    scenes: {
        main: {
            custom: {
                worldLimit: 1000,
                players: [],
                stars: [],
                maxStars: 7
            },
            gameObjects: {
                'world': World,
                'player': {
                    ...Player,
                    custom: {
                        ...Player.custom,
                        local: true
                    }
                },
            },
            load: current => {
                while (current.stars.length < current.maxStars){
                    const star = current.game.instantGameObject(Star)
                    current.stars.push(star);
                }
            },
            update: current => {
                const player = current.game.getGameObject('player')
                current.game.cameraTarget(player, 3)
            }
        }
    },
    keyDown: ({event, current}) => {
        if(event.key == 'f') current.setFullscreen(!current.fullScreen)
    }
})

// console.log('local player id: ' + game.getGameObject('player').id);

socket.on('player', socketPlayer => {
    const localPlayer = game.getGameObject('player')

    if(localPlayer.id !== socketPlayer.id){
        if(game.getGameObject(socketPlayer.id)){
            game.scenes[game.activeScene].gameObjects[socketPlayer.id].x = socketPlayer.x
            game.scenes[game.activeScene].gameObjects[socketPlayer.id].y = socketPlayer.y
            game.scenes[game.activeScene].gameObjects[socketPlayer.id].headPosition = socketPlayer.headPosition
            // game.scenes[game.activeScene].gameObjects[socketPlayer.id].playerColor = socketPlayer.playerColor
            game.scenes[game.activeScene].gameObjects[socketPlayer.id].speedX = socketPlayer.speedX
            game.scenes[game.activeScene].gameObjects[socketPlayer.id].speedY = socketPlayer.speedY
            game.scenes[game.activeScene].gameObjects[socketPlayer.id].moveLeft = socketPlayer.moveLeft
            game.scenes[game.activeScene].gameObjects[socketPlayer.id].moveRight = socketPlayer.moveRight
            game.scenes[game.activeScene].gameObjects[socketPlayer.id].moveDown = socketPlayer.moveDown
            game.scenes[game.activeScene].gameObjects[socketPlayer.id].moveUp = socketPlayer.moveUp
        }else{
            const newPlayer = game.createGameObject(socketPlayer.id, {
                ...Player,
                ...socketPlayer,
                custom: {
                    ...Player.custom,
                    headPosition: socketPlayer.headPosition,
                    playerColor: socketPlayer.playerColor,
                    speedX: socketPlayer.speedX,
                    speedY: socketPlayer.speedY,
                    moveLeft: socketPlayer.moveLeft,
                    moveRight: socketPlayer.moveRight,
                    moveDown: socketPlayer.moveDown,
                    moveUp: socketPlayer.moveUp,
                }
            })

            game.scenes[game.activeScene].gameObjects[socketPlayer.id].createBullets(game.scenes[game.activeScene].gameObjects[socketPlayer.id])
        }

        localPlayer.sendSocket(localPlayer)
    }
})

socket.on('shot', playerId => {
    const localPlayer = game.getGameObject('player')

    if(localPlayer.id !== playerId){
        const targetPlayer = game.getGameObject(playerId)
        if(targetPlayer) targetPlayer.shot(targetPlayer)
    }
})

socket.on('displayer', playerId => {
    game.removeGameObject(playerId)
})