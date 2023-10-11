export default {
    color: 'rgb(15, 15, 35)',
    load: current => {
        current.x = -current.scene.worldLimit
        current.y = -current.scene.worldLimit
        current.width = current.scene.worldLimit * 2
        current.height = current.scene.worldLimit * 2
    }
}