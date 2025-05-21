import React from 'react';
import { useParams } from 'react-router-dom';
import useWhiteboard from '../hooks/useWhiteboard.js';
import ChatPanel from '../components/Whiteboard/ChatPanel.jsx';
import DrawingCanvas from '../components/Whiteboard/DrawingCanvas.jsx';
import Toolbar from '../components/Whiteboard/Toolbar.jsx';

const Whiteboard = () => {
  const { roomId = 'default' } = useParams();
  const {
    canvasRef,
    color,
    setColor,
    lineWidth,
    setLineWidth,
    strokes,
    chatLog,
    message,
    setMessage,
    userId,
    startDrawing,
    draw,
    endDrawing,
    handleUndo,
    sendMessage,
  } = useWhiteboard(roomId);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {/*왼쪽*/}
      <ChatPanel
        chatLog={chatLog}
        message={message}
        setMessage={setMessage}
        sendMessage={sendMessage}
        userId={userId}
      />

      {/*오른쪽*/}
      <div style={{ flex: 1, position: 'relative' }}>
        {/*툴바*/}
        <Toolbar
          color={color}
          setColor={setColor}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          handleUndo={handleUndo}
          d
        />
        {/*그림판*/}
        <DrawingCanvas
          canvasRef={canvasRef}
          color={color}
          lineWidth={lineWidth}
          startDrawing={startDrawing}
          draw={draw}
          endDrawing={endDrawing}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
