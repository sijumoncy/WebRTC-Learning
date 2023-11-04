import { SDPFunction } from "./socket";

// later move to hooks (after protottyping)
const iceConfig = {
    iceServers: [
        {
            urls:'stun:stun.l.google.com:19302'
        },
        {
            urls:'stun:stun1.l.google.com:19302'
        }
    ]
}

const peersConnectionId:{[key:string] : string} = {};
const peersConnection:{[key:string] : RTCPeerConnection} = {};

async function setOffer(joinedConnectId:string) {
    const connection = peersConnection[joinedConnectId]
    const offer = await connection.createOffer()
    await connection.setLocalDescription(offer)
    SDPFunction(JSON.stringify({
        offer: connection.localDescription,
    }), joinedConnectId)
}

const setNewRTCConnection = async (joinedConnectId:string) => {
    // function to generate connection between users
    console.log("inside generate rtc connection --> ", {joinedConnectId});
    const rtcConnection = new RTCPeerConnection(iceConfig);

    // send an offer
    rtcConnection.onnegotiationneeded = async function(event) {
        await setOffer(joinedConnectId)
    }
    rtcConnection.onicecandidate = function(event){
        if(event.candidate){
            // serverProcess(JSON.stringify({iceCanditate:event.candidate}), joinedConnectId)
            SDPFunction(JSON.stringify({iceCanditate:event.candidate}), joinedConnectId)
        }
    }

    rtcConnection.ontrack = function(event) {

    }

    peersConnectionId[joinedConnectId] =(joinedConnectId)
    peersConnection[joinedConnectId] = rtcConnection
}

export {setNewRTCConnection}