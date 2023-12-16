const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

const corsOptions = {
  origin: '*',
  credentials: true,
};

app.use(cors(corsOptions));

const {Server} = require('socket.io');
const path = require('path');
const fs = require('fs')

const  fileUpload = require('express-fileupload')

const server = http.createServer(app)

const io = new Server(server, {
	cors : {
	origin: "http://127.0.0.1:5173",
	methods: ["GET", "POST"]
	}
})

// store all connectiondata of all users
let CONNECTIONS = []

io.on("connection", (socket) => {
	console.log('user connected server', socket.id)

  // user on connection event
  socket.on('userconnected', (data) => {
    console.log("connected user - new user connected : ", {data});

    // users data for the same connectId room
    const otherUsers = CONNECTIONS.filter((user) => user.connnectId === data.connectId) || []

    // adding joined user in server to a global var
    CONNECTIONS.push({
      connectionId:socket.id, // unique user connected id -> who is connected unique id 
      userId: data.disaplayName, // username added from frontend
      connnectId:data.connectId //room id 
    })

    // send info to all existing room user about new user joined
    otherUsers.forEach((user) => {
      socket.to(user.connectionId).emit("new_user_joined_info", {
        joinedUserId: data.disaplayName,
        joinedConnectionId: socket.id
      })
    })

    console.log({otherUsers}, "current user : ", socket.id);

    // emit other users info to newly joined users
    socket.emit("inform_new_user_about_others", otherUsers)

    console.log({CONNECTIONS});

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
    messagedUser = CONNECTIONS.find((connection) => connection.connectionId === socket.id)
    if(messagedUser){
      const msgUserconnectId = messagedUser.connectId
      const msgFrom = messagedUser.userId
      // filter meeting room users
      const connectRoomUsers = CONNECTIONS.filter((connection) => connection.connnectId === msgUserconnectId)
      connectRoomUsers.forEach((user) => {
        socket.to(user.connectionId).emit("newMessageRecived", {
          from:msgFrom,
          message:data.message,
        })
      })

    }
  })

  socket.on("fileAttachedInfoToOthers", (data) => {
    console.log("file attched event call");
    const fileDir = path.join(__dirname, "attachments", data.connectId, data.fileName)
    const fileSharedUser = CONNECTIONS.find((connection) => connection.connectionId === socket.id)
    if(fileSharedUser){
      const FileSharedUserconnectId = fileSharedUser.connectId
      const FileFrom = fileSharedUser.userId
      // filter meeting room users
      const connectRoomUsers = CONNECTIONS.filter((connection) => connection.connnectId === FileSharedUserconnectId)
      connectRoomUsers.forEach((user) => {
        socket.to(user.connectionId).emit("newFileAttached", {
          connectId:data.connectId,
          username:data.userName,
          fileName:data.fileName,
          fileDir
        })
      })

    }
  })

  socket.on("disconnect", () => {
    console.log("user disconnected");
    const disconnectedUserSocketId = socket.id 
    console.log("just disconnect =======>", {disconnectedUserSocketId, CONNECTIONS});
    const leftUser = CONNECTIONS.find((connection) => connection.connectionId === disconnectedUserSocketId)
    if(leftUser){
      const leftConnnectId = leftUser.connnectId // room id
      CONNECTIONS = CONNECTIONS.filter((connection) => connection.connectionId !== disconnectedUserSocketId)
      console.log("filtered connections ", {CONNECTIONS});
      // list of all users in the same connect room
      const connectRoomUsers = CONNECTIONS.filter((connection) => connection.connnectId === leftConnnectId) // get all users of the same room of left user
      connectRoomUsers.forEach((user) => {
        socket.to(user.connectionId).emit("inform_user_left", {
          leftUserId:disconnectedUserSocketId
        })
      })
    }
  })

})

app.use(fileUpload())
// attachment route
app.post("/attachment", (req, res) => {
  const data = req.body
  const file = req.files.sharedAttachment
  const fileDir = path.join(__dirname, "attachments", data.connectId)
  if(!fs.existsSync(fileDir)){
    fs.mkdirSync(fileDir)
  }
  file.mv(path.join(fileDir, file.name), (err) => {
    if(err){
      console.log("file upload failed : ", err);
    }
  })
})

server.listen(8001, () => {
	console.log('app is running ')
})

