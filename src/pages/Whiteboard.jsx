// Whiteboard.jsx
import React, { useRef, useEffect, useState } from 'react';
import getUserId from '../utils/userId';
import { useParams } from 'react-router-dom';

const Whiteboard = () => {
  const { roomId = 'default' } = useParams();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const socketRef = useRef(null);
  const drawing = useRef(false);

  const userId = useRef(getUserId());
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [strokes, setStrokes] = useState([]);
  const [myStrokes, setMyStrokes] = useState([]);
  const currentStroke = useRef([]);
  const [chatLog, setChatLog] = useState([]);
  const [message, setMessage] = useState('');

  const drawBackground = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const { width, height } = canvas;

    ctx.save();
    ctx.fillStyle = '#fdf6e3';
    ctx.fillRect(0, 0, width, height);

  // 가로줄
  ctx.strokeStyle = '#d0cfc7'; // 회색 줄
  ctx.lineWidth = 1;
  const lineSpacing = 32;

  for (let y = lineSpacing; y < height; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 2 / 3;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctxRef.current = ctx;
    const socket = new WebSocket(
      `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${import.meta.env.VITE_WS_BASE_URL}?roomId=${roomId}`
    );
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ WebSocket 연결됨');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'stroke') {
        setStrokes(prev => [...prev, data]);
      } else if (data.type === 'undo') {
        setStrokes(prev => {
          const updated = [...prev];
          const idx = [...updated].reverse().findIndex(s => s.userId === data.userId);
          if (idx !== -1) {
            updated.splice(updated.length - 1 - idx, 1);
          }
          return updated;
        });
        if (data.userId === userId.current) {
          setMyStrokes(prev => prev.slice(0, -1));
        }
      } else if (data.type === 'chat') {
        setChatLog(prev => [...prev, data]);
      }
    };

    socket.onclose = () => console.log('❎ WebSocket 연결 종료됨');

    // ✅ 브라우저 닫기/새로고침 시 자동 퇴장 처리
    const handleBeforeUnload = () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'chat',
          chatType: 'CONNECTION',
          userId: userId.current,
          message: `${userId.current}님이 퇴장하셨습니다.`
        }));
        socketRef.current.close();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socket.close();
    };
  }, [roomId]);

  useEffect(() => {
    redraw(strokes);
  }, [strokes]);

  const startDrawing = (e) => {
    drawing.current = true;
    currentStroke.current = [{ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }];
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
  };

  const draw = (e) => {
    if (!drawing.current) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    const ctx = ctxRef.current;
    ctx.lineTo(x, y);
    ctx.stroke();
    currentStroke.current.push({ x, y });
  };

  const endDrawing = () => {
    if (!drawing.current) return;
    drawing.current = false;
    ctxRef.current.closePath();

    const strokeData = {
      type: 'stroke',
      userId: userId.current,
      color,
      width: lineWidth,
      points: currentStroke.current
    };

    socketRef.current.send(JSON.stringify(strokeData));
    setMyStrokes(prev => [...prev, strokeData]);
  };

  const drawStroke = (stroke) => {
    if (!stroke.points?.length) return;
    const ctx = ctxRef.current;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    const [{ x, y }, ...rest] = stroke.points;
    ctx.moveTo(x, y);
    rest.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.closePath();
  };

  const redraw = (strokeList) => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    drawBackground();
    strokeList.forEach(drawStroke);
  };

  const handleUndo = () => {
    socketRef.current.send(JSON.stringify({
      type: 'undo',
      userId: userId.current
    }));
  };

  const sendMessage = () => {
    if (message.trim() === '') return;

    socketRef.current.send(JSON.stringify({
      type: 'chat',
      chatType: 'CHAT',
      userId: userId.current,
      message,
    }));
    setMessage('');
  };

  // ✅ 터치 이벤트
  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      const offsetX = touch.clientX - rect.left;
      const offsetY = touch.clientY - rect.top;

      drawing.current = true;
      currentStroke.current = [{ x: offsetX, y: offsetY }];

      const ctx = ctxRef.current;
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    };

    const handleTouchMove = (e) => {
      if (!drawing.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const offsetX = touch.clientX - rect.left;
      const offsetY = touch.clientY - rect.top;

      const ctx = ctxRef.current;
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
      currentStroke.current.push({ x: offsetX, y: offsetY });
    };

    const handleTouchEnd = () => {
      if (!drawing.current) return;
      drawing.current = false;
      ctxRef.current.closePath();

      const strokeData = {
        type: 'stroke',
        userId: userId.current,
        color,
        width: lineWidth,
        points: currentStroke.current
      };

      socketRef.current.send(JSON.stringify(strokeData));
      setMyStrokes(prev => [...prev, strokeData]);
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [color, lineWidth]);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* 채팅창 */}
      <div style={{
        width: '33%',
        backgroundColor: '#fafafa',
        borderRight: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '12px'
        }}>
          {chatLog.map((entry, idx) => {
            const isMe = entry.userId === userId.current;

            if (entry.chatType === 'CONNECTION') {
              return (
                <div key={idx} style={{
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  color: '#999',
                  marginBottom: '6px'
                }}>
                  👋 {entry.message}
                </div>
              );
            }

            return (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                marginBottom: '6px'
              }}>
                <div style={{
                  backgroundColor: isMe ? '#00289d' : '#e5e7eb',
                  color: isMe ? '#fff' : '#111',
                  padding: '8px 12px',
                  borderRadius: '16px',
                  maxWidth: '70%',
                  wordWrap: 'break-word'
                }}>
                  <div style={{ fontSize: '0.75rem', marginBottom: '4px', opacity: 0.6 }}>
                    {entry.userId}
                  </div>
                  <div>{entry.message}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && sendMessage()}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #ccc'
            }}
            placeholder="메시지 입력..."
          />
          <button onClick={sendMessage} style={{
            background: '#00289d',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer'
          }}>
            전송
          </button>
        </div>
      </div>

      {/* 화이트보드 */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          alignItems: 'center'
        }}>
          <label>
            🎨 <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
          <label>
            ✏️ <input type="range" min="1" max="10" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} />
          </label>
          <button onClick={handleUndo} style={{
            background: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ⟳
          </button>
        </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        />
        </div>
    </div>
  );
};

export default Whiteboard;
