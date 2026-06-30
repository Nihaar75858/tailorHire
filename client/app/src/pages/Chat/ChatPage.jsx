// ============================================
// src/pages/ChatPage.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import ChatWindow from '../../components/chat/ChatWindow';
import ChatInput from '../../components/chat/ChatInput';
import ApiService from '../../services/api';

const flattenChatMessage = (record) => {
  const bubbles = [
    { id: `${record.id}-user`, message: record.message, sender: 'user' },
  ];
  if (record.response) {
    bubbles.push({ id: `${record.id}-ai`, message: record.response, sender: 'ai' });
  }
  return bubbles;
};

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        const data = await ApiService.getChatHistory();
        const records = data.results ?? data; // handle paginated or bare-array response
        // Model orders newest-first by default; display needs oldest-first
        const chronological = [...records].reverse();
        setMessages(chronological.flatMap(flattenChatMessage));
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setError('Failed to load chat history');
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

  const handleSendMessage = async (text) => {
    const userBubble = { id: `temp-${Date.now()}`, message: text, sender: 'user' };
    setMessages((prev) => [...prev, userBubble]);
    setSending(true);
    setError(null);

    try {
      const record = await ApiService.sendMessage(text);
      const aiBubble = { id: `${record.id}-ai`, message: record.response, sender: 'ai' };
      setMessages((prev) => [...prev, aiBubble]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-12rem)] flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">AI Career Assistant</h2>
        <p className="text-gray-600 mt-1">
          Ask me anything about jobs, interviews, or career guidance
        </p>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      {loadingHistory ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading conversation...
        </div>
      ) : (
        <ChatWindow messages={messages} />
      )}
      <ChatInput onSend={handleSendMessage} disabled={sending} />
    </div>
  );
};

export default ChatPage;