import { ChangeEvent, useRef, useState } from "react";
import { useNavigate } from "react-router";

// initially setup dummy UI - with only fucntionality setup (Prototype)
function Home() {

  const connectIdInput = useRef<HTMLInputElement | null>(null);

  const [connectId, setConnectId] = useState("");

  const navigate  = useNavigate()

  const handleRedirectToRoom = () => {
    if(connectId) {
      navigate(`/room?connectId=${connectId}`)
    } else {
      alert('enter a connectId')
    }
  }

  const handleConnectNow = () => {
    const generatedId = Math.floor(Math.random() * (10**8))
    navigate(`/room?connectId=${generatedId}`)
  }

  return (
    <div>
      {/* header section */}
      <section
        id="header"
        className="w-full h-20 border-b-2 border-b-gray-900 flex justify-around items-center"
      >
        <h1 className="text-2xl font-bold">Connect</h1>
        <nav>
          <ul className="list-none flex gap-3">
            <li className="text-sm text-gray-800 p-2 border border-gray-400 rounded-md hover:bg-gray-800 hover:text-white cursor-pointer">
              sign Up
            </li>
            <li 
            className="text-sm text-gray-800 p-2 border border-gray-400 rounded-md hover:bg-gray-800 hover:text-white cursor-pointer"
            onClick={() => connectIdInput.current?.focus()}
            >
              Join
            </li>
            <li 
              className="text-sm text-gray-800 p-2 border border-gray-400 rounded-md hover:bg-gray-800 hover:text-white cursor-pointer"
              onClick={handleConnectNow}
              >
              Connect Now
            </li>
          </ul>
        </nav>
      </section>

      <main id="main" className="w-full min-h-[calc(100vh_-_80px)] bg-gray-100">
        <div className="flex gap-8 pt-20 justify-center">
          <button
            role="button"
            tabIndex={-1}
            onClick={handleConnectNow}
            className="px-4 py-2 rounded-md border border-gray-400 hover:bg-gray-800 hover:text-white"
          >
            Connect Now +
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              ref={connectIdInput}
              className="bg-transparent p-2 border border-gray-400 rounded-md"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setConnectId(e.target.value)
              }
              value={connectId}
            />
            <button
              role="button"
              tabIndex={-1}
              className="px-4 py-2 rounded-md border border-gray-400 hover:bg-gray-800 hover:text-white"
              onClick={() => handleRedirectToRoom()}
            >
              Join
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
