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
let kills = []

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

    socket.on('newplayer', player => {
        try {
            players.push(player)
            connections[player.id] = socket.id
            io.sockets.emit("newplayer", player);
            io.to(socket.id).emit('loadplayers', players)
        } catch (error) {
            console.log(error);
        }
    })

    socket.on('updateplayer', player => {
        try {
            //players = players.filter(x => x.id !== player.id)
            //players.push(player)

            // players[players.findIndex((x => x.id === player.id))] = player
            // if(!players.some(x => x.id === player.id)) players.push(player)
            io.sockets.emit("updateplayer", player);
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

    socket.on("kill", (playerId) => {
		try {
			let totalKills = 1;
			if(kills.some(x => x.id === playerId)) totalKills += kills.find((x) => x.id === playerId).kills;
			const name = players.find((x) => x.id === playerId).name;
			const kill = { id: playerId, name, kills: totalKills };
			kills = kills.filter((x) => x.id !== playerId);
			kills.push(kill);
			kills = kills.sort((a, b) => b.kills - a.kills);
			kills.length = Math.min(kills.length, 10);
			io.sockets.emit("kills", kills);
		} catch (error) {
			console.log(error);
		}
	})

    socket.on("disconnect", () => {
        try {
            Object.entries(connections).forEach(([playerId, socketId]) => {
                if(socket.id === socketId){
                    players = players.filter(x => x.id !== playerId)
                    io.sockets.emit('displayer', playerId)
                }
            })
        } catch (error) {
            console.log(error);
        }
        // console.log(connections[socket.id]);
        // players = players.filter(x => x.id !== connections[socket.id])
        // io.sockets.emit('displayer', connections[socket.id])
    })

})