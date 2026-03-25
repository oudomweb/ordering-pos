// src/components/Message.js
import React from 'react';

const Message = ({ message }) => {
  return (
    <div>
      <strong>{message.sender.username}: </strong>
      {message.content}
      {message.image_url && <img src={message.image_url} alt="message" />}
    </div>
  );
};

export default Message;