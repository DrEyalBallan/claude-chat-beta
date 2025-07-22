'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { user, isLoaded } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize conversation on component mount
  useEffect(() => {
    if (isLoaded && user) {
      initializeConversation();
    }
  }, [isLoaded, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when not loading
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeConversation = async () => {
    setIsLoadingHistory(true);
    setError('');
    
    try {
      // Generate or retrieve conversation ID from localStorage
      const storedConversationId = localStorage.getItem('currentConversationId');
      const currentConversationId = storedConversationId || uuidv4();
      
      if (!storedConversationId) {
        localStorage.setItem('currentConversationId', currentConversationId);
      }
      
      setConversationId(currentConversationId);
      
      // Load conversation history if conversation exists
      if (storedConversationId) {
        await loadConversationHistory(currentConversationId);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      setError('Failed to initialize conversation');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadConversationHistory = async (convId: string) => {
    try {
      const response = await fetch('/api/conversation/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          userId: user?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((msg: any) => ({
            id: msg.id || uuidv4(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          })));
        }
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      // Don't show error for history loading failure
    }
  };

  const startNewConversation = () => {
    const newConversationId = uuidv4();
    localStorage.setItem('currentConversationId', newConversationId);
    setConversationId(newConversationId);
    setMessages([]);
    setError('');
    
    // Focus input after starting new conversation
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading || !user || !conversationId) {
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: conversationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant response to messages
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Add error message to chat
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'מצטער, אירעה שגיאה. אנא נסה שוב. / Sorry, an error occurred. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while initializing
  if (!isLoaded || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">טוען שיחה... / Loading chat...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!user) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Beyond Mask AI</h1>
              <p className="text-gray-300 text-sm">
                שלום {user.firstName} / Hello {user.firstName}
              </p>
            </div>
          </div>
          
          <button
            onClick={startNewConversation}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors"
            disabled={isLoading}
          >
            שיחה חדשה / New Chat
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-2 m-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-white/70 mt-20">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">B</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">ברוכים הבאים ל-Beyond Mask AI</h2>
              <p className="mb-2">Welcome to Beyond Mask AI</p>
              <p className="text-sm">התחל שיחה בעברית או באנגלית / Start a conversation in Hebrew or English</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white/10 backdrop-blur-md text-white border border-white/20'
                  }`}
                  dir="auto"
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-black/20 backdrop-blur-md border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex space-x-4 rtl:space-x-reverse">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="כתוב הודעה... / Type a message..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              disabled={isLoading}
              dir="auto"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-pink-600 transition-colors"
            >
              {isLoading ? '...' : 'שלח / Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}