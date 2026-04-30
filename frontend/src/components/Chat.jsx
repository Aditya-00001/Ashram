import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import io from 'socket.io-client';
import './Chat.css';

export default function Chat() {
  const { user } = useContext(AuthContext);
  
  // --- STATE ---
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // --- NEW: Pagination State ---
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  
  // --- DIRECTORY & GROUP STATE ---
  const [allUsers, setAllUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false); // NEW MODAL STATE
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]); // For multi-select

  // --- REFS ---
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  // --- EMOJI STATE ---
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Place this near your other state variables
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // --- 1. INITIALIZE SOCKET & FETCH INBOX ---
  useEffect(() => {
    if (!user) return;
    socketRef.current = io(import.meta.env.VITE_API_URL);

    const fetchConversations = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/conversations`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) setConversations(await res.json());
    };
    fetchConversations();

    socketRef.current.on('receive_message', (incomingMessage) => {
      setMessages((prevMessages) => [...prevMessages, incomingMessage]);
      setConversations((prevConvos) => 
        prevConvos.map(convo => 
          convo._id === incomingMessage.conversationId ? { ...convo, lastMessage: incomingMessage } : convo
        ).sort((a, b) => {
           const dateA = a._id === incomingMessage.conversationId ? new Date() : new Date(a.updatedAt);
           const dateB = b._id === incomingMessage.conversationId ? new Date() : new Date(b.updatedAt);
           return dateB - dateA;
        })
      );
    });

    return () => socketRef.current.disconnect(); 
  }, [user]);

  // --- 2. FETCH MESSAGES ---
  // --- 2. FETCH MESSAGES ---
  useEffect(() => {
    if (!activeChat || activeChat.isNew) return;

    const fetchMessages = async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/${activeChat._id}?page=${messagePage}&limit=50`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // If it's page 1, replace the messages. If it's page 2+, append them to the TOP!
        setMessages(prev => messagePage === 1 ? data.messages : [...data.messages, ...prev]);
        setHasMoreMessages(data.hasMore);
      }
    };

    fetchMessages();
    socketRef.current.emit('join_chat', activeChat._id);
  }, [activeChat, messagePage, user.token]);
  // --- 3. AUTO-SCROLL TO BOTTOM ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handleChatSelect = (convo) => {
    handleChatSelect(convo);
    setMessages([]); // Clear instantly to prevent UI flickering
    setMessagePage(1); // Reset pagination
    setHasMoreMessages(true);
  };

  const handleCloseChat = () => {
    setActiveChat(null);
    setMessages([]);
    setMessagePage(1);
  };

  // --- EMOJI HANDLER ---
  const onEmojiClick = (emojiObject) => {
    // Appends the emoji to the current message
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  // --- 4. SEND MESSAGE ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    // If it's a group, receiverId is not required by our backend (it uses conversationId implicitly if we update it, but for now we rely on the 1-on-1 logic we built. Wait, if it's a temp 1-on-1, we need receiverId. If it's an existing group, we need to send to the group.)
    // Let's grab the receiver if it's a 1-on-1
    const receiver = activeChat.isGroup ? null : activeChat.participants.find(p => p._id !== user._id);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        // For groups, we might need a dedicated group message route in the future, but our current backend handles creating the convo if missing, or uses receiverId. 
        // *Note: To make this bulletproof for groups without altering backend further, we pass conversationId if it exists!*
        body: JSON.stringify({ 
          receiverId: receiver ? receiver._id : null, 
          conversationId: activeChat.isNew ? null : activeChat._id,
          text: newMessage 
        })
      });

      if (res.ok) {
        const savedMessage = await res.json();
        
        // If this was a new 1-on-1 chat, update the active chat ID so sockets work!
        if (activeChat.isNew) {
          setActiveChat({ ...activeChat, _id: savedMessage.conversationId, isNew: false });
          socketRef.current.emit('join_chat', savedMessage.conversationId);
        }

        socketRef.current.emit('send_message', savedMessage);
        setNewMessage('');
        setShowEmojiPicker(false); // Close picker on send
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // --- 5. DIRECTORY & GROUPS ---
  const fetchDirectory = async () => {
    // --- UPDATED: Uses the safe directory route! ---
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/directory`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
    if (res.ok) {
      setAllUsers(await res.json());
      setShowNewChat(true);
      setIsCreatingGroup(false);
      setSelectedUsers([]);
      setGroupName('');
    }
  };

  const startDirectConversation = (targetUser) => {
    const existing = conversations.find(c => !c.isGroup && c.participants.some(p => p._id === targetUser._id));
    if (existing) {
      setActiveChat(existing);
    } else {
      setActiveChat({ _id: 'temp_' + targetUser._id, participants: [user, targetUser], isNew: true, isGroup: false });
      setMessages([]);
    }
    setShowNewChat(false);
  };

  const handleAddMembersToGroup = async () => {
    if (selectedUsers.length < 1) return alert("Select at least 1 member to add.");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/group/add`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ 
          conversationId: activeChat._id, 
          userIdsToAdd: selectedUsers.map(u => u._id) 
        })
      });

      if (res.ok) {
        const updatedGroup = await res.json();
        
        // Update the active chat and the sidebar list with the new data
        setActiveChat(updatedGroup);
        setConversations(conversations.map(c => c._id === updatedGroup._id ? updatedGroup : c));
        
        setShowAddMemberModal(false);
        setSelectedUsers([]);
      } else {
        const errData = await res.json();
        alert(errData.message);
      }
    } catch (err) {
      console.error("Failed to add members", err);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return alert("Please enter a group name.");
    if (selectedUsers.length < 1) return alert("Select at least 1 other member.");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ groupName, selectedUserIds: selectedUsers.map(u => u._id) })
      });

      if (res.ok) {
        const newGroup = await res.json();
        // The backend didn't populate the participants yet, so we map them manually for the UI
        newGroup.participants = [user, ...selectedUsers]; 
        setConversations([newGroup, ...conversations]);
        setActiveChat(newGroup);
        setShowNewChat(false);
      }
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  const toggleUserSelection = (targetUser) => {
    if (selectedUsers.some(u => u._id === targetUser._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== targetUser._id));
    } else {
      setSelectedUsers([...selectedUsers, targetUser]);
    }
  };

  if (!user) return <div style={{textAlign: 'center', padding: '50px'}}>Please log in to access Community Chat.</div>;

  return (
    <div className={`chat-container ${activeChat ? 'mobile-chat-open' : ''}`}>
      {/* LEFT SIDEBAR: INBOX */}
      {/* --- NEW: LARGE GROUP CREATION MODAL --- */}
      {showGroupModal && (
        <div className="chat-modal-overlay">
          <div className="chat-modal-content">
            <div className="chat-modal-header">
              <h2>Create New Group</h2>
              <button onClick={() => setShowGroupModal(false)} className="close-modal-btn">✕</button>
            </div>
            
            <input 
              type="text" 
              value={groupName} 
              onChange={(e) => setGroupName(e.target.value)} 
              placeholder="Enter Group Name..." 
              className="group-name-input"
            />
            
            <h4 style={{ color: '#888', marginTop: '20px' }}>Select Members</h4>
            <div className="group-members-list">
              {allUsers.map(u => {
                const isSelected = selectedUsers.some(su => su._id === u._id);
                return (
                  <div 
                    key={u._id} 
                    className={`group-member-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleUserSelection(u)}
                  >
                    <div>
                      <strong>{u.name}</strong> <span style={{fontSize: '0.8rem', color: '#888'}}>({u.role})</span>
                    </div>
                    {isSelected && <span className="check-icon">✓</span>}
                  </div>
                );
              })}
            </div>

            <div className="chat-modal-actions">
              <button className="cancel-btn" onClick={() => setShowGroupModal(false)}>Cancel</button>
              <button className="cta-button" onClick={() => {
                handleCreateGroup();
                setShowGroupModal(false);
              }}>Create Group</button>
            </div>
          </div>
        </div>
      )}
      
      {/* --- NEW: ADD MEMBER TO EXISTING GROUP MODAL --- */}
      {showAddMemberModal && (
        <div className="chat-modal-overlay">
          <div className="chat-modal-content">
            <div className="chat-modal-header">
              <h2>Add to {activeChat.groupName}</h2>
              <button onClick={() => { setShowAddMemberModal(false); setSelectedUsers([]); }} className="close-modal-btn">✕</button>
            </div>
            
            <p style={{ color: '#888', marginBottom: '15px' }}>Select members to add to this group.</p>
            
            <div className="group-members-list">
              {allUsers.map(u => {
                // Don't show users who are already in the group!
                if (activeChat.participants.some(p => p._id === u._id)) return null;

                const isSelected = selectedUsers.some(su => su._id === u._id);
                return (
                  <div 
                    key={u._id} 
                    className={`group-member-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleUserSelection(u)}
                  >
                    <div>
                      <strong>{u.name}</strong> <span style={{fontSize: '0.8rem', color: '#888'}}>({u.role})</span>
                    </div>
                    {isSelected && <span className="check-icon">✓</span>}
                  </div>
                );
              })}
            </div>

            <div className="chat-modal-actions">
              <button className="cancel-btn" onClick={() => { setShowAddMemberModal(false); setSelectedUsers([]); }}>Cancel</button>
              <button className="cta-button" onClick={handleAddMembersToGroup}>Add Members</button>
            </div>
          </div>
        </div>
      )}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>Community Chat</h3>
          <button className="new-chat-btn" onClick={fetchDirectory}>+</button>
        </div>

        {showNewChat && (
          <div className="new-chat-dropdown">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
                    {isCreatingGroup ? 'Create Group' : 'New Message'}
                </h4>
                <button 
                onClick={() => { setShowGroupModal(true); setShowNewChat(false); fetchDirectory(); }}
                style={{ background: 'none', border: 'none', color: '#e67e22', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                Create Group
                </button>       
            </div>

            {isCreatingGroup && (
              <input 
                type="text" 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)} 
                placeholder="Enter Group Name..." 
                style={{ width: '100%', padding: '8px', marginBottom: '10px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
              />
            )}

            {allUsers.map(u => {
              const isSelected = selectedUsers.some(su => su._id === u._id);
              return (
                <div 
                  key={u._id} 
                  className="user-list-item" 
                  onClick={() => isCreatingGroup ? toggleUserSelection(u) : startDirectConversation(u)}
                  style={{ backgroundColor: isSelected ? '#e67e2244' : 'transparent', display: 'flex', justifyContent: 'space-between' }}
                >
                  <span><strong>{u.name}</strong> <span style={{fontSize: '0.8rem', color: '#888'}}>({u.role})</span></span>
                  {isCreatingGroup && isSelected && <span style={{ color: '#e67e22' }}>✓</span>}
                </div>
              );
            })}

            {isCreatingGroup && (
              <button className="cta-button" style={{width: '100%', marginTop: '10px'}} onClick={handleCreateGroup}>Create & Start Chat</button>
            )}
            <button className="cancel-btn" style={{width: '100%', marginTop: '10px'}} onClick={() => setShowNewChat(false)}>Cancel</button>
          </div>
        )}

        <div className="conversation-list">
          {conversations.length === 0 && !showNewChat && <p style={{color: '#888', padding: '20px'}}>No conversations yet.</p>}
          
          {conversations.map(convo => {
            // --- UPDATED: Display Group Name or Individual Name! ---
            const chatName = convo.isGroup 
              ? convo.groupName 
              : convo.participants.find(p => p._id !== user._id)?.name || 'Unknown User';
            
            return (
              <div 
                key={convo._id} 
                className={`conversation-item ${activeChat?._id === convo._id ? 'active' : ''}`}
                onClick={() => setActiveChat(convo)}
              >
                <div className="convo-avatar">{chatName.charAt(0)}</div>
                <div className="convo-info">
                  <h4>{chatName} {convo.isGroup && <span style={{fontSize:'0.7rem', color: '#e67e22'}}>(Group)</span>}</h4>
                  <p>{convo.lastMessage ? convo.lastMessage.text : 'No messages yet.'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT MAIN WINDOW: CHAT AREA */}
      <div className="chat-main">
        {activeChat ? (
          <>
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button className="mobile-back-btn" onClick={handleCloseChat}>← Back</button>
                
                <h3 style={{ margin: 0 }}>
                  {activeChat.isGroup 
                    ? activeChat.groupName 
                    : activeChat.participants.find(p => p._id !== user._id)?.name}
                </h3>

                {/* --- NEW: Add Member Button (Only visible to Group Admins or Super Admins) --- */}
                {activeChat.isGroup && (activeChat.groupAdmin === user._id || user.role === 'superadmin') && (
                  <button 
                    onClick={() => {
                      fetchDirectory(); // Fetches all users
                      setShowAddMemberModal(true);
                    }}
                    style={{ background: '#e67e2222', border: '1px solid #e67e22', color: '#e67e22', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    + Add
                  </button>
                )}
              </div>
              
              <button className="close-chat-btn" onClick={handleCloseChat}>✕</button>
            </div>
            
            <div className="chat-messages">
              {/* --- NEW: LOAD MORE MESSAGES --- */}
              {hasMoreMessages && !activeChat.isNew && (
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <button 
                    onClick={() => setMessagePage(prev => prev + 1)}
                    className="load-more-btn"
                  >
                    Load Older Messages
                  </button>
                </div>
              )}

              {messages.map((msg, index) => {
                const isMine = msg.sender === user._id || (msg.sender && msg.sender._id === user._id);
                // We populated the sender in the backend, so we can pull the name directly!
                const senderName = msg.sender?.name || 'Member';
                
                return (
                  <div key={msg._id || index} className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                    {activeChat.isGroup && !isMine && (
                      <strong style={{ display: 'block', fontSize: '0.8rem', color: '#e67e22', marginBottom: '3px' }}>
                        {senderName}
                      </strong>
                    )}
                    <p>{msg.text}</p>
                    <span className="timestamp">
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              
              {/* Container for the input and emoji button */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, gap: '10px' }}>
                
                {/* --- NEW: THE EMOJI PICKER POPUP --- */}
                {showEmojiPicker && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 50, marginBottom: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }}>
                    <EmojiPicker 
                      onEmojiClick={onEmojiClick} 
                      theme="dark" // Matches our Ashram dark UI perfectly
                      searchDisabled={false}
                      skinTonesDisabled={true} // Keeps the UI cleaner
                      height={350} 
                      width={300}
                    />
                  </div>
                )}

                {/* --- NEW: EMOJI TOGGLE BUTTON --- */}
                <button 
                  type="button" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0 5px', color: '#888', transition: 'color 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#e67e22'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#888'}
                  title="Add Emoji"
                >
                  😀
                </button>

                <textarea 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                      e.preventDefault(); 
                      handleSendMessage(e);
                    }
                    if (e.key === 'Enter' && e.ctrlKey) {
                      setNewMessage(prev => prev + '\n');
                    }
                  }}
                  placeholder="Type a message... (Enter to send, Ctrl+Enter for new line)" 
                  required
                  rows="1"
                />
              </div>

              <button type="submit" className="send-btn">Send</button>
            </form>
          </>
        ) : (
          <div className="chat-empty-state">
            <h2>🙏 Hari Om</h2>
            <p>Select a conversation or start a new chat with a community member.</p>
          </div>
        )}
      </div>
    </div>
  );
}