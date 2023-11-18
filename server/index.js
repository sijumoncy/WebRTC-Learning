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

    // emit other users info to newly joined users
    socket.emit("inform_new_user_about_others", otherUsers)

  })

  // process the user configs (2 data)
  socket.on('SDPProcess', (data) => {
    socket.to(data.toConnectionId).emit('SDPProcess', {
      message:data.message,
      fromConnectionId:socket.id
    })
  })

  socket.on("sendMessage", (data) => {
    console.log("message recive event");
    messagedUser = connections.find((connection) => connection.connectionId === socket.id)
    if(messagedUser){
      const msgUserconnectId = messagedUser.connectId
      const msgFrom = messagedUser.userId
      // filter meeting room users
      const connectRoomUsers = connections.filter((connection) => connection.connnectId === msgUserconnectId)
      connectRoomUsers.forEach((user) => {
        socket.to(user.connectionId).emit("newMessageRecived", {
          from:msgFrom,
          message:data.message,
        })
      })

    }
  })

  socket.on("disconnect", () => {
    console.log("user disconnected");
    const leftUser = connections.find((connection) => connection.connectionId === socket.id)
    if(leftUser){
      const leftConnnectId = leftUser.connnectId
      const connections = connections.filter((connection) => connection.connnectId !== socket.id)
      // list of all users in the same connect room
      const connectRoomUsers = connections.filter((connection) => connection.connnectId === leftConnnectId)
      connectRoomUsers.forEach((user) => {
        socket.to(user.connectionId).emit("inform_user_left", {
          leftUserId:socket.id
        })
      })
    }
  })

})

server.listen(8000, () => {
	console.log('app is running ')
})

