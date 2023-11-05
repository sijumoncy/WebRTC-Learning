const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors())

const {Server} = require('socket.io')

const server = http.createServer(app)

const io = new Server(server, {
	cors : {
	origin: "http://127.0.0.1:5173",
	methods: ["GET", "POST"]
	}
})

// store all connectiondata of all users
const connections = []

io.on("connection", (socket) => {
	console.log('user connected', socket.id)

  // user on connection event
  socket.on('userconnected', (data) => {
    console.log("connected user : ", {data});

    // users data for the same connectId room
    const otherUsers = connections.filter((user) => user.connnectId === data.connectId)

    connections.push({
      connectionId:socket.id, // unique user connected id
      userId: data.disaplayName,
      connnectId:data.connectId //room id
    })

    // send info to all existing room user about new user joined
    otherUsers.forEach((user) => {
      socket.to(user.connectionId).emit("new_user_joined_info", {
        joinedUserId: data.disaplayName,
        joinedConnectionId: socket.id
      })
    })
  })

  // process the user configs (2 data)
  socket.on('SDPProcess', (data) => {
    socket.to(data.toConnectionId).emit('SDPProcess', {
      message:data.message,
      fromConnectionId:socket.id
    })
  })


})

server.listen(8000, () => {
	console.log('app is running ')
})

