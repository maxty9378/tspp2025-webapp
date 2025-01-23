import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserProfile } from '../types';

interface Message {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
  type: 'text' | 'image' | 'task';
  imageUrl?: string;
  taskId?: number;
}

interface ChatProps {
  currentUser: UserProfile;
}

export function Chat({ currentUser }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      text: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleCameraUpload = () => {
    const tg = window.Telegram?.WebApp;
    if (tg?.showPopup) {
      tg.showPopup({
        title: 'Камера',
        message: 'Сделайте фото для отправки в чат',
        buttons: [
          { type: 'default', text: 'Открыть камеру' },
          { type: 'cancel' }
        ]
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 ${
                message.userId === currentUser.id
                  ? 'bg-emerald-primary/20 text-emerald-light'
                  : 'bg-slate-800/50 text-slate-200'
              }`}
            >
              {message.type === 'image' && message.imageUrl && (
                <img
                  src={message.imageUrl}
                  alt="Uploaded content"
                  className="rounded-lg mb-2 max-w-full"
                />
              )}
              <p className="text-sm">{message.text}</p>
              <p className="text-xs opacity-60 mt-1">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={handleImageUpload}
            className="p-2 rounded-full hover:bg-slate-800/50"
          >
            <Image className="w-5 h-5 text-slate-400" />
          </button>
          <button
            onClick={handleCameraUpload}
            className="p-2 rounded-full hover:bg-slate-800/50"
          >
            <Camera className="w-5 h-5 text-slate-400" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Написать сообщение..."
            className="flex-1 bg-slate-800/50 text-slate-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className={`p-2 rounded-full transition-colors ${
              newMessage.trim()
                ? 'bg-emerald-primary/20 text-emerald-light hover:bg-emerald-primary/30'
                : 'bg-slate-800/50 text-slate-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            // Handle file upload
          }}
        />
      </div>
    </div>
  );
}