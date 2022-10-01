require('dotenv').config()

const path = require('path')
const cors = require('cors')
const express = require('express')

const app = express()

app.set('port', process.env.PORT || 3000)

app.use(cors())
app.use(express.static(path.join(__dirname, 'public')))

const server = app.listen(app.get('port'), require('dns').lookup(require('os').hostname(), (err, add, fam) => {
    console.log(`Server on ${add}:${app.get('port')}`)
}))

// const server = app.listen(app.get('port'), () => {
//     console.log(`Server on localhost:${app.get('port')}`)
// })

const SocketIO = require('socket.io')
const io = SocketIO(server)

let players = []
let connections = {}
let validations = {}
let kills = []

let evaluatePing = false
function checkPlayers() {
    if(!evaluatePing){
        Object.entries(connections).forEach(([playerId, socketId]) => {
            validations[playerId] = false
            io.to(socketId).emit('ping')
        })
        evaluatePing = true
    }else{
        Object.entries(validations).forEach(([playerId, validation]) => {
            if(!validation){
                players.splice(players.findIndex((player => player.id === playerId)), 1)
                delete validations[playerId]
                delete connections[playerId]
                io.sockets.emit('displayerpong', playerId)
            }
        })
        evaluatePing = false
    }
    setTimeout(checkPlayers, 5000)
}
// checkPlayers()

io.on('connection', socket => {
    console.log("New connection:", socket.id)

    socket.on('pong', playerId => {
        validations[playerId] = true
    })

    socket.on('newplayer', player => {
        try {
            players.push(player)
            connections[player.id] = socket.id
            io.sockets.emit("newplayer", player);
            io.to(socket.id).emit('loadplayers', players)
            io.to(socket.id).emit('kills', kills)
        } catch (error) {
            console.log(error);
        }
    })

    socket.on('updateplayer', player => {
        try {
            const updatePlayer = players[players.findIndex(x => x.id === player.id)]
            updatePlayer.x = player.x
            updatePlayer.y = player.y
            updatePlayer.facing = player.facing
            io.sockets.emit("updateplayer", player);
        } catch (error) {
            console.log(error);
        }
    })

    socket.on('requestplayer', id => {
        try {
            player = players.find(player => player.id === id)
            io.to(socket.id).emit("newplayer", player);
        } catch (error) {
            console.log(error);
        }
    })

    socket.on('requestplayers', () => {
        try {
            io.sockets.emit("requestplayers");
        } catch (error) {
            console.log(error);
        }
    })

    socket.on('shot', playerId => {
        try {
            io.sockets.emit('shot', playerId)
        } catch (error) {
            console.log(error);
        }
    })

    socket.on("kill", ({player, killerId}) => {
        try {
            const playerKiller = players.find(player => player.id === killerId)
            playerKiller.kills += 1

            kills = players.map(player => ({
                id: player.id,
                name: player.name,
                kills: player.kills
            }))

			kills = kills.sort((a, b) => b.kills - a.kills);
			kills.length = Math.min(kills.length, 10);

			io.sockets.emit("kills", kills);
            io.sockets.emit("updateplayer", player);
		} catch (error) {
			console.log(error);
		}
	})

    socket.on("disconnect", () => {
        try {
            Object.entries(connections).forEach(([playerId, socketId]) => {
                if(socket.id === socketId){
                    players.splice(players.findIndex((player => player.id === playerId)), 1)
                    delete validations[playerId]
                    delete connections[playerId]
                    io.sockets.emit('displayer', playerId)
                    kills = kills.filter(x => x.id !== playerId);
                    io.sockets.emit("kills", kills);
                }
            })
        } catch (error) {
            console.log(error);
        }
    })

})