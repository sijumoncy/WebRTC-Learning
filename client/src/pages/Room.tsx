import { useSearchParams } from "react-router-dom"


function Room() {

  const [searchParams] = useSearchParams();
  
  const connectId = searchParams.get('connectId')

  return (
    <div>Room : {connectId}</div>
  )
}

export default Room