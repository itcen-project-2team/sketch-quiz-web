import { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import getUserId from '../utils/userId.js';

const useWhiteboard = () => {
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

  // 배경 그리기 (노트패드 스타일)
  const drawBackground = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const { width, height } = canvas;

    ctx.save();
    ctx.fillStyle = '#fdf6e3';
    ctx.fillRect(0, 0, width, height);

    // 가로줄
    ctx.strokeStyle = '#d0cfc7';
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

  // 웹소켓 연결 및 이벤트 핸들러 설정
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = (window.innerWidth * 2) / 3;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctxRef.current = ctx;

    const socket = new WebSocket(
      `${import.meta.env.VITE_WS_BASE_URL}?roomId=${roomId}`
    );
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ WebSocket 연결됨');

      socket.send(
        JSON.stringify({
          type: 'chat',
          chatType: 'CONNECTION',
          userId: userId.current,
          message: `${userId.current}님이 입장하셨습니다.`,
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'stroke') {
        setStrokes((prev) => [...prev, data]);
      } else if (data.type === 'undo') {
        setStrokes((prev) => {
          const updated = [...prev];
          const idx = [...updated]
            .reverse()
            .findIndex((s) => s.userId === data.userId);
          if (idx !== -1) {
            updated.splice(updated.length - 1 - idx, 1);
          }
          return updated;
        });
        if (data.userId === userId.current) {
          setMyStrokes((prev) => prev.slice(0, -1));
        }
      } else if (data.type === 'chat') {
        setChatLog((prev) => [...prev, data]);
      }
    };

    socket.onclose = () => console.log('❎ WebSocket 연결 종료됨');

    // 브라우저 닫기/새로고침 시 자동 퇴장 처리
    const handleBeforeUnload = () => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(
          JSON.stringify({
            type: 'chat',
            chatType: 'CONNECTION',
            userId: userId.current,
            message: `${userId.current}님이 퇴장하셨습니다.`,
          })
        );
        socketRef.current.close();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socket.close();
    };
  }, [roomId]);

  // 스트로크 리렌더링
  useEffect(() => {
    redraw(strokes);
  }, [strokes]);

  // 드로잉 시작
  const startDrawing = (e) => {
    drawing.current = true;
    currentStroke.current = [
      { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY },
    ];
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
  };

  // 드로잉 중
  const draw = (e) => {
    if (!drawing.current) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    const ctx = ctxRef.current;
    ctx.lineTo(x, y);
    ctx.stroke();
    currentStroke.current.push({ x, y });
  };

  // 드로잉 종료
  const endDrawing = () => {
    if (!drawing.current) return;
    drawing.current = false;
    ctxRef.current.closePath();

    const strokeData = {
      type: 'stroke',
      userId: userId.current,
      color,
      width: lineWidth,
      points: currentStroke.current,
    };

    socketRef.current.send(JSON.stringify(strokeData));
    setMyStrokes((prev) => [...prev, strokeData]);
  };

  // 개별 스트로크 그리기
  const drawStroke = (stroke) => {
    if (!stroke.points?.length) return;
    const ctx = ctxRef.current;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.beginPath();
    const [{ x, y }, ...rest] = stroke.points;
    ctx.moveTo(x, y);
    rest.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.closePath();
  };

  // 전체 캔버스 다시 그리기
  const redraw = (strokeList) => {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    drawBackground();
    strokeList.forEach(drawStroke);
  };

  // 실행 취소
  const handleUndo = () => {
    socketRef.current.send(
      JSON.stringify({
        type: 'undo',
        userId: userId.current,
      })
    );
  };

  // 메시지 전송
  const sendMessage = () => {
    if (message.trim() === '') return;

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not open yet.');
      return;
    }

    socket.send(
      JSON.stringify({
        type: 'chat',
        chatType: 'CHAT',
        userId: userId.current,
        message,
      })
    );
    setMessage('');
  };

  // 터치 이벤트 핸들러
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
        points: currentStroke.current,
      };

      socketRef.current.send(JSON.stringify(strokeData));
      setMyStrokes((prev) => [...prev, strokeData]);
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

  return {
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
  };
};

export default useWhiteboard;
