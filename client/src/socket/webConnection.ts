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

export const peersConnectionId:{[key:string] : string} = {};
export const peersConnection:{[key:string] : RTCPeerConnection} = {};
const remoteVideoStream:{[key:string] : MediaStream} = {}
const remoteAudioStream:{[key:string] : MediaStream} = {}

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
            SDPFunction(JSON.stringify({iceCanditate:event.candidate}), joinedConnectId)
        }
    }

    // get connected streams and data
    rtcConnection.ontrack = function(event) {
        if(!remoteVideoStream[joinedConnectId]){
            remoteVideoStream[joinedConnectId] = new MediaStream()
        }
        if(!remoteAudioStream[joinedConnectId]){
            remoteAudioStream[joinedConnectId] = new MediaStream()
        }
        if(event.track.kind === 'video') {
            remoteVideoStream[joinedConnectId].getVideoTracks()
            .forEach((vidTrack) => remoteVideoStream[joinedConnectId].removeTrack(vidTrack))
            remoteVideoStream[joinedConnectId].addTrack(event.track)
        }
        if(event.track.kind === 'audio') { 
            remoteAudioStream[joinedConnectId].getVideoTracks()
            .forEach((audioTrack) => remoteAudioStream[joinedConnectId].removeTrack(audioTrack))
            remoteAudioStream[joinedConnectId].addTrack(event.track)
        }
    }

    peersConnectionId[joinedConnectId] =(joinedConnectId)
    peersConnection[joinedConnectId] = rtcConnection

    return {remoteVideoStream, remoteAudioStream, rtcConnection}
}

export {setNewRTCConnection}