import {randomFloatFromInterval, getDifference, randomIntFromInterval, isInside} from '../libs/Dazzle.js'

export default {
    custom: {
        target: {
            x: 0,
            y: 0,
        },
        speedRange: 500,
        speedValue: 0,
    },
    load: current => {
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

        const world = current.scene.game.getGameObject('world')
        if(world.width > 10 && !isInside(current, world)) {
            current.load(current)
        }
    },
    update: current => {
        const player = current.scene.game.getGameObject('player')
        current.target = {x: player.x, y: player.y}

        if(getDifference(current.x, current.target.x) > current.scene.game.width/1.5) current.load(current)
        if(getDifference(current.y, current.target.y) > current.scene.game.height/1.5) current.load(current)

        const world = current.scene.game.getGameObject('world')
        if(!isInside(current, world)) {
            current.load(current)
        }

        const dt = current.scene.game.deltaTime
        current.x += current.speedValue * dt;
    }
}