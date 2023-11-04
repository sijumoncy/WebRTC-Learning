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
import { socket } from "../socket/socket";
import { useEffect, useState } from "react";
import { setNewRTCConnection } from "../socket/webConnection";

type OtherUsersType = {
  joinedUserId: string;
  joinedConnectId: string;
};

function Room() {
  const [searchParams] = useSearchParams();
  const [otherUsers, setOtherUsers] = useState<OtherUsersType[] | []>([]);

  // handle check for meeting id and user details --> else redirect to home
  const connectId = searchParams.get("connectId");
  const userId = `tempuser`; //need to get from auth / login

  async function addJoinedUser(joinedUserId: string, joinedConnectId: string) {
    setOtherUsers((prev) => [...prev, { joinedUserId, joinedConnectId }]);
    await setNewRTCConnection(joinedConnectId)
  }

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

      // newly joined other user info --> add to UI
      socket.on("new_user_joined_info", (data) => {
        addJoinedUser(data.joinedUserId, data.joinedConnectionId);
      });
    }

    function onDisconnect() {
      console.log("disconnected socket");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

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
        <div></div>
        {/* other users */}
        <div className="grid grid-flow-col">
          {otherUsers.map((other) => (
            <div id={other.joinedConnectId} className="min-w-[15px] min-h-[15px] border border-gray-300 rounded-md flex flex-col justify-center items-center">
              <div className="">
                <video autoPlay muted/>
                <audio className="hidden" autoPlay controls muted/>
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
          <BsFillMicFill className="w-10 h-10 cursor-pointer" />
          <BsFillMicMuteFill className="w-10 h-10 cursor-pointer" />
          <MdCallEnd className="w-10 h-10 text-red-500 cursor-pointer" />
          <FaVideo className="w-10 h-10  cursor-pointer" />
          <FaVideoSlash className="w-10 h-10  cursor-pointer" />
        </div>

        <div className="flex gap-8 items-center text-lg">
          <LuScreenShare className="w-10 h-10  cursor-pointer" />
          <MdMoreVert className="w-10 h-10  cursor-pointer" />
        </div>
      </section>
    </div>
  );
}

export default Room;
