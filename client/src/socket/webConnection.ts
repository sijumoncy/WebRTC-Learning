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

export const peersConnectionIds:{[key:string] : string} = {};
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

function CheckConnectionStatus(peerId:RTCPeerConnection) {
    if(peerId && (peerId.connectionState === "new" || peerId.connectionState === "connecting" || peerId.connectionState === "connected")){
      return true;
    }else {
      return false;
    }
  }

// update tracks based on actions
async function updateMediaSenders(track:MediaStreamTrack, rtpSenders:{[key:string]:RTCRtpSender | null}) {
    Object.keys(peersConnectionIds).forEach((peerId) => {
      if(CheckConnectionStatus(peersConnection[peerId])){
        if(typeof rtpSenders[peerId] && rtpSenders[peerId]?.track) {
          rtpSenders[peerId]?.replaceTrack(track)
        }else{
          rtpSenders[peerId] = peersConnection[peerId].addTrack(track)
        }
      }
    })
    return rtpSenders;
}

async function removeMediaSenders(rtpSenders:{[key:string]:RTCRtpSender | null}){
    Object.keys(peersConnectionIds).forEach((peerId) => {
        const sender = rtpSenders[peerId]
        if(sender !== null && CheckConnectionStatus(peersConnection[peerId])){
            peersConnection[peerId].removeTrack(sender)
            rtpSenders[peerId] = null
        }
    })
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

    peersConnectionIds[joinedConnectId] = joinedConnectId
    peersConnection[joinedConnectId] = rtcConnection

    // call video audio update media sender if tracks are available ---> do it later (need state of rtpsenders)
    // this is for get the get the mediaStream status of the existing users in room to new joined user

    return {remoteVideoStream, remoteAudioStream, rtcConnection}
}

export {setNewRTCConnection, updateMediaSenders, removeMediaSenders}