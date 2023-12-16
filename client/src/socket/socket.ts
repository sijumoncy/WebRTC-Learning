import io from "socket.io-client";
import { peersConnection, setNewRTCConnection } from "./webConnection";

const URL = "http://localhost:8001";

const socket = io(URL);

// fucntion to send user iceconfig to server
async function SDPFunction(data: string, toConnectionId: string) {
  socket.emit("SDPProcess", {
    message: data,
    toConnectionId,
  });
}

// function to recieve and process SDP send configs : msg --> stringlify data
async function SDPClientSideProcess( message: string, fromConnectionId:string){
    console.log("sdp send data : ", {message, fromConnectionId});
    const recievedHandShake = JSON.parse(message) // local description offer / answer
    if(recievedHandShake.offer){
      console.log("reieved offer : ", recievedHandShake);
      // if the from id not in peers connection -> setRTC connection
      if(!peersConnection[fromConnectionId]){
        await setNewRTCConnection(fromConnectionId)
      }
      await peersConnection[fromConnectionId].setRemoteDescription(new RTCSessionDescription(recievedHandShake.offer))
      const answer = await peersConnection[fromConnectionId].createAnswer()
      await peersConnection[fromConnectionId].setLocalDescription(answer)
      // send back the answer to the who user send the offer
      await SDPFunction(JSON.stringify({answer:answer}), fromConnectionId)

    } else if (recievedHandShake.answer){
      // check the answer recieved from the sender
      console.log("reieved answer : ", recievedHandShake);
      await peersConnection[fromConnectionId].setRemoteDescription(new RTCSessionDescription(recievedHandShake.answer))
    } else if(recievedHandShake.iceCanditate){
      // if the shared data is of iceCandidate
      if(!peersConnection[fromConnectionId]){
        await setNewRTCConnection(fromConnectionId)
      }
      try {
        await peersConnection[fromConnectionId].addIceCandidate(recievedHandShake.iceCandidate)
      } catch(err){
        console.log("ice candidate set error  : ", err);
        
      }
    }
}

export { socket, SDPFunction, SDPClientSideProcess };
