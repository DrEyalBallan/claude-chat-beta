'use client'
import { useState } from 'react'

export default function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const downloadChat = () => {
    const chatData = {
      timestamp: new Date().toISOString(),
      messages: messages
    };
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    const userMessage = message;
    setMessage('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      
      const data = await response.json();
      
      // Add Claude's response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo placeholder - you can add your actual logo here */}
<img src="/images/logo.png" alt="Beyond Mask" className="w-10 h-10 object-contain" />            <h1 className="text-white text-2xl font-bold">Beyond Mask</h1>
          </div>
          <button 
            onClick={downloadChat}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
          >
            📥 Download Chat
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-20">
              <div className="text-6xl mb-4">🎭</div>
              <h2 className="text-2xl font-semibold mb-2">Welcome to Beyond Mask</h2>
              <p className="text-lg">Discover your true self, create your best version</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-green-500 to-green-400 text-white ml-12' 
                  : 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 text-white mr-12'
              }`}>
                <div className="flex items-start space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    msg.role === 'user' ? 'bg-white/20' : 'bg-black/20'
                  }`}>
                    {msg.role === 'user' ? '👤' : '🎭'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium opacity-80 mb-1">
                      {msg.role === 'user' ? 'You' : 'Psychology Guide'}
                    </p>
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 text-white rounded-2xl p-4 mr-12 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-sm">
                    🎭
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium opacity-80 mb-1">Psychology Guide</p>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-t border-gray-700/50">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
                placeholder="Explore what lies beneath your mask..."
                disabled={loading}
                className="w-full px-6 py-4 bg-gray-800/70 border border-gray-600/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🎭
              </div>
            </div>
            <button 
              onClick={sendMessage} 
              disabled={loading || !message.trim()}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 disabled:from-gray-600 disabled:to-gray-500 text-white rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg"
            >
              {loading ? '⏳' : '🚀'} Send
            </button>
          </div>
          
          <div className="mt-3 text-center text-gray-500 text-sm">
            Journey into the depths of your authentic self
          </div>
        </div>
      </div>
    </div>
  );
}
