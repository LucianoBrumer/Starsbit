function isCollide(a, b) {
    return !(
        ((a.y + a.height) < (b.y)) ||
        (a.y > (b.y + b.height)) ||
        ((a.x + a.width) < b.x) ||
        (a.x > (b.x + b.width))
    )
}

function isInside(a, b){
    return (
        (a.x > b.x && a.x < b.x + b.width) &&
        (a.y > b.y && a.y < b.y + b.height)
    )
}

const positionsMatch = (a, b) => a.x === b.x && a.y === b.y

function getDistance(a, b){
    let y = b.x - a.x;
    let x = b.y - a.y;
    return Math.sqrt(x * x + y * y)
}

const getDifference = (a, b) => Math.abs(a - b)

function getSignWithOne(number) {
    if (number === 0) return 0;
    
    return Math.abs(number) / number;
}

const randomFloatInInterval = inter => Math.random() * (inter - (-inter)) + inter

const randomIntInInterval = inter => Math.floor(Math.random() * (inter - (-inter) + 1) + inter)

const randomFloatFromInterval = (min, max) => Math.random() * (max - min) + min

const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

const randomItemFromArray = array => array[Math.floor(Math.random() * array.length)]

const cloneObject = obj => Object.assign({}, obj)

const defaultGameObjectProps = {
    name: null,
    scene: null,
    x: 0, 
    y: 0, 
    z: 0, 
    width: 10, 
    height: 10, 
    color: "#fff", 
    alpha: 255, 
    scale_x: 1, 
    scale_y: 1,
    rotation: 0, 
    tags: [], 
    gui: false, 
    ignorePause: false, 
    active: true, 
    visible: true,
}

class GameObject {
    constructor(props) {
        this.id = crypto.randomUUID()
        
        props = {
            ...defaultGameObjectProps,
            ...props
        }

        Object.entries(props).forEach(([key, value]) => {
            this[key] = value
        })
    }

    render() {
        this.scene.game.ctx.fillStyle = this.color

        this.scene.game.ctx.fillRect(this.x, this.y, this.width, this.height)
    }

    addTag(tag) {
        this.tags.push(tag)    }

    removeTag(tag) {
        this.tags.splice(this.tags.indexOf(tag), 1)
    }

    hasTag(tag) {
        return this.tag.includes(tag)
    }
        
    getTags() {
        return this.tags
    }

    setZ(z) {
        this.z = z
        this.scene.sort_game_objects_by_z()
    }

    setSize(width, height) {
        this.width = width
        this.height = height 
    }

    setVisible(visible = true) {
        this.visible = visible
    }

    setInvisible() {
        this.visible = false
    }

    setActive(active = true) {
        this.active = active
    }

    setInactive() {
        this.active = false
    }
}

const defaultCameraProps = {
    game: null, 
    x: 0, 
    y: 0, 
    delay: 1, 
    zoom: 1.0, 
    minZoom: 0.1, 
    maxZoom: 3.0
}

class Camera {
    constructor(props) {
        props = {
            ...defaultCameraProps,
            ...props
        }

        Object.entries(props).forEach(([key, value]) => {
            this[key] = value
        })
    }

    setTarget(target) {
        this.x += ((target.x + target.width/2) - this.x) / this.delay
        this.y += ((target.y + target.height/2) - this.y) / this.delay
    }

    setPosition(x, y) {
        this.x = x
        this.y = y
    }

    setZoom(zoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom))
    }
}

const defaultSceneProps = {
    game: null,
    name: null,
    ignorePause: false,
    gameObjects: {},
}

class Scene {
    constructor(props) {
        props = {
            ...defaultSceneProps,
            ...props
        }

        Object.entries(props).forEach(([key, value]) => {
            this[key] = value
        })

        this.gameObjectsProps = props.gameObjects
        this.gameObjects = {}
        Object.entries(props.gameObjects).forEach(([name, gameObject]) => {
            this.addGameObject(name, gameObject)
        })
    }

    sortGameObjectsByZ() {

    }

    addGameObject(name , gameObject) {
        const newGameObject = new GameObject({
            ...gameObject,
            name: name,
            scene: this
        })

        Object.entries(gameObject).forEach(([key, value]) => {
            if (!(key in newGameObject)) newGameObject[key] = value
        })

        this.gameObjects[name] = newGameObject

        if (newGameObject['onLoad'] && typeof newGameObject['onLoad'] === 'function') newGameObject.onLoad(newGameObject)

        return newGameObject
    }

    instantGameObject(gameObject) {
        return this.addGameObject(crypto.randomUUID(), gameObject)
    }

    getGameObjectByName(name) {
        return this.gameObjects[name]
    }

    getGameObjectByID(id) {
        return Object.values(this.gameObjects).find(gameObject => gameObject.id === id)
    }

    getGameObjectsByTag(tag) {
        return Object.values(this.gameObjects).filter(gameObject => gameObject.tags.includes(tag))
    }

    getGameObjects(){
        return this.gameObjects
    }

    removeGameObjectByName(name) {
        delete this.gameObjects[name]
    }

    removeGameObjectByID(id) {
        delete this.removeGameObjectByName(this.getGameObjectByID(id).name)
    }
}

const defaultGameProps = {
    width: 500,
    height: 500,
    canvas: null,
    id: 'game',
    class: '',
    title: 'Title',
    backgroundColor: '#fff',
    cursor: true,
    cursorStyle: 'default',
    fps: 60,
    events: ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseout', 'mouseover', 'change', 'focus', 'blur', 'select', 'keydown', 'keyup'],
    contextMenu: false,
    running: false,
    fullScreen: false,
    scenes: {
        main: {...defaultSceneProps}
    },
    activeScene: 'main',
    camera: {...defaultCameraProps}
}

class Game {
    constructor(props) {
        props = {
            ...defaultGameProps,
            ...props
        }

        Object.entries(props).forEach(([key, value]) => {
            this[key] = value
        })

        this.camera = new Camera({
            ...props.camera,
            game: this,
            x: this.width/2,
            y: this.height/2
        })  

        this.cv = props.canvas
        if(!this.cv) {
            this.cv = document.createElement("canvas")
            this.cv.setAttribute('id', props.id);
            this.cv.setAttribute('class', props.class);
        }
        this.ctx = this.cv.getContext("2d");

        if(!document.body.contains(this.cv)) document.body.appendChild(this.cv)

        this.setTitle(props.title)
        this.setSize(props.width, props.height)
        this.setBackgroundColor(props.backgroundColor)
        this.setCursorStyle(props.cursorStyle)
        this.setCursorVisibility(props.cursor)

        this.fullScreen = props.fullScreen
        if (this.fullScreen === true) this.setFullscreen(this.fullScreen)

        this.events = props.events
        this.events.forEach(eventName => {
            window.addEventListener(eventName, event => {
                const methodEventName = `on${eventName.charAt(0).toUpperCase() + eventName.slice(1).toLowerCase()}`

                if (this[methodEventName] && typeof this[methodEventName] === 'function') this[methodEventName]({event, current: this})

                const activeScene = this.getActiveScene()
                if (activeScene[methodEventName] && typeof activeScene[methodEventName] === 'function') activeScene[methodEventName]({event, current: activeScene})

                const gameObjects = activeScene.getGameObjects()
                Object.entries(gameObjects).forEach(([name, gameObject]) => {
                    if (gameObject[methodEventName] && typeof gameObject[methodEventName] === 'function') gameObject[methodEventName]({event, current: gameObject})
                })
            })
        })

        this.fps = props.fps

        this.contextMenu = props.contextMenu
        if (!this.contextMenu) this.cv.addEventListener('contextmenu', this.disableContextMenu)

        this.pause = false
        this.running = props.running

        this.activeScene = props.activeScene
        this.scenesProps = props.scenes
        this.scenes = {}

        Object.entries(props.scenes).forEach(([name, scene]) => {
            this.addScene(name, scene)
        })

        if (this['onLoad'] && typeof this['onLoad'] === 'function') this.onLoad(this)
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    run() {
        this.lastTick = Date.now()
        this.deltaTime = 0

        const update = () => {
            const now = Date.now();
            this.deltaTime = (now - this.lastTick)/1000;
            this.currentFPS = 1000 / (now - this.lastTick)
            this.lastTick = now

            this.ctx.save()
            this.clear()

            this.ctx.translate(this.width/2, this.height/2)
            this.ctx.scale(this.camera.zoom, this.camera.zoom);
            this.ctx.translate(-(this.camera.x), -(this.camera.y))

            if (this.onUpdate && typeof this.onUpdate === 'function' && !this.pause) this.onUpdate(this)
            if (this.onRender && typeof this.onRender === 'function') this.onRender(this)

            const activeScene = this.getActiveScene()
            if (activeScene.onUpdate && typeof activeScene.onUpdate === 'function' && !this.pause) activeScene.onUpdate(activeScene)
            if (activeScene.onRender && typeof activeScene.onRender === 'function') activeScene.onRender(activeScene)

            const gameObjects = activeScene.getGameObjects()
            Object.entries(gameObjects).forEach(([name, gameObject]) => {
                if (gameObject.onUpdate && typeof gameObject.onUpdate === 'function' && !this.pause && gameObject.active) gameObject.onUpdate(gameObject)
                if (gameObject.onRender && typeof gameObject.onRender === 'function' && gameObject.active && gameObject.visible) gameObject.onRender(gameObject)
                if (gameObject.render && typeof gameObject.render === 'function' && gameObject.active && gameObject.visible) gameObject.render()
                
                Object.entries(gameObjects).forEach(([checkName, checkGameObject]) => {
                    if (gameObject.id !== checkGameObject.id) {

                        if (isCollide(gameObject, checkGameObject) && gameObject.onCollide && typeof gameObject.onCollide === 'function') {
                            gameObject.onCollide({current: gameObject, target: checkGameObject})
                        }

                        if (positionsMatch(gameObject, checkGameObject) && gameObject.onPositionMatch && typeof gameObject.onPositionMatch === 'function'){
                            gameObject.onPositionMatch({current: gameObject, target: checkGameObject})
                        }

                        if (isInside(gameObject, checkGameObject)  && gameObject.onInside && typeof gameObject.onInside === 'function'){
                            gameObject.onInside({current: gameObject, target: checkGameObject})
                        }

                    }
                })
            })

            this.ctx.restore()
        }

        this.updateInterval = setInterval(update, 1000/this.fps);
    }

    stop() {
        clearInterval(this.updateInterval)
    }

    addScene(name, scene) {
        const sceneProps = {
            ...scene,
            name: name,
            game: this
        }

        const newScene = new Scene(sceneProps)

        this.scenes[name] = newScene

        if (newScene['onLoad'] && typeof newScene['onLoad'] === 'function') newScene.onLoad(newScene)

        return newScene
    }

    changeScene(name) {
        this.activeScene = name
    }

    setScene(name, scene) {
        this.addScene(name, scene)
        this.changeScene(name)
    }

    getActiveScene() {
        return this.scenes[this.activeScene]
    }

    removeScene(name) {
        delete this.scenes[name]
    }

    resetScene() {
        this.setScene(this.activeScene, this.scenesProps[this.activeScene])
    }

    setPause(pause) {
        this.pause = pause

        if (this.pause) {
            this.customEvent('pause')
        } else {
            this.customEvent('resume')
        }
    }

    togglePause() {
        this.setPause(!this.pause)
    }

    setTitle(title) {
        this.title = title
        document.title = this.title
    }

    setSize(width, height){
        this.width = width;
        this.height = height;

        this.cv.width = width;
        this.cv.height = height;

        this.cv.style.width = `${width}px`
        this.cv.style.height = `${height}px`
    }

    setBackgroundColor(backgroundColor){
        this.backgroundColor = backgroundColor
        this.cv.style.backgroundColor = backgroundColor
    }

    setCursorStyle(cursor = "default"){
        this.cursorStyle = cursor
        this.cv.style.cursor = cursor
    }

    setCursorVisibility(cursor = true) {
        this.cursor = cursor
        cursor ? this.cv.style.cursor = 'default' : this.cv.style.cursor = 'none'
    }

    toggleCursorVisibility() {
        this.setCursorVisibility(!this.cursor)
    }

    hideCursor() {
        this.setCursorVisibility(false)
    }

    showCursor() {
        this.setCursorVisibility(true)
    }

    disableContextMenu(event) {
        event.preventDefault()
    }

    enableContextMenu() {
        this.contextMenu = true
        this.cv.removeEventListener('contextmenu', this.disableContextMenu)
    }

    screenshot(){
        return this.cv.toDataURL('image/png')
    }

    downloadScreenshot(){
        const a = document.createElement("a")
        a.href = this.screenshot()
        a.download = `${document.title} - screenshot.png`;
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
    }

    setFPS(fps){
        clearInterval(this.updateInterval)
        this.fps = fps
        this.updateListener()
    }

    getMousePosition(event){
        const rect = this.cv.getBoundingClientRect();
        this.getMouse = {
            x: (event.clientX - rect.left) - (-this.camera.x + this.width/2),
            y: (event.clientY - rect.top) - (-this.camera.y + this.height/2)
        }
    }

    async setFullscreen(fullscreen = true){
        this.fullScreen = fullscreen
        if (fullscreen){
            try {
                if (this.cv.requestFullscreen) {
                    await this.cv.requestFullscreen()
                } else if (this.cv.webkitRequestFullscreen) {
                    await this.cv.webkitRequestFullscreen()
                } else if (this.cv.msRequestFullscreen) {
                    await this.cv.msRequestFullscreen()
                }
            } catch (error) {}
        }else{
            try {
                await document.exitFullscreen()
            } catch (error) {}
        }
    }

    toggleFullscreen() {
        this.setFullscreen(!this.fullScreen)
    }

    customEvent(eventName) {
        const eventMethodName = `on${eventName.charAt(0).toUpperCase() + eventName.slice(1).toLowerCase()}`

        if (this[eventMethodName] && typeof this[eventMethodName] === 'function') this[eventMethodName](this)

        const activeScene = this.getActiveScene()
        if (activeScene[eventMethodName] && typeof activeScene[eventMethodName] === 'function') activeScene[eventMethodName](activeScene)

        const gameObjects = activeScene.getGameObjects()
        Object.values(gameObjects).forEach(gameObject => {
            if (gameObject[eventMethodName] && typeof gameObject[eventMethodName] === 'function') gameObject[eventMethodName](gameObject)
        })
    }
}