require('dotenv').config()

const path = require('path')

const express = require('express')
const app = express()

app.set('port', process.env.PORT || 3000)

app.use(express.static(path.join(__dirname, 'public')))

const server = app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
})

const SocketIO = require('socket.io')
const { log } = require('console')
const io = SocketIO(server)

let players = []
let bullets = []
let kills = {}
let connections = {}

io.on('connection', socket => {

    console.log("new connection", socket.id);

    socket.on('player', data => {

        if(connections[socket.id] == undefined) {
            connections[socket.id] = data.id
            // console.log(connections);
        }

        // if(players.includes(data.id)){
        if(players.some(e => e.id === data.id)){
            players = players.filter(el => {return el.id != data.id})
        }
        players.push(data)
        io.sockets.emit('players', players)

        
    })

    socket.on('bullet', data => {

        // if(players.includes(data.id)){
        if(bullets.some(e => e.id === data.id)){
            bullets = bullets.filter(el => {return el.id != data.id})
        }
        bullets.push(data)
        io.sockets.emit('bullets', bullets)
    })

    socket.on('bulletdead', data => {

        bullets = bullets.filter(el => {return el.id != data.id})

    })

    socket.on('kill', data => {

        // if(!kills[data.id]) kills[data.id] = 0
        // kills[data.id] = kills[data.id] + 1
        
        const name = players.find(x => x.id === data.id).name
        if(!kills[name]) kills[name] = 0
        kills[name] = kills[name] + 1

        console.log(kills);

        io.sockets.emit('kills', kills)

    })
    
    socket.on("disconnect", () => {
        players = players.filter(el => el.id !== connections[socket.id])
        io.sockets.emit('displayer', connections[socket.id])
    });

})