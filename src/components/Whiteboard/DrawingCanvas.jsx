import React, { useEffect } from 'react';

const DrawingCanvas = ({
  canvasRef,
  color,
  lineWidth,
  startDrawing,
  draw,
  endDrawing,
}) => {
  useEffect(() => {
    // 캔버스 초기화 로직
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: 'crosshair',
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={endDrawing}
      onMouseLeave={endDrawing}
    />
  );
};

export default DrawingCanvas;
