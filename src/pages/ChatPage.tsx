import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, X, User, Bot, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatService } from '../api/chat.service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('sirius_session_id') || `session-${Date.now()}`;
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkSession = () => {
      const activeId = localStorage.getItem('sirius_session_id');
      if (activeId && activeId !== sessionId) {
        setSessionId(activeId);
      }
    };
    window.addEventListener('storage', checkSession);
    fetchChatContent();
    return () => window.removeEventListener('storage', checkSession);
  }, [sessionId]);

  const fetchChatContent = async () => {
    try {
      const response = await chatService.getHistory(sessionId);
      if (response && response.length > 0) {
        setMessages(response.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          images: msg.images
        })));
      } else {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! I am Sirius AI. How can I help you today?',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImages(p => [...p, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSend = async () => {
    if (!input.trim() && selectedImages.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      images: selectedImages.length > 0 ? [...selectedImages] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const currentImages = [...selectedImages];
    setSelectedImages([]);
    setIsLoading(true);

    try {
      const apiImages = currentImages.map(img => ({
        data: img.split(',')[1],
        mimeType: img.split(';')[0].split(':')[1]
      }));

      const response = await chatService.sendMessage(input, sessionId, apiImages);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(response.timestamp),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatImageUrl = (url: string) => {
    if (url.startsWith('data:')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return url.startsWith('/') ? `${baseUrl}${url}` : url;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 relative">
      <div className="flex-1 overflow-y-auto px-6 py-10 no-scrollbar">
        <div className="max-w-3xl mx-auto space-y-10 pb-20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
              }`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>

              <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className={`p-4 rounded-2xl text-[14.5px] leading-7 ${
                  msg.role === 'user' ? 'bg-slate-800 text-slate-100 rounded-tr-none' : 'bg-slate-100 dark:bg-slate-900 dark:text-slate-200 rounded-tl-none'
                }`}>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-3 last:mb-0 whitespace-pre-wrap">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-5 mb-3 space-y-1">{children}</ul>,
                      li: ({ children }) => <li className="leading-7">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold text-emerald-500">{children}</strong>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>

                  {msg.images && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {msg.images.map((img, i) => (
                        <img key={i} src={formatImageUrl(img)} alt="upload" className="rounded-lg w-full h-auto border border-black/10 dark:border-white/10" />
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-medium text-slate-400 uppercase px-2 tracking-tighter">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-3 text-emerald-500/70 font-medium px-12">
              <Sparkles size={14} className="animate-spin" />
              <span className="text-[11px] uppercase tracking-widest">Sirius AI is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white dark:from-slate-950 dark:via-slate-950 to-transparent z-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-1.5 transition-all focus-within:bg-slate-200/50 dark:focus-within:bg-slate-800/80">
            {selectedImages.length > 0 && (
              <div className="flex gap-2 p-2 mb-1 overflow-x-auto no-scrollbar">
                {selectedImages.map((img, i) => (
                  <div key={i} className="relative group flex-shrink-0">
                    <img src={img} className="w-16 h-16 rounded-lg object-cover border border-slate-300 dark:border-slate-700" />
                    <button onClick={() => setSelectedImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-slate-800 text-white rounded-full p-1 shadow-md">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 px-3">
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} multiple accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all">
                <ImageIcon size={20} />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Ask Sirius AI anything..."
                className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-[14px] py-3 no-scrollbar resize-none dark:text-white"
                rows={1}
              />
              <button onClick={handleSend} disabled={isLoading} className="w-10 h-10 flex items-center justify-center bg-slate-800 dark:bg-emerald-600 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
