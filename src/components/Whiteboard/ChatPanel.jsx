import React from 'react';

const ChatPanel = ({ chatLog, message, setMessage, sendMessage, userId }) => {
  return (
    <div style={panelStyles}>
      {/*상단*/}
      <div style={messagesContainerStyles}>
        {chatLog.map((entry, idx) => (
          <ChatMessage
            key={idx}
            entry={entry}
            isMe={entry.userId === userId.current}
          />
        ))}
      </div>
      {/*하단*/}
      <div style={inputContainerStyles}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && sendMessage()}
          style={inputStyles}
          placeholder="메시지 입력..."
        />
        <button onClick={sendMessage} style={buttonStyles}>
          전송
        </button>
      </div>
    </div>
  );
};

const ChatMessage = ({ entry, isMe }) => {
  if (entry.chatType === 'CONNECTION') {
    return <div style={connectionMessageStyles}>👋 {entry.message}</div>;
  }

  return (
    <div
      style={{
        ...messageContainerStyles,
        justifyContent: isMe ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          ...messageBubbleStyles,
          backgroundColor: isMe ? '#00289d' : '#e5e7eb',
          color: isMe ? '#fff' : '#111',
        }}
      >
        <div style={userIdStyles}>{entry.userId}</div>
        <div>{entry.message}</div>
      </div>
    </div>
  );
};

// 스타일 객체들
const panelStyles = {
  width: '33%',
  backgroundColor: '#fafafa',
  borderRight: '1px solid #ddd',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  boxSizing: 'border-box',
};

const messagesContainerStyles = {
  flex: 1,
  overflowY: 'auto',
  marginBottom: '12px',
  '&::WebkitScrollbar': {
    width: '6px',
  },
  '&::WebkitScrollbarTrack': {
    background: '#f1f1f1',
  },
  '&::WebkitScrollbarThumb': {
    background: '#888',
    borderRadius: '3px',
  },
  '&::WebkitScrollbarThumb:hover': {
    background: '#555',
  },
};

const inputContainerStyles = {
  display: 'flex',
  gap: '8px',
};

const inputStyles = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  outline: 'none',
  fontSize: '14px',
  '&:focus': {
    borderColor: '#00289d',
    boxShadow: '0 0 0 2px rgba(0, 40, 157, 0.2)',
  },
};

const buttonStyles = {
  background: '#00289d',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'background-color 0.2s',
  '&:hover': {
    background: '#001a6e',
  },
  '&:active': {
    background: '#00114d',
  },
};

const connectionMessageStyles = {
  textAlign: 'center',
  fontSize: '0.9rem',
  color: '#999',
  marginBottom: '6px',
  padding: '4px 0',
};

const messageContainerStyles = {
  display: 'flex',
  marginBottom: '6px',
};

const messageBubbleStyles = {
  padding: '8px 12px',
  borderRadius: '16px',
  maxWidth: '70%',
  wordWrap: 'break-word',
  lineHeight: '1.4',
};

const userIdStyles = {
  fontSize: '0.75rem',
  marginBottom: '4px',
  opacity: 0.6,
};

export default ChatPanel;
