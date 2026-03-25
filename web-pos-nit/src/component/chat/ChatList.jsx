// src/components/ChatList.js
import React, { useEffect, useState } from 'react';
import { getChats } from '../services/api';

const ChatList = ({ onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const fetchConversations = async () => {
      const data = await getChats('conversations');
      setConversations(data.data);
    };
    fetchConversations();
  }, []);

  return (
    <div>
      <h2>Conversations</h2>
      <ul>
        {conversations.map((conversation) => (
          <li key={conversation.id} onClick={() => onSelectConversation(conversation.id)}>
            {conversation.name || 'Group Chat'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatList;