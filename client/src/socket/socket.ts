import io from "socket.io-client";

const URL = "http://localhost:8000";

const socket = io(URL);

// fucntion to send user iceconfig to server
function SDPFunction(data: string, toConnectionId: string) {
  socket.emit("SDPProcess", {
    message: data,
    toConnectionId,
  });
}

export { socket, SDPFunction };
