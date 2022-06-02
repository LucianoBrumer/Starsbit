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
const io = SocketIO(server)

let players = []
let bullets = []
let kills = {}

io.on('connection', socket => {

    console.log("new connection", socket.id);

    socket.on('player', data => {

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

        if(!kills[data.id]) kills[data.id] = 0
        kills[data.id] = kills[data.id] + 1
        console.log(kills);
        io.sockets.emit('kills', kills)

    })

})