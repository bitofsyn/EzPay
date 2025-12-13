import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types'; // User 타입을 가져옵니다.

// 메시지 타입을 정의합니다.
interface Message {
  text: string;
  sender: 'user' | 'ai';
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // 컴포넌트 마운트 시 사용자 정보를 불러옵니다.
  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // 사용자 정보가 없으면 로그인 페이지로 리다이렉트
      navigate('/login');
    }
  }, [navigate]);

  // 메시지 목록이 변경될 때마다 맨 아래로 스크롤합니다.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading || !user) return;

    const userMessage: Message = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_AI_ASSISTANT_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input, user_id: user.userId }),
      });

      if (!response.ok) {
        throw new Error('AI 서비스로부터 응답을 받는데 실패했습니다.');
      }

      const data = await response.json();
      const aiResponse: Message = { text: data.reply, sender: 'ai' };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error("AI Assistant API 호출 오류:", error);
      const errorResponse: Message = { text: "죄송합니다, AI 비서와 연결하는 데 문제가 발생했습니다.", sender: 'ai' };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h1 className="text-xl font-semibold text-gray-800">AI 재무 비서</h1>
        <p className="text-sm text-gray-500">지출 내역, 예산 등에 대해 질문해보세요.</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-lg px-4 py-2 rounded-xl ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800">
              <span className="animate-pulse">생각 중...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="여기에 메시지를 입력하세요..."
            className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            disabled={isLoading || input.trim() === ''}
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
