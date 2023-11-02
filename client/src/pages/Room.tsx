import { useSearchParams } from "react-router-dom"
import {FaUsers, FaVideo, FaVideoSlash} from 'react-icons/fa'
import {BsFillChatLeftDotsFill, BsFillMicFill, BsFillMicMuteFill} from 'react-icons/bs'
import {SlArrowDown} from 'react-icons/sl'
import {MdCallEnd, MdMoreVert} from 'react-icons/md'
import {LuScreenShare} from 'react-icons/lu'

function Room() {

  const [searchParams] = useSearchParams();
  
  // handle check for meeting id and user details --> else redirect to home
  const connectId = searchParams.get('connectId')
  const tempUserId = `tempuser`;

  // componetise later
  return (
    <div className="bg-black/80 w-full h-screen relative">

      {/* top menu bar */}
      <section id="top-menu" className="w-1/4 absolute top-0 left-0 h-20 bg-white flex gap-10 items-center justify-around">
        <div className="flex gap-1 cursor-pointer">
          <FaUsers className="w-10 h-10"/>
          <span>2</span>
        </div>
        <div className="flex gap-1 cursor-pointer">
          <BsFillChatLeftDotsFill className="w-10 h-10"/>
        </div>
      </section>

      {/* main section */}
      <section id="video-section" className="w-full h-full">

      </section>

      {/* bottom menu */}
      <section id="bottom-menu" className="w-full h-28 absolute bottom-0 left-0 bg-white flex items-center justify-around">
        <div className="flex gap-2 items-center cursor-pointer text-lg">
          <span>Meeting Details</span>
          <SlArrowDown className="w-3 h-3"/>
        </div>

        <div className="flex gap-2 items-center text-lg">
          <BsFillMicFill className="w-10 h-10 cursor-pointer"/>
          <BsFillMicMuteFill className="w-10 h-10 cursor-pointer"/>
          <MdCallEnd className="w-10 h-10 text-red-500 cursor-pointer"/>
          <FaVideo className="w-10 h-10  cursor-pointer"/>
          <FaVideoSlash className="w-10 h-10  cursor-pointer"/>
        </div>

        <div className="flex gap-8 items-center text-lg">
          <LuScreenShare className="w-10 h-10  cursor-pointer"/>
          <MdMoreVert className="w-10 h-10  cursor-pointer"/>
        </div>

      </section>
    </div>
  )
}

export default Room