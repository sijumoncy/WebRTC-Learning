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

io.on("connection", (socket) => {
	console.log('user connected', socket.id)
})

server.listen(8000, () => {
	console.log('app is running ')
})

