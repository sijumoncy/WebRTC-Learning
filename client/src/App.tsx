import Home from "./pages/Home"
import { Route, Routes } from "react-router"
import Room from "./pages/Room"
import NotFoundPage from "./pages/NotFoundPage"

function App() {

  return (
    <>
      <Routes>
        <Route path="/" Component={Home}/>
        <Route path="/room" Component={Room}/>
        <Route path="*" Component={NotFoundPage}/>
      </Routes>
    </>
  )
}

export default App
