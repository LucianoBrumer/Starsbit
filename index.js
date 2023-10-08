// require('dotenv').config()

const path = require('path')
const cors = require('cors')
const express = require('express')

const app = express()

// const allowedOrigins = ['http://26.178.202.240:3000'];
// const corsOptions = {
//     origin: function (origin, callback) {
//         if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
//             callback(null, true)
//         } else {
//             callback(new Error('Acced denied by CORS.'))
//         }
//     },
// }

app.use(cors())
// app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.json({
        "hola": "mundo"
    })
})

app.set('port', process.env.PORT || 3000)

const server = app.listen(app.get('port'), require('dns').lookup(require('os').hostname(), (err, host, fam) => {
    console.log(`Server on http://${host}:${app.get('port')}`)
}))

const SocketIO = require('socket.io')
const io = SocketIO(server)

// const kills = {}
// const connections = {}

// io.on('connection', socket => {
//     console.log("[SOCKET.IO] New Connection:", socket.id)

//     socket.on('player', player => {
//         try {
//             connections[player.id] = socket.id
//             io.sockets.emit("player", player);
//         } catch (error) {
//             console.error(`[SOCKET.IO:ON'player' ERROR], ${error}}`);
//         }
//     })

//     socket.on('shot', playerId => {
//         try {
//             io.sockets.emit('shot', playerId)
//         } catch (error) {
//             console.error(`[SOCKET.IO:ON'shot' ERROR], ${error}}`);
//         }
//     })

//     socket.on('death', playerKillerId => {
//         try {
//             kills[playerKillerId] = kills[playerKillerId] === undefined ? 0 : kills[playerKillerId]+1
//             io.sockets.emit('kills', kills)
//         } catch (error) {
//             console.error(`[SOCKET.IO:ON'death' ERROR], ${error}}`);
//         }
//     })

//     socket.on("disconnect", () => {
//         try {
//             Object.entries(connections).forEach(([playerId, socketId]) => {
//                 if(socket.id === socketId){
//                     delete connections[playerId]
//                     delete kills[playerId]
//                     io.sockets.emit('displayer', playerId)
//                 }
//             })
//         } catch (error) {
//             console.error(`[SOCKET.IO:ON'disconnect' ERROR], ${error}}`);
//         }
//     })

// })

// const express = require('express')
// const cors = require('cors')

// const app = express()

// app.use(cors())
// app.get('/', (req, res) => {
//     res.json({
//         "hola": "mundo"
//     })
// })

// app.listen(3000, () => {
//     console.log(`Working`)
// })
