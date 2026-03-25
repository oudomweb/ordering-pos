// src/components/UserSearch.js
import React, { useState } from 'react';
import { searchUsers } from '../services/api';

const UserSearch = ({ onAddUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);

  const handleSearch = async () => {
    const data = await searchUsers(searchTerm);
    setUsers(data.data);
  };

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
      <ul>
        {users.map((user) => (
          <li key={user.id} onClick={() => onAddUser(user.id)}>
            {user.username}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserSearch;