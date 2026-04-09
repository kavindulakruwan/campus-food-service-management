import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { postBotMessage } from '../../api/chat.api';

export const MealPlannerChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isBot: boolean }[]>([
    { text: 'Hello! I am your AI Meal Planning Assistant. How can I help you today?', isBot: true },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, isBot: false }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await postBotMessage(userMessage, messages);
      setMessages((prev) => [...prev, { text: response.reply, isBot: true }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { text: 'Sorry, I am having trouble connecting right now. Please try again later.', isBot: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white dark:bg-gray-800 w-80 sm:w-96 rounded-2xl shadow-2xl mb-4 border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
          <div className="bg-orange-600 text-white p-4 flex justify-between items-center rounded-t-2xl">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare size={20} />
              Meal Planner AI Assistant
            </h3>
            <button
              onClick={toggleChat}
              className="text-white hover:bg-orange-500 p-1 rounded-full transition-colors"
              aria-label="Close Chat"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="h-80 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.isBot
                    ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 self-start rounded-tl-sm shadow-sm'
                    : 'bg-orange-600 text-white self-end rounded-tr-sm shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 self-start max-w-[85%] p-3 rounded-2xl rounded-tl-sm shadow-sm text-sm flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2 rounded-b-2xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask for meal ideas..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-orange-600 text-white p-2 rounded-full hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-xl transition-transform hover:scale-105 flex items-center justify-center animate-bounce-short"
          aria-label="Open Chatbot"
        >
          <MessageSquare size={28} />
        </button>
      )}
    </div>
  );
};