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
// let bullets = []
let kills = {}
let connections = {}

io.on('connection', socket => {

    // function checkPlayers(){
    //     setTimeout(() => {
    //         // console.log(players);
    //         players.forEach(player => {
    //             const diffTime = Math.abs(player.check - Date.now())
    //             console.log(player.check, Date.now(), diffTime, players.length)
    //             if(diffTime > 1000){
    //                 io.sockets.emit('displayer', player.id)
    //                 // console.log(player, players.length);
    //                 Object.entries(connections).forEach(([socketId, playerId]) => {
    //                     if(playerId == player.id){
    //                         io.to(socketId).emit('reload', player.id)
    //                     }
    //                 })
    //             }
    //         })
    //         checkPlayers()
    //     }, 1000)
    // }
    // checkPlayers()

    console.log("New connection:", socket.id);

    socket.on('player', player => {
        if(connections[socket.id] == undefined) {
            connections[socket.id] = player.id
        }

        // if(players.includes(player.id)){
        if(players.some(e => e.id === player.id)){
            players = players.filter(el => el.id !== player.id)
        }
        players.push(player)
        io.sockets.emit('players', players)
    })

    // socket.on('bullet', data => {
    //     if(bullets.some(e => e.id === data.id)){
    //         bullets = bullets.filter(el => el.id !== data.id)
    //     }
    //     bullets.push(data)
    //     io.sockets.emit('bullets', bullets)
    // })

    // socket.on('bulletdead', data => {
    //     bullets = bullets.filter(el => el.id !== data.id)
    // })

    socket.on('shot', playerId => {
        io.sockets.emit('shot', playerId)
    })

    socket.on('kill', playerId => {
        const name = players.find(x => x.id === playerId).name
        if(!kills[name]) kills[name] = 0
        kills[name] = kills[name] + 1

        console.log(kills)

        io.sockets.emit('kills', kills)
    })

    socket.on("disconnect", () => {
        players = players.filter(x => x.id !== connections[socket.id])
        io.sockets.emit('displayer', connections[socket.id])
    })

    // socket.on("reload", () => {
    //     players = players.filter(x => x.id !== connections[socket.id])
    //     io.sockets.emit('displayer', connections[socket.id])
    // })

})