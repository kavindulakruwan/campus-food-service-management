import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../../hooks/useAuth';
import { getMessages, postMessage, type ChatMessage } from '../../api/chat.api';

const CommunityChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const savedMessage = await postMessage(newMessage);
      setMessages([...messages, savedMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow animate-pulse h-64"></div>;
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-emerald-50/50">
        <h3 className="font-semibold text-gray-900">Community Chat</h3>
        <p className="text-sm text-gray-500">Discuss meal plans and share ideas!</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm mt-10">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user._id === user?.id; // Assuming user.id matches
            return (
              <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">{msg.user.name}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommunityChat;