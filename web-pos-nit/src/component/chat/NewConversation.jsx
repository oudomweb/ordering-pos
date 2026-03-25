// src/components/NewConversation.js
import React, { useState } from 'react';
import { createConversation } from '../services/api';
import UserSearch from '../UserSearch';

const NewConversation = ({ onConversationCreated }) => {
  const [name, setName] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [participants, setParticipants] = useState([]);

  const handleCreateConversation = async () => {
    const data = await createConversation(name, isGroup, participants);
    onConversationCreated(data.data);
  };

  const handleAddParticipant = (userId) => {
    setParticipants([...participants, userId]);
  };

  return (
    <div>
      <h2>New Conversation</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Conversation Name"
      />
      <label>
        <input
          type="checkbox"
          checked={isGroup}
          onChange={(e) => setIsGroup(e.target.checked)}
        />
        Group Conversation
      </label>
      <UserSearch onAddUser={handleAddParticipant} />
      <button onClick={handleCreateConversation}>Create</button>
    </div>
  );
};

export default NewConversation;