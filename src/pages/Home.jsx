import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const handleEnterRoom = () => {
    const roomId = prompt('Enter Room ID');
    if (roomId) navigate(`/room/${roomId}`);
  };

  return (
    <div>
      <h1>화이트보드 회의</h1>
      <button onClick={handleEnterRoom}>회의실 입장</button>
    </div>
  );
}
