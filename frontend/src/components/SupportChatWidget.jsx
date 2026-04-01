import React, { useMemo, useRef, useState } from 'react';
import apiClient from '../apiClient';
import './SupportChatWidget.css';

const initialMessages = [
  {
    role: 'assistant',
    content: 'Hi! I am your GVP support assistant. Ask me anything about profiles, dashboards, forms, or role access.'
  }
];

const SupportChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [error, setError] = useState('');
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [suppressToggleClick, setSuppressToggleClick] = useState(false);
  const rootRef = useRef(null);
  const dragRef = useRef({
    isActive: false,
    offsetX: 0,
    offsetY: 0,
    moved: false,
    cleanup: null,
  });

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  const sendMessage = async (messageText) => {
    const text = String(messageText || '').trim();
    if (!text || isSending) return;

    const nextUserMessage = { role: 'user', content: text };
    const nextMessages = [...messages, nextUserMessage];

    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsSending(true);

    try {
      const history = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await apiClient.post('/api/support-chat/chat', {
        message: text,
        history
      }, {
        timeout: 60000
      });

      const assistantReply = response.data?.reply || 'I am here to help. Could you try asking that another way?';

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantReply }]);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to connect to support right now.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I am having trouble connecting at the moment. Please try again in a moment.'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    await sendMessage(input);
  };

  const clampPosition = (x, y) => {
    const widgetRect = rootRef.current?.getBoundingClientRect();
    const widgetWidth = widgetRect?.width || 320;
    const widgetHeight = widgetRect?.height || 68;
    const margin = 8;
    const maxX = Math.max(margin, window.innerWidth - widgetWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - widgetHeight - margin);

    return {
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(margin, y), maxY),
    };
  };

  const stopDrag = () => {
    dragRef.current.isActive = false;
    if (dragRef.current.cleanup) {
      dragRef.current.cleanup();
      dragRef.current.cleanup = null;
    }
    if (dragRef.current.moved) {
      setSuppressToggleClick(true);
      window.setTimeout(() => setSuppressToggleClick(false), 0);
    }
    setIsDragging(false);
  };

  const startDrag = (clientX, clientY) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current.isActive = true;
    dragRef.current.moved = false;
    dragRef.current.offsetX = clientX - rect.left;
    dragRef.current.offsetY = clientY - rect.top;

    if (!position) {
      setPosition({ x: rect.left, y: rect.top });
    }

    const handleMouseMove = (moveEvent) => {
      if (!dragRef.current.isActive) return;
      const nextX = moveEvent.clientX - dragRef.current.offsetX;
      const nextY = moveEvent.clientY - dragRef.current.offsetY;
      const clamped = clampPosition(nextX, nextY);
      setPosition(clamped);
      dragRef.current.moved = true;
      setIsDragging(true);
    };

    const handleTouchMove = (moveEvent) => {
      if (!dragRef.current.isActive || !moveEvent.touches?.length) return;
      const touch = moveEvent.touches[0];
      const nextX = touch.clientX - dragRef.current.offsetX;
      const nextY = touch.clientY - dragRef.current.offsetY;
      const clamped = clampPosition(nextX, nextY);
      setPosition(clamped);
      dragRef.current.moved = true;
      setIsDragging(true);
      moveEvent.preventDefault();
    };

    const handleMouseUp = () => stopDrag();
    const handleTouchEnd = () => stopDrag();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    dragRef.current.cleanup = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  };

  const onDragStartMouse = (e) => {
    if (e.button !== 0) return;
    startDrag(e.clientX, e.clientY);
  };

  const onDragStartTouch = (e) => {
    if (!e.touches?.length) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  const rootStyle = position
    ? { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' }
    : undefined;

  return (
    <div
      ref={rootRef}
      className={`support-chat-root ${isDragging ? 'dragging' : ''}`}
      style={rootStyle}
      aria-live="polite"
    >
      {isOpen && (
        <div className="support-chat-panel" role="dialog" aria-label="Customer support chat">
          <div
            className="support-chat-header support-chat-drag-handle"
            onMouseDown={onDragStartMouse}
            onTouchStart={onDragStartTouch}
          >
            <div>
              <h4>GVP Support</h4>
              <p>Instant help via AI assistant</p>
            </div>
            <button
              type="button"
              className="support-chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close support chat"
            >
              x
            </button>
          </div>

          <div className="support-chat-messages">
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`support-chat-bubble ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {isSending && <div className="support-chat-bubble assistant">Thinking...</div>}
          </div>

          {error && <div className="support-chat-error">{error}</div>}

          <form className="support-chat-form" onSubmit={onSubmit}>
            <input
              type="text"
              placeholder="Ask your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={2000}
            />
            <button type="submit" disabled={!canSend}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="support-chat-fab support-chat-drag-handle"
        onMouseDown={onDragStartMouse}
        onTouchStart={onDragStartTouch}
        onClick={() => {
          if (suppressToggleClick) return;
          setIsOpen((prev) => !prev);
        }}
        aria-label="Open customer support chat"
      >
        {isOpen ? 'Close Chat' : 'Chat Support'}
      </button>
    </div>
  );
};

export default SupportChatWidget;
