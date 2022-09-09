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
let connections = {}
let kills = {}

// let evaluatePing = false
// function checkPlayers(){
//     setTimeout(() => {
//         // if(!evaluatePing){
//         //     // players = players.map(player => player.ping = false)
//         //     players.forEach(player => {
//         //         player.ping = false
//         //     })
//         //     console.log('------------EVALUEATEEEEEEEEE--------------------');
//         //     console.log(players);
//         //     console.log('------------EVALUEATEEEEEEEEFINISHE--------------------');
//         //     evaluatePing = true
//         // }else{
//         //     console.log('------------START--------------------');
//         //     console.log(players.length);
//         //     console.log(players);
//         //     players.forEach(player => {
//         //         if(!player.ping || !player.id){
//         //             console.log('------------REMOVE--------------------');
//         //             console.log(player);
//         //             console.log('remove player');
//         //             // players = players.filter(x => x.id !== player.id)
//         //             // io.sockets.emit('displayer', player.id)
//         //             console.log('------------END--------------------');
//         //         }
//         //     })
//         //     evaluatePing = false
//         // }
//         console.log(connections);
//         checkPlayers()
//     }, 5000)
// }
// checkPlayers()

io.on('connection', socket => {
    console.log("New connection:", socket.id)

    socket.on('player', player => {
        if(!connections[socket.id]){
            connections[socket.id] = player.id
        }
        // console.log(player.socketId);
        // players.forEach(x => {
        //     if(x.id !== player.id && x.socketId === socket.id){
        //         // console.log('duplicated', x.id, player.id);
        //         // io.to(x.socketId).emit('dupli')
        //     }
        // })
        // if(!player.socketId) player.socketId = socket.id
        // player.ping = true

        // if(players.includes(player.id)){
        if(players.some(e => e.id === player.id)){
            players = players.filter(el => el.id !== player.id)
        }
        players.push(player)
        socket.broadcast.emit('players', players)
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
        socket.broadcast.emit('shot', playerId)
    })

    socket.on('kill', playerId => {
        try {
            const name = players.find(x => x.id === playerId).name
            if(!kills[name]) kills[name] = 0
            kills[name] = kills[name] + 1

            console.log(kills)

            io.sockets.emit('kills', kills)
        } catch (error) {
            console.log(error);
        }
    })

    socket.on("disconnect", () => {
        console.log('disconnect');
        // player = players.find(x => x.socketId === socket.id)
        // players = players.filter(x => x.id !== player.id)
        // io.sockets.emit('displayer', player.id)
        players = players.filter(x => x.id !== connections[socket.id])
        // console.log(connections[socket.id]);
        io.sockets.emit('displayer', connections[socket.id])
    })

    // socket.on("reload", () => {
    //     players = players.filter(x => x.id !== connections[socket.id])
    //     io.sockets.emit('displayer', connections[socket.id])
    // })

})