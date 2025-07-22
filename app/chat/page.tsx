'use client';

import { useState, useEffect, useRef } from 'react';
// import { useUser } from '@clerk/nextjs'; // Temporarily disabled
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  // const { user, isLoaded } = useUser(); // Temporarily disabled
  const user = { id: 'temp-user-' + Date.now() };
  const isLoaded = true;
  
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

  // Initialize a new conversation
  const initializeConversation = async () => {
    try {
      setIsLoadingHistory(true);
      const newConversationId = uuidv4();
      setConversationId(newConversationId);
      
      // Load conversation history if exists
      if (user?.id) {
        await loadConversationHistory(user.id, newConversationId);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      setError('Failed to initialize conversation');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load conversation history from database
  const loadConversationHistory = async (userId: string, convId: string) => {
    try {
      const response = await fetch('/api/conversation/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          conversationId: convId,
          action: 'load'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        }
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  // Save message to conversation history
  const saveMessageToHistory = async (message: Message) => {
    if (!user?.id || !conversationId) return;

    try {
      await fetch('/api/conversation/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          conversationId,
          action: 'save',
          message: {
            role: message.role,
            content: message.content,
            timestamp: message.timestamp
          }
        })
      });
    } catch (error) {
      console.error('Error saving message to history:', error);
    }
  };

  // Detect if input is Hebrew
  const isHebrew = (text: string) => {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text);
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message to state
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to history
    await saveMessageToHistory(userMessage);
    
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      // Detect language and prepare context
      const inputIsHebrew = isHebrew(userMessage.content);
      const languageInstruction = inputIsHebrew 
        ? "CRITICAL: Respond ONLY in Hebrew. Do not use English words or phrases."
        : "CRITICAL: Respond ONLY in English. Do not use Hebrew words or phrases.";

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          languageInstruction,
          conversationId,
          userId: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      // Add assistant message to state
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message to history
      await saveMessageToHistory(assistantMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(`Failed to send message: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start new conversation
  const startNewConversation = () => {
    setMessages([]);
    setError('');
    initializeConversation();
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    if (isLoaded && !isLoadingHistory) {
      inputRef.current?.focus();
    }
  }, [isLoaded, isLoadingHistory]);

  if (!isLoaded || isLoadingHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black bg-opacity-20 backdrop-blur-sm border-b border-white border-opacity-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Beyond Mask AI</h1>
          <button
            onClick={startNewConversation}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white border-opacity-30 transition-all duration-200"
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto h-[calc(100vh-80px)] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-white text-opacity-70 mt-20">
              <h2 className="text-3xl font-bold mb-4">Welcome to Beyond Mask AI</h2>
              <p className="text-lg mb-2">Your Jungian psychology companion</p>
              <p className="text-sm">Start a conversation in Hebrew or English</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-white bg-opacity-20 backdrop-blur-sm text-white ml-12'
                    : 'bg-black bg-opacity-30 backdrop-blur-sm text-white mr-12'
                } border border-white border-opacity-20`}
                dir={isHebrew(message.content) ? 'rtl' : 'ltr'}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs text-white text-opacity-50 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-3xl p-4 rounded-2xl bg-black bg-opacity-30 backdrop-blur-sm text-white mr-12 border border-white border-opacity-20">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 py-2 bg-red-500 bg-opacity-20 backdrop-blur-sm text-red-200 border border-red-500 border-opacity-30 mx-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="p-4">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Hebrew or English)"
              className="flex-1 p-4 rounded-2xl bg-white bg-opacity-20 backdrop-blur-sm text-white placeholder-white placeholder-opacity-50 border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              disabled={isLoading}
              dir="auto"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-4 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm text-white rounded-2xl border border-white border-opacity-30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}