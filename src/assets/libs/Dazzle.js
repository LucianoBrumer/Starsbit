export class Game{
    constructor({
        width = 500,
        height = 500,
        id = 'game',
        backgroundColor = '#fff',
        cursor = true,
        fps = 60,
        disableContextMenu = true,
        camera = {},
        fullWindow = false,
        fullScreen = false,
        activeScene = 'main',
        scenes = {main: {}},
        keyUp = e => {},
        keyDown = e => {},
        mouseDown = e => {},
        mouseUp = e => {},
        mouseMove = e => {},
        touchStart = e => {},
        touchEnd = e => {},
        touchMove = e => {},
        custom = {},
        load = () => {},
        render = () => {},
        update = () => {},
        onPause = () => {},
        onUnpause = () => {},
    }){
        this.keyUp = keyUp
        this.keyDown = keyDown
        this.mouseDown = mouseDown
        this.mouseUp = mouseUp
        this.mouseMove = mouseMove
        this.touchStart = touchStart
        this.touchEnd = touchEnd
        this.touchMove = touchMove

        this.onPause = onPause
        this.onUnpause = onUnpause

        this.cv = document.getElementById(id)
        if(!this.cv) {
            this.cv = document.createElement("canvas")
            this.cv.classList.add(id);
            this.cv.setAttribute('id', 'game');
        }
        this.ctx = this.cv.getContext("2d");

        this.setSize(width, height)

        this.fullScreen = fullScreen
        if(fullScreen === true) this.setFullscreen(fullScreen)

        this.setBackgroundColor(backgroundColor);
        this.setCursor(cursor);

        if(fullWindow) {
            this.setSize(window.innerWidth, window.innerHeight)
            window.addEventListener('resize', () => {
                this.setSize(window.innerWidth, window.innerHeight)
            })
        }

        this.fps = fps

        this.camera = {
            x: camera.x || this.width/2,
            y: camera.y || this.height/2,
            zoom: camera.zoom || 1,
            target: camera.target || null,
            delay: camera.delay || 1,
            shake: {
                x: 0,
                y: 0
            }
        }

        this.pause = false

        document.addEventListener("keydown", e => this.keyDownListener(e))
        document.addEventListener("keyup", e => this.keyUpListener(e))
        document.addEventListener("mousedown", e => this.mouseDownListener(e))
        document.addEventListener("mouseup", e => this.mouseUpListener(e))
        document.addEventListener("mousemove", e => this.mouseMoveListener(e))
        document.addEventListener("touchstart", e => this.touchStartListener(e))
        document.addEventListener("touchmove", e => this.touchMoveListener(e))
        document.addEventListener("touchend", e => this.touchEndListener(e))

        this.getMouse = {x: 0, y: 0}
        document.addEventListener("mousemove", e => this.getMousePosition(e))

		if(disableContextMenu) window.addEventListener('contextmenu', e => e.preventDefault())

        if(!document.body.contains(this.cv)) document.body.appendChild(this.cv)

        this.scenes = {}
        this.scenesProps = {}
        Object.entries(scenes).forEach(([key, value]) => {
            this.scenesProps[key] = value
        })
        this.activeScene = activeScene

        Object.entries(custom).forEach(([key, value]) => {
            this[key] = value
        })

        load(this)
        this.load = load
        this.update = update
        this.render = render

        this.resetScene()

        this.updateListener()
    }

    setBackgroundColor(backgroundColor){
        this.backgroundColor = backgroundColor
        this.cv.style.backgroundColor = backgroundColor
    }

    clear(){
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    updateListener(){
        this.lastTick = Date.now()
        this.deltaTime = 0

        const loop = () => {
            const now = Date.now();
            this.deltaTime = (now - this.lastTick)/1000;
            this.currentFPS = 1000 / (now - this.lastTick)
            this.lastTick = now

            try {
                if(this.camera.target) this.cameraTarget(this.getGameObject(this.camera.target), this.camera.delay)
            } catch (error) {
                console.error('Camera target GameObject undefined');
            }

            this.ctx.save()
            this.clear()

            this.ctx.translate(this.width/2, this.height/2)
            this.ctx.scale(this.camera.zoom, this.camera.zoom);
            this.ctx.translate(-(this.camera.x + this.camera.shake.x), -(this.camera.y + this.camera.shake.y))

            this.render(this)
            this.scenes[this.activeScene].renderListener(this.ctx, this.camera)

            if(this.pause == false && this.scenes[this.activeScene].pause == false) this.scenes[this.activeScene].updateListener()
            if(this.pause == false) this.update(this)

            this.ctx.restore()
        }
        this.loopInterval = setInterval(loop, 1000/this.fps);
    }

    setCursor(x){
        x ? this.cv.style.cursor = "default" : this.cv.style.cursor = "none"
    }

    shake(times = 250, intensity = 2.5, delay = 1){
        let counter = 0;
        this.shakeInterval = setInterval(() => {
            this.camera.shake = {
                x: 0 + randomFloatFromInterval(-intensity, intensity),
                y: 0 + randomFloatFromInterval(-intensity, intensity)
            }

            counter++

            if(counter === times) {
                this.stopShake()
            }
        }, delay);
    }

    stopShake(){
        if(this.shakeInterval) clearInterval(this.shakeInterval);
        this.shakeInterval = null
        this.camera.shake = {
            x: 0,
            y: 0
        }
    }

    setSize(width, height){
        this.width = width;
        this.height = height;

        this.cv.width = width;
        this.cv.height = height;
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
        clearInterval(this.loopInterval)
        this.fps = fps
        this.updateListener()
    }

    cameraTarget(target, delay = 1){
        this.camera.x += ((target.x + target.width/2) - this.camera.x) / delay
        this.camera.y += ((target.y + target.height/2) - this.camera.y) / delay
    }

    cameraZoom(zoom){
        this.camera.zoom *= zoom;
    }

    resetScene(){
        const scene = new Scene(this.scenesProps[this.activeScene])
        scene.game = this
        this.scenes[this.activeScene] = scene
        scene.load(scene)
        Object.entries(scene.gameObjects).forEach(([key, value]) => {
            const object = value
            object.scene = scene
            object.load(object)
        })
        if(this.shakeInterval) this.stopShake();
    }

    changeScene(scene){
        this.activeScene = scene
        this.resetScene()
    }

    createGameObject(name, props){
        const newGameObject = new GameObject(props)
        newGameObject.keyName = name
        newGameObject.scene = this.scenes[this.activeScene]
        newGameObject.load(newGameObject)
        this.scenes[this.activeScene].gameObjects[name] = newGameObject
        this.scenes[this.activeScene].sortGameObjectsByLayer()
        return this.scenes[this.activeScene].gameObjects[name]
    }

    instantGameObject(props){
        const name = uuidv4()
        const newGameObject = new GameObject(props)
        newGameObject.keyName = name
        newGameObject.scene = this.scenes[this.activeScene]
        newGameObject.load(newGameObject)
        this.scenes[this.activeScene].gameObjects[name] = newGameObject
        this.scenes[this.activeScene].sortGameObjectsByLayer()
        return this.scenes[this.activeScene].gameObjects[name]
    }

    removeGameObject(key){
        delete this.scenes[this.activeScene].gameObjects[key]
    }

    getGameObject(key){
        return this.scenes[this.activeScene].gameObjects[key]
    }

    getGameObjectByTag(tag){
        let gameObjectsByTag = []
        Object.entries(this.scenes[this.activeScene].gameObjects).forEach(([key, value]) => {
            const objectInstance = this.scenes[this.activeScene].gameObjects[key]
            if(objectInstance.tags.includes(tag)) gameObjectsByTag.push(objectInstance)
        })
        return gameObjectsByTag
    }

    getGameObjectById(id){
        return Object.values(this.scenes[this.activeScene].gameObjects).find(gameObject => gameObject.id === id)
    }

    getMousePosition(event){
        const rect = this.cv.getBoundingClientRect();
        this.getMouse = {
            x: (event.clientX - rect.left) - (-this.camera.x + this.width/2),
            y: (event.clientY - rect.top) - (-this.camera.y + this.height/2)
        }
    }

    setFullscreen(tmp = true){
        if(tmp === true){
            this.fullScreen = true
            try {
                if (this.cv.requestFullscreen) {
                    this.cv.requestFullscreen()
                } else if (this.cv.webkitRequestFullscreen) {
                    this.cv.webkitRequestFullscreen()
                } else if (this.cv.msRequestFullscreen) {
                    this.cv.msRequestFullscreen()
                }
            } catch (error) {}
        }else{
            this.fullScreen = false
            try {
                document.exitFullscreen()
            } catch (error) {;}
        }
    }

    setPause(pause){
        this.pause = pause
        if(this.pause === true) this.onPause(this)
        else this.onUnpause(this)
    }

    togglePause(){
        this.pause = !this.pause
        if(this.pause === true) this.onPause(this)
        else this.onUnpause(this)
    }

    mouseDownListener(e){
        this.scenes[this.activeScene].mouseDownListener(e)
        this.mouseDown({event: e, current: this})
    }
    mouseUpListener(e){
        this.scenes[this.activeScene].mouseUpListener(e)
        this.mouseUp({event: e, current: this})
    }
    mouseMoveListener(e){
        this.scenes[this.activeScene].mouseMoveListener(e)
        this.mouseMove({event: e, current: this})
    }
    keyDownListener(e){
        this.scenes[this.activeScene].keyDownListener(e)
        this.keyDown({event: e, current: this})
    }
    keyUpListener(e){
        this.scenes[this.activeScene].keyUpListener(e)
        this.keyUp({event: e, current: this})
    }
    touchStartListener(e){
        this.scenes[this.activeScene].touchStartListener(e)
        this.touchStart({event: e, current: this})
    }
    touchEndListener(e){
        this.scenes[this.activeScene].touchEndListener(e)
        this.touchEnd({event: e, current: this})
    }
    touchMoveListener(e){
        this.scenes[this.activeScene].touchMoveListener(e)
        this.touchMove({event: e, current: this})
    }
}

export class Scene {
    constructor({
        gameObjects = {},
        tileMaps = [],
        keyUp = e => {},
        keyDown = e => {},
        mouseDown = e => {},
        mouseUp = e => {},
        mouseMove = e => {},
        touchStart = e => {},
        touchEnd = e => {},
        touchMove = e => {},
        custom = {},
        load = () => {},
        render = () => {},
        update = () => {},
    }){
        this.keyUp = keyUp
        this.keyDown = keyDown
        this.mouseDown = mouseDown
        this.mouseUp = mouseUp
        this.mouseMove = mouseMove
        this.touchStart = touchStart
        this.touchEnd = touchEnd
        this.touchMove = touchMove

        this.gameObjects = {}

        this.pause = false

        tileMaps.forEach(tileMapProps => {
            const tileMap = new TileMap(tileMapProps)
            this.gameObjects = {...this.gameObjects, ...tileMap.gameObjects}
        })

        Object.entries(gameObjects).forEach(([key, value]) => {
            const newGameObject = new GameObject(value)
            newGameObject.keyName = key
            this.gameObjects[key] = newGameObject
        })

        this.sortGameObjectsByLayer()

        Object.entries(custom).forEach(([key, value]) => {
            this[key] = value
        })

        this.load = load
        this.update = update
        this.render = render
    }
    sortGameObjectsByLayer(){
        this.gameObjects = Object.entries(this.gameObjects)
            .sort(([,a],[,b]) => a.z-b.z)
            .reduce((r, [k, v]) => ({ ...r, [k]: v }), {})
    }
    updateListener(){
        Object.entries(this.gameObjects).forEach(([key, value]) => {
            const current = this.gameObjects[key]

            if(current.active) {

                current.update(current);

                Object.entries(this.gameObjects).forEach(([key2, value2]) => {
                    const target = this.gameObjects[key2]

                    if(current.id !== target.id){

                        if(isCollide(current, target)){
                            current.onCollide({current, target})
                        }

                        if(positionsMatch(current, target)){
                            current.onPositionMatch({current, target})
                        }

                        if(isInside(current, target)){
                            current.onInside({current, target})
                        }

                    }
                })

            }
        })
        this.update(this)
    }
    renderListener(){
        this.render(this)
        Object.entries(this.gameObjects).forEach(([key, value]) => {
            const current = this.gameObjects[key]
            if(current.active && current.visible) current.render(current);
        })
    }
    keyDownListener(e){
        Object.entries(this.gameObjects).forEach(([key, value]) => {
            const current = this.gameObjects[key]
            current.keyDown({event: e, current: current});
        })
        this.keyDown({event: e, current: this});
    }
    keyUpListener(e){
        Object.entries(this.gameObjects).forEach(([key, value]) => {
            const current = this.gameObjects[key]
            current.keyUp({event: e, current});
        })
        this.keyUp({event: e, current: this});
    }
    mouseDownListener(e){
        Object.entries(this.gameObjects).forEach(([key, value]) => {
            const current = this.gameObjects[key]
            current.mouseDown({event: e, current});
            if(isInside(this.game.getMouse, current)) {
                current.objectMouseDown({event: e, current});
            }
        })
        this.mouseDown({event: e, current: this});
    }
    mouseUpListener(e){
        Object.entries(this.gameObjects).forEach(([key, value]) => {
            const current = this.gameObjects[key]
            current.mouseUp({event: e, current});
            if(isInside(this.game.getMouse, current)) current.objectMouseUp({event: e, current});
        })
        this.mouseUp({event: e, current: this});
    }
    mouseMoveListener(e){
        Object.entries(this.gameObjects).forEach(([key, value]) => {
            const current = this.gameObjects[key]
            current.mouseMove({event: e, current});
            if(isInside(this.game.getMouse, current)) current.objectMouseMove({event: e, current});
        })
        this.mouseMove({event: e, current: this});
    }
    touchStartListener(e){
        Object.entries(this.gameObjects).forEach(([key, value]) => {
            const current = this.gameObjects[key]
            current.touchStart({event: e, current});
            // current.objectTouchStart({event: e, current});
        })
        this.touchStart({event: e, current: this});
    }
    touchEndListener(e){
        Object.entries(this.gameObjects).forEach(([key, value]) => {
            const current = this.gameObjects[key]
            current.touchEnd({event: e, current});
            // current.objectTouchEnd({event: e, current});
        })
        this.touchEnd({event: e, current: this});
    }
    touchMoveListener(e){
        Object.entries(this.gameObjects).forEach(([key, value]) => {
            const current = this.gameObjects[key]
            current.touchMove({event: e, current});
            // current.objectTouchMove({event: e, current});
        })
        this.touchMove({event: e, current: this});
    }
    createGameObject(name, props){
        const newGameObject = new GameObject(props)
        newGameObject.keyName = name
        newGameObject.scene = this
        newGameObject.load(newGameObject)
        this.gameObjects[name] = newGameObject
        this.sortGameObjectsByLayer()
        return this.gameObjects[name]
    }

    instantGameObject(props){
        const name = uuidv4()
        const newGameObject = new GameObject(props)
        newGameObject.keyName = name
        newGameObject.scene = this
        newGameObject.load(newGameObject)
        this.gameObjects[name] = newGameObject
        this.sortGameObjectsByLayer()
        return this.gameObjects[name]
    }

    removeGameObject(key){
        delete this.gameObjects[key]
    }

    getGameObject(key){
        return this.gameObjects[key]
    }

    getGameObjectByTag(tag){
        let gameObjectsByTag = []
        Object.entries(this.gameObjects).forEach(([key, value]) => {
            const objectInstance = this.gameObjects[key]
            if(objectInstance.tags.includes(tag)) gameObjectsByTag.push(objectInstance)
        })
        return gameObjectsByTag
    }

    getGameObjectById(id){
        return Object.values(this.gameObjects).find(gameObject => gameObject.id === id)
    }
}

export class GameObject {
    constructor({
        id = uuidv4(),
        x = 0,
        y = 0,
        z = 0,
        width = 10,
        height = 10,
        color = '#fff',
        text,
        image,
        active = true,
        visible = true,
        tags = [],
        dontDestroyOnLoad = false,
        UI = false,
        keyUp = e => {},
        keyDown = e => {},
        mouseDown = e => {},
        mouseUp = e => {},
        mouseMove = e => {},
        touchStart = e => {},
        touchEnd = e => {},
        touchMove = e => {},
        objectMouseDown = e => {},
        objectMouseUp = e => {},
        objectMouseMove = e => {},
        objectTouchStart = e => {},
        objectTouchEnd = e => {},
        objectTouchMove = e => {},
        onCollide = e => {},
        onInside = e => {},
        onPositionMatch = e => {},
        custom = {},
        load = () => {},
        update = () => {},
        render
    }){
        this.id = id

        this.keyUp = keyUp
        this.keyDown = keyDown
        this.mouseDown = mouseDown
        this.mouseUp = mouseUp
        this.mouseMove = mouseMove
        this.touchStart = touchStart
        this.touchEnd = touchEnd
        this.touchMove = touchMove

        this.objectMouseDown = objectMouseDown
        this.objectMouseUp = objectMouseUp
        this.objectMouseMove = objectMouseMove
        this.objectTouchStart = objectTouchStart
        this.objectTouchEnd = objectTouchEnd
        this.objectTouchMove = objectTouchMove

        this.onCollide = onCollide
        this.onPositionMatch = onPositionMatch
        this.onInside = onInside

        this.x = x
        this.y = y
        this.z = z
        this.width = width
        this.height = height
        this.color = color
        this.visible = visible
        this.active = active
        this.tags = tags
        this.dontDestroyOnLoad = dontDestroyOnLoad
        this.UI = UI

        if(text){
            this.text = {
                value: text.value || '',
                font: text.font || 'Arial',
                fontSize: text.fontiSize || 30,
                color: text.color || '#fff',
                offset: text.offset || {x: 0, y: 0}
            }
        }

        if(image){
            const imgElement = new Image()
            imgElement.src = image.src

            this.image = {
                element: imgElement,
                offset: image.offset || {x: 0, y: 0}
            }
        }

        Object.entries(custom).forEach(([key, value]) => {
            this[key] = value
        })

        this.load = load
        this.update = update

        if(render) this.render = render;
    }
    render(){
        this.scene.game.ctx.fillStyle = this.color

        this.scene.game.ctx.fillRect(this.x, this.y, this.width, this.height)

        if(this.text){
            this.scene.game.ctx.fillStyle = this.text.color
            this.scene.game.ctx.font = `${this.text.fontSize}px ${this.text.font}`
            this.scene.game.ctx.fillText(this.text.value, this.x + this.text.offset.x, this.y + this.text.offset.y)
        }

        if(this.image){
            if(this.image.pixelated) this.scene.game.ctx.imageSmoothingEnabled = false;
            this.scene.game.ctx.drawImage(this.image.element, this.x + this.image.offset.x, this.y + this.image.offset.y, this.width, this.height)
        }
    }
}

export class TileMap {
    constructor(props){
        this.x = props.x
        this.y = props.y

        const str = props.map.replaceAll(' ', '').trim().split()[0].replaceAll('\n', '')

        this.map = []
        this.gameObjects = {}

        for (let i = 0; i < props.rows; i++) {
            this.map[i] = []
        }

        let row = 0
        for (let i = 0; i < str.length; i++) {
            const object = new GameObject({
                ...props[str[i]],
                x: props.x + (props.size * (this.map[row].length - 1)),
                y: props.y + (props.size * row),
                width: props.size,
                height: props.size
            })
            this.map[row].push(str[i])
            if(props[str[i]]){
                const name = uuidv4()
                object.keyName = name
                this.gameObjects[name] = object
            }
            if(this.map[row].length === props.cols) row++
        }
    }
    render(ctx, camera){

    }
    update(dt){

    }
    reset(){

    }
}

export function isCollide(a, b) {
    return !(
        ((a.y + a.height) < (b.y)) ||
        (a.y > (b.y + b.height)) ||
        ((a.x + a.width) < b.x) ||
        (a.x > (b.x + b.width))
    )
}

export function isInside(a, b){
    return (
        (a.x > b.x && a.x < b.x + b.width) &&
        (a.y > b.y && a.y < b.y + b.height)
    )
}

export const positionsMatch = (a, b) => a.x === b.x && a.y === b.y

export function getDistance(a, b){
    let y = b.x - a.x;
    let x = b.y - a.y;
    return Math.sqrt(x * x + y * y)
}

export const randomFloatInInterval = inter => Math.random() * (inter - (-inter)) + inter

export const randomIntInInterval = inter => Math.floor(Math.random() * (inter - (-inter) + 1) + inter)

export const randomFloatFromInterval = (min, max) => Math.random() * (max - min) + min

export const randomIntFromInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

export const randomItemFromArray = array => array[Math.floor(Math.random() * array.length)]

export const uuidv4 = () => ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16))

export const getDifference = (a, b) => Math.abs(a - b)

export function getSignWithOne(number) {
    if (number === 0) {
        return 0;
    } else {
        return Math.abs(number) / number;
    }
}