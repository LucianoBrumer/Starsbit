class TruonWindow{
    constructor(){
        this.element = document.createElement('div')
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
    cursor(s){
        this.element.style.cursor = s;
    }
    backgroundColor(s){
        this.element.style.backgroundColor = s;
    }
    size(width = '100%', height = '100%'){
        this.element.style.width = width;
        this.element.style.height = height;
    }
}
const Window = new TruonWindow();

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
        }, 1)
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
    constructor(x = 0, y = 0, z = 0, width = 100, height = 100){
        this.x = x;
        this.y = y;
        this.z = z;
        this.width = width
        this.height = height

        this.element = document.createElement("div");
        this.element.style.position = "absolute";

        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.element.style.zIndex = `${this.z}`;

        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;

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
    destroy(){
        this.element.remove();
    }
    keyDown(e){}
    keyUp(e){}
    mouseDown(e){}
    mouseUp(e){}
    update(){}
}

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