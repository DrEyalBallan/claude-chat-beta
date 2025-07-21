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
    <div style={{ padding: '20px' }}>
      <h1>My Chat App</h1>
      
      <div style={{ height: '400px', border: '1px solid #ccc', padding: '10px', marginBottom: '10px', overflowY: 'scroll' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <strong>{msg.role === 'user' ? 'You' : 'Claude'}:</strong> {msg.content}
          </div>
        ))}
        {loading && <div>Claude is typing...</div>}
      </div>
      
      <div>
        <input 
          type="text" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message here..."
          style={{ width: '300px', padding: '10px' }}
        />
        <button onClick={sendMessage} disabled={loading} style={{ padding: '10px', marginLeft: '10px' }}>
          Send
        </button>
        <button onClick={downloadChat} style={{ padding: '10px', marginLeft: '10px', backgroundColor: '#4CAF50', color: 'white' }}>
          Download Chat
        </button>
      </div>
    </div>
  );
}