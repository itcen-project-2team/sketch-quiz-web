import React, { useRef, useEffect, useState } from 'react';
import getUserId from '../utils/userId';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const socketRef = useRef(null);
  const drawing = useRef(false);

  const userId = useRef(getUserId());
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [strokes, setStrokes] = useState([]); // 전체 stroke
  const [myStrokes, setMyStrokes] = useState([]); // 내 stroke만

  const currentStroke = useRef([]);

  // Canvas 및 WebSocket 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctxRef.current = ctx;

    const socket = new WebSocket('ws://localhost:8080/ws/canvas');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket 연결됨');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'stroke') {
        setStrokes(prev => [...prev, data]);
      }

      if (data.type === 'undo') {
        console.log("🧨 undo 수신", data.userId);

        setStrokes(prev => {
          const updated = [...prev];
          const idx = [...updated].reverse().findIndex(s => s.userId === data.userId);
          if (idx !== -1) {
            const realIndex = updated.length - 1 - idx;
            updated.splice(realIndex, 1);
          }
          return updated;
        });

        if (data.userId === userId.current) {
          setMyStrokes(prev => prev.slice(0, -1));
        }
      }
    };

    socket.onclose = () => {
      console.log('WebSocket 연결 종료됨');
    };

    return () => socket.close();
  }, []);

  // strokes 배열 변경 시 canvas 다시 그리기
  useEffect(() => {
    redraw(strokes);
  }, [strokes]);

  const startDrawing = (e) => {
    drawing.current = true;
    currentStroke.current = [{ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }];
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    ctxRef.current.lineTo(x, y);
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineWidth = lineWidth;
    ctxRef.current.stroke();
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
    strokeList.forEach(drawStroke);
  };

  const handleUndo = () => {
    if (myStrokes.length === 0) return;
    socketRef.current.send(JSON.stringify({
      type: 'undo',
      userId: userId.current
    }));
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 툴바 UI */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        alignItems: 'center'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          🎨
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          ✏️
          <input
            type="range"
            min="1"
            max="10"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
        </label>
        <button
          onClick={handleUndo}
          style={{
            background: '#ff5c5c',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            cursor: 'pointer'
          }}
        >
          ⬅ Undo
        </button>
      </div>

      {/* 캔버스 */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
      />
    </div>
  );
};

export default Whiteboard;
