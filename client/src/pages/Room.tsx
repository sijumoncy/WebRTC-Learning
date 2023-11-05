import { useSearchParams } from "react-router-dom";
import { FaUsers, FaVideo, FaVideoSlash } from "react-icons/fa";
import {
  BsFillChatLeftDotsFill,
  BsFillMicFill,
  BsFillMicMuteFill,
} from "react-icons/bs";
import { SlArrowDown } from "react-icons/sl";
import { MdCallEnd, MdMoreVert } from "react-icons/md";
import { LuScreenShare } from "react-icons/lu";
import { SDPClientSideProcess, socket } from "../socket/socket";
import { useEffect, useState } from "react";
import { setNewRTCConnection } from "../socket/webConnection";

type OtherUsersType = {
  joinedUserId: string;
  joinedConnectionId: string;
};

enum VideoStates {
  None = 0,
  Camera = 1,
  Screen = 2,
}

function Room() {
  const [searchParams] = useSearchParams();
  const [otherUsers, setOtherUsers] = useState<OtherUsersType[] | []>([]);
  const [othersVideoStreams, setOthersVideoStreams] = useState<{
    [key: string]: MediaStream;
  }>({});
  const [othersAudioStreams, setOthersAudioStreams] = useState<{
    [key: string]: MediaStream;
  }>({});

  const [audio, setaudio] = useState(false);
  const [isMicMute, setIsMicMute] = useState(true);
  const [rtpAudioSenders, setRtpAudioSenders] = useState([]);

  const [videoStatus, setVideoStatus] = useState<VideoStates>(VideoStates.None);
  const [localVideo, setLocalVideo] = useState<MediaStream>();

  // handle check for meeting id and user details --> else redirect to home
  const connectId = searchParams.get("connectId");
  const userId = `tempuser`; //need to get from auth / login

  async function addJoinedUser(
    joinedUserId: string,
    joinedConnectionId: string
  ) {
    setOtherUsers((prev) => [...prev, { joinedUserId, joinedConnectionId }]);
    const { remoteVideoStream, remoteAudioStream } = await setNewRTCConnection(
      joinedConnectionId
    );
    setOthersVideoStreams(remoteVideoStream);
    setOthersAudioStreams(remoteAudioStream);
  }

  // handle mic and audio
  const handleMicrophone = async () => {
    if (!audio) {
      await loadAudio();
      console.log("Audio Permission not granded");
    }
    if (isMicMute) {
      setIsMicMute(true);
      updateMediaSenders(audio, rtpAudioSenders);
    } else {
      setIsMicMute(false);
      removeMediaSenders(rtpAudioSenders);
    }
  };

  const handleVideoOrScreen = async (type: VideoStates) => {
    try {
      let stream = null;
      if (type === VideoStates.Camera && navigator) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1400,
            height: 900,
          },
          audio: false,
        });
      } else if (type === VideoStates.Screen && navigator) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: 1400,
            height: 900,
          },
        });
      }
      if (stream && stream.getVideoTracks().length > 0) {
        const currentTrack = stream.getVideoTracks()[0];
        setLocalVideo(new MediaStream([currentTrack]))
      }
    } catch (err) {
      console.log("error loading user media : ", err);
    }
  };

  // handle Video Control
  const handleVideo = async () => {
    if (videoStatus === VideoStates.Camera) {
      setVideoStatus(VideoStates.None);
    } else {
      setVideoStatus(VideoStates.Camera);
      await handleVideoOrScreen(VideoStates.Camera);
    }
  };

  // handle Screen Share Control
  const handleScreenShare = async () => {
    if (videoStatus === VideoStates.Screen) {
      setVideoStatus(VideoStates.None);
    } else {
      setVideoStatus(VideoStates.Screen);
      await handleVideoOrScreen(VideoStates.Screen);
    }
  };

  // socket connection
  useEffect(() => {
    function onConnect() {
      console.log("connected socket");
      // connecting to a room for logined user
      if (socket.connected) {
        if (userId && connectId) {
          socket.emit("userconnected", {
            disaplayName: userId,
            connectId,
          });
        }
      }
    }

    // newly joined other user info --> add to UI
    function onNewJoin(data: {
      joinedUserId: string;
      joinedConnectionId: string;
    }) {
      addJoinedUser(data.joinedUserId, data.joinedConnectionId);
    }

    // Info about other users who are in the room to newly joined
    function infoAboutOtherUsers(
      otherUsers: { joinedUserId: string; joinedConnectionId: string }[]
    ) {
      if (otherUsers) {
        otherUsers.forEach((other) => {
          addJoinedUser(other.joinedUserId, other.joinedConnectionId);
        });
      }
    }

    // fucntion to hadle emitted config and streams
    async function onSDPProcess(data: {
      message: string;
      fromConnectionId: string;
    }) {
      await SDPClientSideProcess(data.message, data.fromConnectionId);
    }

    function onDisconnect() {
      console.log("disconnected socket");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_user_joined_info", onNewJoin);
    socket.on("inform_new_user_about_others", infoAboutOtherUsers);
    socket.on("SDPProcess", onSDPProcess);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_user_joined_info", onNewJoin);
      socket.off("inform_new_user_about_others", infoAboutOtherUsers);
      socket.off("onSDPProcess", onSDPProcess);
    };
  }, [connectId, userId, socket]);

  // componetise later
  return (
    <div className="bg-black/80 w-full h-screen relative">
      {/* top menu bar */}
      <section
        id="top-menu"
        className="w-1/4 absolute top-0 left-0 h-20 bg-white flex gap-10 items-center justify-around"
      >
        <div className="flex gap-1 cursor-pointer">
          <FaUsers className="w-10 h-10" />
          <span>2</span>
        </div>
        <div className="flex gap-1 cursor-pointer">
          <BsFillChatLeftDotsFill className="w-10 h-10" />
        </div>
      </section>

      {/* main section */}
      <section id="video-section" className="w-full h-full">
        {/* own ui */}
        <div>
          <div className="">
            <video
              className=""
              autoPlay
              muted
              ref={(vidElement) =>
                vidElement && localVideo && (vidElement.srcObject =localVideo)}
            />
          </div>
        </div>
        {/* other users */}
        <div className="grid grid-flow-col">
          {otherUsers.map((other) => (
            <div
              id={other.joinedConnectionId}
              className="min-w-[15px] min-h-[15px] border border-gray-300 rounded-md flex flex-col justify-center items-center"
            >
              <div className="">
                <video
                  className=""
                  autoPlay
                  muted
                  ref={(vidElement) =>
                    vidElement &&
                    (vidElement.srcObject =
                      othersVideoStreams[other.joinedConnectionId])
                  }
                />
                <audio
                  className="hidden"
                  src=""
                  autoPlay
                  controls
                  muted
                  ref={(audioElm) =>
                    audioElm &&
                    (audioElm.srcObject =
                      othersAudioStreams[other.joinedConnectionId])
                  }
                />
              </div>
              <span className="text-sm font-medium">{other.joinedUserId}</span>
            </div>
          ))}
        </div>
      </section>

      {/* bottom menu */}
      <section
        id="bottom-menu"
        className="w-full h-28 absolute bottom-0 left-0 bg-white flex items-center justify-around"
      >
        <div className="flex gap-2 items-center cursor-pointer text-lg">
          <span>Meeting Details</span>
          <SlArrowDown className="w-3 h-3" />
        </div>

        <div className="flex gap-2 items-center text-lg">
          <button className="cursor-pointer" onClick={() => handleMicrophone()}>
            {isMicMute ? (
              <BsFillMicMuteFill className="w-10 h-10" />
            ) : (
              <BsFillMicFill className="w-10 h-10" />
            )}
          </button>

          <MdCallEnd className="w-10 h-10 text-red-500 cursor-pointer" />

          <button className="cursor-pointer" onClick={() => handleVideo()}>
            {videoStatus === VideoStates.Camera ? (
              <FaVideo className="w-10 h-10 " />
            ) : (
              <FaVideoSlash className="w-10 h-10 " />
            )}
          </button>
        </div>

        <div className="flex gap-8 items-center text-lg">
          <button
            className="cursor-pointer"
            onClick={() => handleScreenShare()}
          >
            <LuScreenShare className="w-10 h-10 " />
          </button>
          <button className="cursor-pointer">
            <MdMoreVert className="w-10 h-10 " />
          </button>
        </div>
      </section>
    </div>
  );
}

export default Room;
