import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  removeMediaSenders,
  setNewRTCConnection,
  updateMediaSenders,
  handleLeftUserConnection,
} from "../socket/webConnection";

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
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{
    userName: string;
    connectionId: string;
  }>();
  const [otherUsers, setOtherUsers] = useState<OtherUsersType[] | []>([]);
  const [othersVideoStreams, setOthersVideoStreams] = useState<{
    [key: string]: MediaStream | null;
  }>({});
  const [othersAudioStreams, setOthersAudioStreams] = useState<{
    [key: string]: MediaStream | null;
  }>({});

  const [audio, setaudio] = useState<MediaStream | null>(null);
  const [isMicMute, setIsMicMute] = useState(true);
  const [rtpAudioSenders, setRtpAudioSenders] = useState<{
    [key: string]: RTCRtpSender | null;
  }>({});

  const [videoStatus, setVideoStatus] = useState<VideoStates>(VideoStates.None);
  const [localVideo, setLocalVideo] = useState<MediaStream | null>(null);
  const [rtpVideoSenders, setRtpVideoSenders] = useState<{
    [key: string]: RTCRtpSender | null;
  }>({});

  const [detailsTab, setDetailsTab] = useState<null | "chat" | "participants">(
    "chat"
  );

  const [message, setMessage] = useState("");
  const [allChat, setAllChat] = useState<
    {
      from: string;
      message: string;
      time: string;
      own?: boolean;
      file?: {
        fileName: string;
        fileDir: string;
      };
    }[]
  >([]);

  const [recordStarted, setRecordStarted] = useState(false)
  const [mediaRecorder, setNewMediaRecorder] = useState<MediaRecorder | null>()
  const [recordedBlobURL, setRecordedBlobURL] = useState<string | null>()

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
    if (
      remoteVideoStream &&
      currentUser?.connectionId &&
      rtpVideoSenders[currentUser?.connectionId]
    ) {
      // update : video streams (need to move the to setNewRTCconnection last in MVP)
      const newRtpVideoSenders = await updateMediaSenders(
        remoteVideoStream[currentUser?.connectionId]!.getTracks()[0],
        rtpVideoSenders
      );
      setRtpVideoSenders(newRtpVideoSenders);
    }
  }

  async function loadAudio() {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      const audioTrack = audioStream.getAudioTracks()[0];
      return audioTrack;
    } catch (err) {
      console.log("audio load error : ", err);
    }
  }

  // handle mic and audio
  const handleMicrophone = async () => {
    let audioTrack;
    if (!audio) {
      audioTrack = await loadAudio();
      if (audioTrack) {
        setaudio(new MediaStream([audioTrack]));
      }
      console.log("Audio Permission not granded");
    }
    if (isMicMute) {
      setIsMicMute(false);
      if (audioTrack) {
        updateMediaSenders(audioTrack, rtpAudioSenders);
        const newRtpAudioSenders = await updateMediaSenders(
          audioTrack,
          rtpAudioSenders
        );
        setRtpAudioSenders(newRtpAudioSenders);
      }
    } else {
      setIsMicMute(true);
      removeMediaSenders(rtpAudioSenders);
    }
  };

  const removeVideoStream = (rtpVideoSenders: {
    [key: string]: RTCRtpSender | null;
  }) => {
    if (localVideo) {
      localVideo.getVideoTracks()[0].stop();
      setLocalVideo(null);
      removeMediaSenders(rtpVideoSenders);
    }
  };

  const handleVideoOrScreen = async (type: VideoStates) => {
    if (type === VideoStates.None) {
      removeVideoStream(rtpVideoSenders);
      return;
    }
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
          audio: false,
        });
        // remove video on screen sharing..
      }
      if (stream && stream.getVideoTracks().length > 0) {
        const currentTrack = stream.getVideoTracks()[0];
        setLocalVideo(new MediaStream([currentTrack]));
        const newRtpVideoSenders = await updateMediaSenders(
          currentTrack,
          rtpVideoSenders
        );
        setRtpVideoSenders(newRtpVideoSenders);
      }
    } catch (err) {
      console.log("error loading user media : ", err);
    }
  };

  // handle Video Control
  const handleVideo = async () => {
    if (videoStatus === VideoStates.Camera) {
      setVideoStatus(VideoStates.None);
      await handleVideoOrScreen(VideoStates.None);
    } else {
      setVideoStatus(VideoStates.Camera);
      await handleVideoOrScreen(VideoStates.Camera);
    }
  };

  // handle Screen Share Control
  const handleScreenShare = async () => {
    if (videoStatus === VideoStates.Screen) {
      setVideoStatus(VideoStates.None);
      await handleVideoOrScreen(VideoStates.None);
    } else {
      setVideoStatus(VideoStates.Screen);
      // process the video or screen
      await handleVideoOrScreen(VideoStates.Screen);
    }
  };

  // send messsage
  const messageHandler = () => {
    socket.emit("sendMessage", { message });
    setMessage("");

    // push the own message.
    setAllChat((prev) => [
      ...prev,
      {
        from: "",
        message: message,
        own: true,
        time: new Date().toLocaleString(),
      },
    ]);
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
      setCurrentUser({
        userName: data.joinedUserId,
        connectionId: data.joinedConnectionId,
      });
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
      // update media call (that need to be call last in setNewRTCConnection)
    }

    async function informAboutUserLeft(data: { leftUserId: string }) {
      console.log("inoformation about left user :", data);
      // remove left user from others UI
      const newOtherUsers = otherUsers.filter(
        (userObj) => userObj.joinedUserId !== data.leftUserId
      );
      setOtherUsers(newOtherUsers);
      // remove medias
      const { remoteVideoStream, remoteAudioStream } =
        await handleLeftUserConnection(data.leftUserId);
      setOthersVideoStreams(remoteVideoStream);
      setOthersAudioStreams(remoteAudioStream);
    }

    function onDisconnect() {
      console.log("disconnected socket");
    }

    function onNewMessageRecieve(data: { from: string; message: string }) {
      const time = new Date();
      const localTIme = time.toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      setAllChat((prev) => [
        ...prev,
        { from: data.from, message: data.message, time: localTIme },
      ]);
    }

    function onNewAttachment(data: {
      connectId: string;
      username: string;
      fileName: string;
      fileDir: string;
    }) {
      const time = new Date().toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });

      setAllChat((prev) => [
        ...prev,
        {
          from: data.username,
          message: `Attachement : ${data.fileName}`,
          time: time,
          file: { fileName: data.fileName, fileDir: data.fileDir },
        },
      ]);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_user_joined_info", onNewJoin);
    socket.on("inform_new_user_about_others", infoAboutOtherUsers);
    socket.on("SDPProcess", onSDPProcess);
    socket.on("inform_user_left", informAboutUserLeft);
    socket.on("newMessageRecived", onNewMessageRecieve);
    socket.on("newFileAttached", onNewAttachment);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_user_joined_info", onNewJoin);
      socket.off("inform_new_user_about_others", infoAboutOtherUsers);
      socket.off("onSDPProcess", onSDPProcess);
      socket.off("inform_user_left", informAboutUserLeft);
      socket.off("newMessageRecived", onNewMessageRecieve);
      socket.off("newFileAttached", onNewAttachment);
    };
  }, [connectId, userId, socket]);

  const handleDetailsTab = (type: null | "chat" | "participants") => {
    if (type === detailsTab) {
      setDetailsTab(null);
    } else {
      setDetailsTab(type);
    }
  };

  const handleEndCall = () => {
    if (confirm("Really want to leave ?")) {
      navigate("/");
    }
  };

  const handleFullScreen = (
    e: React.MouseEvent<HTMLVideoElement, MouseEvent>
  ) => {
    const videoElement = e.currentTarget;
    if (videoElement) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      }
    }
  };

  const handleAttachement = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && connectId && currentUser) {
      const file = e.target.files[0];
      console.log({ file });
      const formData = new FormData();
      formData.append("sharedAttachment", file);
      formData.append("connectId", connectId);
      formData.append("userName", currentUser?.userName);

      // send the file to backen with axios

      //after send to backend
      socket.emit("fileAttachedInfoToOthers", {
        connectId,
        username: currentUser.userName,
        fileName: file.name,
      });
    }
  };

  // async function captureScreen(media = {
  //   video : true
  // }){
  //   const screenStream = await navigator.mediaDevices.getDisplayMedia(media)
  //   return screenStream;
  // }

  // async function captureAudio(media = {
  //   video : false,
  //   audio:true
  // }){
  //   const audioStream = await navigator.mediaDevices.getUserMedia(media)
  //   return audioStream;
  // }

  const handleRecord = async () => {
    if(recordStarted){
      if(confirm("Do you want to stop recording")){
        setRecordStarted(prev => !prev)
      }
    }else{
      setRecordStarted(prev => !prev)
      // const chucks:Blob[]= []
      // const screenStream = await captureScreen()
      // const audioStream = await captureAudio()
      // const recordStream = new MediaStream([...screenStream.getTracks(), ...audioStream.getTracks()])
      // const record = new MediaRecorder(recordStream)
      // setNewMediaRecorder(record)
      // record.start()
      // record.onstop((e) => {
      //   recordStream.getTracks().forEach((track) => track.stop())
      //   if(chucks.length) {
      //     const blob = new Blob(chucks, {
      //       type:"video/webm"
      //     })
      //     const url = window.URL.createObjectURL(blob)
      //     setRecordedBlobURL(url)
      //   }
      // })
      // record.ondataavailable = (e) => {
      //   chucks.push(e.data)
      // }
    }
  }

  // componetise later
  return (
    <div className="bg-black/80 w-full h-screen relative">
      {/* top menu bar */}
      <section
        id="top-menu"
        className="w-1/4 absolute top-0 right-0 h-20 bg-white flex flex-col"
      >
        <div className="flex w-full h-full justify-around items-center">
          <div
            className="flex gap-1 cursor-pointer"
            onClick={() => handleDetailsTab("participants")}
          >
            <FaUsers className="w-10 h-10" />
            <span>{otherUsers.length}</span>
          </div>
          <div
            className="flex gap-1 cursor-pointer"
            onClick={() => handleDetailsTab("chat")}
          >
            <BsFillChatLeftDotsFill className="w-10 h-10" />
          </div>
        </div>
        {detailsTab && (
          <div className="bg-white absolute top-28 right-0 max-h-[500px] h-[500px] w-full">
            <p className="w-full p-3 font-medium">{detailsTab}</p>
            {detailsTab === "participants" && (
              <div id="perticipants-details">
                {otherUsers?.map((user) => (
                  <span>{user.joinedConnectionId}</span>
                ))}
              </div>
            )}

            {detailsTab === "chat" && (
              <div id="chat-details" className="p-3 w-full h-[90%]">
                <div className=" h-full p-3 relative">
                  <div id="chat-display">
                    {allChat.map((chat, index) => (
                      <div
                        key={index}
                        className={`flex flex-col gap-1 mb-2 ${
                          chat?.own && "bg-gray-500"
                        }`}
                      >
                        <div>
                          {chat.from} <span>{chat.time}</span>
                        </div>
                        <p>{chat.message}</p>
                        {chat.file && (
                          <div className="bg-gray-800 text-white">
                            <button>{chat.file.fileName}</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div
                    id="message-section"
                    className=" absolute flex gap-5 bottom-3 items-center"
                  >
                    <input
                      type="text"
                      className="bg-transparent border border-gray-700 rounded-md"
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <button
                      className="bg-gray-500 w-8 h-full rounded-full text-white"
                      onClick={messageHandler}
                    >
                      &gt;
                    </button>
                    <div className=" bg-gray-400 px-2 py-1 relative">
                      <input
                        type="file"
                        className="w-full h-full block absolute top-0 bottom-0 left-0 right-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleAttachement(e)}
                      />
                      <p className="">File</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
                vidElement && localVideo && (vidElement.srcObject = localVideo)
              }
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
                  onDoubleClick={(e) => handleFullScreen(e)}
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

          <button className="cursor-pointer" onClick={handleEndCall}>
            <MdCallEnd className="w-10 h-10 text-red-500 cursor-pointer" />
          </button>

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
          <button onClick={handleRecord}>{recordStarted ? "Recording" : "Record" }</button>
          {recordedBlobURL && (
            <a href={recordedBlobURL} download={'meetingRecord.webm'}>
              Download Recording
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

export default Room;
