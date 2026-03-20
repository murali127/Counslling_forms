import React, { useMemo, useState } from 'react';
import apiClient from '../apiClient';
import './SupportChatWidget.css';

const initialMessages = [
  {
    role: 'assistant',
    content: 'Hi! I am your GVP support assistant. Ask me anything about profiles, dashboards, forms, or role access.'
  }
];

const quickPrompts = [
  'How do I complete my profile?',
  'Where can I download counseling forms?',
  'How to assign students to admin?',
  'Why is profile completion not 100%?'
];

const SupportChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [error, setError] = useState('');

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

  const onPromptClick = async (prompt) => {
    if (isSending) return;
    await sendMessage(prompt);
  };

  return (
    <div className="support-chat-root" aria-live="polite">
      {isOpen && (
        <div className="support-chat-panel" role="dialog" aria-label="Customer support chat">
          <div className="support-chat-header">
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

          <div className="support-chat-prompts">
            {quickPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => onPromptClick(prompt)} disabled={isSending}>
                {prompt}
              </button>
            ))}
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
        className="support-chat-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open customer support chat"
      >
        {isOpen ? 'Close Chat' : 'Chat Support'}
      </button>
    </div>
  );
};

export default SupportChatWidget;
