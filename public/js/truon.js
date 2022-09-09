class TruonWindow{
    constructor(){
        this.element = document.createElement('truon')
        document.body.appendChild(this.element)
        this.keyDown = e => {}
        this.keyUp = e => {}
        this.mouseDown = e => {}
        this.mouseUp = e => {}
        document.addEventListener("keydown", e => this.keyDown(e));
        document.addEventListener("keyup", e => this.keyUp(e));
        document.addEventListener("mousedown", e => this.mouseDown(e));
        document.addEventListener("mouseup", e => this.mouseUp(e));
        this.size();

        this.element.style.left = `0px`;
        this.element.style.top = `0px`;
        this.element.style.position = `fixed`;
        // this.update()
    }
    // update(){
    //     this.timeout = setTimeout(() => {

    //         // this.size('100%', '100vh')

    //         // this.update();
    //     }, 0)
    // }
    backgroundColor(s){
        this.element.style.backgroundColor = s;
    }
    size(width = '100%', height = '100%'){
        this.element.style.width = width;
        this.element.style.height = height;
    }
    getWidth(){
        return this.element.clientWidth;
    }
    getHeight(){
        return this.element.clientHeight;
    }
}
const Window = new TruonWindow();

class TruonCursor{
    set(s){
        document.body.style.cursor = s
    }
}
const Cursor = new TruonCursor();

class TruonCamera{
    constructor(){
        this.x = 0;
        this.y = 0;
        this.targetX = Window.element.clientWidth/2;
        this.targetY = Window.element.clientHeight/2;
        this.smoothTargetX = this.targetY;
        this.smoothTargetY = this.targetX;
        this.update();
    }
    update(){
        setTimeout(() => {
            this.x = -this.targetX+(Window.element.clientWidth/2);
            this.y = -this.targetY+(Window.element.clientHeight/2);
            this.update()
        }, 0)
    }
    target(x, y){
        this.targetX = x;
        this.targetY = y;
    }
    smoothTarget(x, y, delay){
        this.targetX += ((x - this.targetX) / delay);
        this.targetY += ((y - this.targetY) / delay);
    }
}
const Camera = new TruonCamera();

class TruonObject {
    constructor(x = 0, y = 0, z = 0, width = 10, height = 10, color = '#fff'){
        this.x = x;
        this.y = y;
        this.z = z;
        this.width = width
        this.height = height
        this.color = color

        this.element = document.createElement("div");
        this.element.style.position = "absolute";

        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.element.style.zIndex = `${this.z}`;

        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;

        this.element.style.backgroundColor = this.color

        Window.element.appendChild(this.element);

        document.addEventListener("keydown", e => this.keyDown(e));
        document.addEventListener("keyup", e => this.keyUp(e));
        document.addEventListener("mousedown", e => this.mouseDown(e));
        document.addEventListener("mouseup", e => this.mouseUp(e));

        this.update();
    }
    translate(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
        this.element.style.left = `${Camera.x + this.x}px`;
        this.element.style.top = `${Camera.y + this.y}px`;
        this.element.style.zIndex = `${this.z}`;
    }
    scale(width, height){
        this.width = width;
        this.height = height;
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
    }
    setVisible(bool){
        bool
           ? this.element.style.visibility = 'visible'
           : this.element.style.visibility = 'hidden'
    }
    setActive(bool){
        bool
           ? this.element.style.display = 'block'
           : this.element.style.display = 'none'
    }
    destroy(){
        this.element.remove();
    }
    keyDown(e){}
    keyUp(e){}
    mouseDown(e){}
    mouseUp(e){}
    update(){}
}

class TruonJoystick extends TruonObject{
    constructor(x, y, z, radius, color){
        // radius = Window.element.clientHeight/3
        super(x, y, z = 10, radius, radius, color)

        this.element.style.width = "15%";
        this.element.style.height = `${this.element.clientWidth}px`;
        this.element.style.position = "fixed";
        this.element.style.left = "0";
        this.element.style.top = null;
        this.element.style.bottom = "0";
        this.element.style.margin = `${this.element.clientWidth/3}px`;
        this.element.style.borderRadius = `50%`;

        this.element.addEventListener("touchstart", e => this.touchStart(e));
        document.addEventListener("touchmove", e => this.touchMove(e));
        document.addEventListener("touchend", e => this.touchEnd(e));

        this.left = false
        this.right = false
        this.up = false
        this.down = false
    }
    touchStart(e){
        this.touchStartX = e.targetTouches[0].pageX
        this.touchStartY = e.targetTouches[0].pageY
    }
    touchMove(e){
        this.touchMoveX = e.targetTouches[0].pageX
        this.touchMoveY = e.targetTouches[0].pageY

        if(this.touchMoveX > this.touchStartX) {
            this.right = true
            this.left = false
        }
        if(this.touchMoveX < this.touchStartX) {
            this.left = true
            this.right = false
        }
        if(this.touchMoveY > this.touchStartY) {
            this.down = true
            this.up = false
        }
        if(this.touchMoveY < this.touchStartY) {
            this.up = true
            this.down = false
        }
        // console.log('move');
    }
    touchEnd(){
        this.left = false
        this.right = false
        this.up = false
        this.down = false
        // console.log('end');
    }
}
console.log();
const Joystick = new TruonJoystick(100, Window.element.clientHeight - 275, 10, 200, 'rgb(100, 100, 100, 0.1)')
Joystick.setActive(false)

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function isCollide(a, b) {
    return !(
        ((a.y + a.height) < (b.y)) ||
        (a.y > (b.y + b.height)) ||
        ((a.x + a.width) < b.x) ||
        (a.x > (b.x + b.width))
    );
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function getDistance(a, b){
    let y = b.x - a.x;
    let x = b.y - a.y;
    return Math.sqrt(x * x + y * y);
}

function getRandomNumberFromArray(array){
    return array[Math.floor(Math.random() * array.length)];
}

function openFullscreen(el) {
    if (el.requestFullscreen) {
        el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) { /* Safari */
        el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) { /* IE11 */
        el.msRequestFullscreen();
    }
}