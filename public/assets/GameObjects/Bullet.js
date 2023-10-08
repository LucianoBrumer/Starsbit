import {isInside} from '../libs/Dazzle.js'

export default {
    tags: ['bullet'],
    custom: {
        speed: 0,
        playerID: null,
        active: false,
        disableDelay: 2000,
        disableTimeout: setTimeout(() => {}),
        disable: current => {
            clearTimeout(current.disableTimeout);
            current.active = false;
        },
        shot: (current, x, y, speed) => {
            current.x = x
            current.y = y
            current.speed = speed
            current.active = true
            clearTimeout(current.disableTimeout);
            current.disableTimeout = setTimeout(() => current.disable(current), current.disableDelay)
        },
    },
    load: current => {
    },
    update: current => {
        if(!current.active) return

        const world = current.scene.game.getGameObject('world')
        if(!isInside(current, world)) {
            current.disable(current)
        }

        const dt = current.scene.game.deltaTime
        current.x += current.speed * dt;
    },
}