// // src/page/chat/ChatPage.js
// import React, { useState } from 'react';
// import ChatList from '../../component/chat/ChatList';
// import ChatWindow from '../../component/chat/ChatWindow';
// import NewConversation from '../../component/chat/NewConversation';
// import AddParticipant from '../../component/chat/AddParticipant';
// // import '../../styles/chat.css';

// const ChatPage = () => {
//   const [selectedConversation, setSelectedConversation] = useState(null);
//   const [showNewConversation, setShowNewConversation] = useState(false);
//   const [showAddParticipant, setShowAddParticipant] = useState(false);

//   return (
//     <div className="chat-page">
//       <div className="sidebar">
//         <ChatList onSelectConversation={setSelectedConversation} />
//         <button onClick={() => setShowNewConversation(true)}>New Conversation</button>
//         {showNewConversation && (
//           <NewConversation
//             onConversationCreated={(conversation) => {
//               setSelectedConversation(conversation.id);
//               setShowNewConversation(false);
//             }}
//           />
//         )}
//       </div>
//       <div className="main">
//         {selectedConversation ? (
//           <>
//             <ChatWindow conversationId={selectedConversation} />
//             <button onClick={() => setShowAddParticipant(true)}>Add Participant</button>
//             {showAddParticipant && (
//               <AddParticipant
//                 conversationId={selectedConversation}
//                 onClose={() => setShowAddParticipant(false)}
//               />
//             )}
//           </>
//         ) : (
//           <p>Select a conversation to start chatting</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ChatPage;