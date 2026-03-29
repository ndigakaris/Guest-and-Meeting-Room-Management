import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Bot, Send } from 'lucide-react';
import { toast } from 'sonner';

export const AIChat = () => {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hello! I\'m your AI assistant for meeting room bookings. I can help you find available rooms, suggest the best options based on your needs, and answer questions about our facilities. How can I assist you today?'
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    setLoading(true);
    try {
      const response = await api.post('/ai/chat', {
        message: userMessage,
        session_id: 'default',
      });

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.data.response },
      ]);
    } catch (error) {
      toast.error('AI service error');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div data-testid="ai-chat-page" className="h-[calc(100vh-4rem)]">
        <div 
          className="bg-white border border-zinc-200 h-full flex flex-col"
        >
          {/* Header */}
          <div 
            className="p-6 border-b border-zinc-200"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1773053525998-8cb667020fa7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwxfHxibHVlJTIwdGVjaCUyMGdsb3dpbmclMjBhYnN0cmFjdHxlbnwwfHx8fDE3NzQ3NjIwMjV8MA&ixlib=rb-4.1.0&q=85)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#0047FF] flex items-center justify-center">
                <Bot size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  AI Booking Assistant
                </h1>
                <p className="text-sm text-white/90">Powered by Claude Sonnet 4.5</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
                data-testid={`chat-message-${index}`}
              >
                <div
                  className={`max-w-[70%] p-4 ${
                    message.role === 'user'
                      ? 'bg-[#0047FF] text-white'
                      : 'bg-zinc-50 border border-zinc-200 text-[#0A0A0A]'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Bot size={16} className="inline mr-2 text-[#0047FF]" />
                  )}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-50 border border-zinc-200 p-4">
                  <Bot size={16} className="inline mr-2 text-[#0047FF]" />
                  <span className="text-[#737373]">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-6 border-t border-zinc-200">
            <form onSubmit={handleSend} className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about room availability, amenities, or get recommendations..."
                disabled={loading}
                className="flex-1 border border-zinc-200 px-4 py-3"
                style={{ borderRadius: 0 }}
                data-testid="chat-input"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-[#0047FF] hover:bg-[#0038CC] text-white px-6 py-3 flex items-center gap-2"
                style={{ borderRadius: 0 }}
                data-testid="send-message-button"
              >
                <Send size={20} />
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};
