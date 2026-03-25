// src/components/ChatWindow.js
import React, { useEffect, useState } from 'react';
import { getChats, sendMessage } from '../services/api';
import Message from '../Message';

const ChatWindow = ({ conversationId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      const data = await getChats('messages', conversationId);
      setMessages(data.data);
    };
    fetchMessages();
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      await sendMessage(conversationId, newMessage, null);
      setNewMessage('');
      const data = await getChats('messages', conversationId);
      setMessages(data.data);
    }
  };

  return (
    <div>
      <h2>Chat</h2>
      <div>
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
};

export default ChatWindow;