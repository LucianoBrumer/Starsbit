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
let connections = {}
let validations = {}
let kills = {}

let evaluatePing = false
function checkPlayers(){
    setTimeout(() => {
        if(!evaluatePing){
            Object.entries(connections).forEach(([playerId, socketId]) => {
                validations[playerId] = false
                io.to(socketId).emit('ping')
            })
            evaluatePing = true
        }else{
            Object.entries(validations).forEach(([playerId, validation]) => {
                if(!validation){
                    players = players.filter(x => x.id !== playerId)
                    delete validations[playerId]
                    delete connections[playerId]
                    io.sockets.emit('displayer', playerId)
                }
            })
            evaluatePing = false
        }
        checkPlayers()
    }, 250)
}
checkPlayers()

io.on('connection', socket => {
    console.log("New connection:", socket.id)

    socket.on('pong', playerId => {
        validations[playerId] = true
    })

    socket.on('player', player => {
        if(!connections[player.id]){
            connections[player.id] = socket.id
        }
        players = players.filter(x => x.id !== player.id)
        players.push(player)

        // players[players.findIndex((x => x.id === player.id))] = player
        // if(!players.some(x => x.id === player.id)) players.push(player)

        socket.broadcast.emit('players', players)
    })

    socket.on('shot', playerId => {
        socket.broadcast.emit('shot', playerId)
    })

    socket.on('kill', playerId => {
        try {
            const name = players.find(x => x.id === playerId).name
            if(!kills[name]) kills[name] = 0
            kills[name] = kills[name] + 1

            io.sockets.emit('kills', kills)
        } catch (error) {
            console.log(error);
        }
    })

    socket.on("disconnect", () => {
        Object.entries(connections).forEach(([playerId, socketId]) => {
            if(socket.id == socketId){
                players = players.filter(x => x.id !== playerId)
                io.sockets.emit('displayer', playerId)
            }
        })
        // console.log(connections[socket.id]);
        // players = players.filter(x => x.id !== connections[socket.id])
        // io.sockets.emit('displayer', connections[socket.id])
    })

})