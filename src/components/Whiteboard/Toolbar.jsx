import React from 'react';

const Toolbar = ({ color, setColor, lineWidth, setLineWidth, handleUndo }) => {
  return (
    <div style={toolbarStyles}>
      {/*색상 조정*/}
      <label>
        🎨{' '}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </label>
      {/*굵기 조정*/}
      <label>
        ✏️{' '}
        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
        />
      </label>
      {/*되돌리기*/}
      <button onClick={handleUndo} style={undoButtonStyles}>
        ⟳
      </button>
    </div>
  );
};

const toolbarStyles = {
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
  alignItems: 'center',
};

const undoButtonStyles = {
  background: '#4CAF50',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '16px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

export default Toolbar;
