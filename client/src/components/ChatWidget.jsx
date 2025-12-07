import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import api from '../utils/api';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'bot', text: 'Hi! How can I help schedule your day?' }]);
  const [input, setInput] = useState('');

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const { data } = await api.post('/tasks/chat', { message: userMsg.text });
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am offline.' }]);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>

      {/* Chat Window */}
      {isOpen && (
        <div style={{ 
          marginBottom: '15px', 
          width: '300px', 
          height: '400px', 
          background: 'var(--bg-card)', 
          borderRadius: '16px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)', 
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>AI Assistant</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ 
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                background: m.sender === 'user' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)',
                padding: '8px 12px',
                borderRadius: '12px',
                maxWidth: '80%',
                fontSize: '14px'
              }}>
                {m.text}
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px' }}>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
            />
            <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer' }}><Send size={18} /></button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          background: 'var(--accent-purple)', 
          border: 'none', 
          color: 'white', 
          cursor: 'pointer',
          boxShadow: '0 5px 20px rgba(180, 103, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <MessageSquare size={28} />
      </button>
    </div>
  );
};

export default ChatWidget;