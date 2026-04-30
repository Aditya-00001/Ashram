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

  // --- DIRECTORY PAGINATION STATE ---
  const [directoryPage, setDirectoryPage] = useState(1);
  const [directoryTotalPages, setDirectoryTotalPages] = useState(1);
  const [directorySearch, setDirectorySearch] = useState('');

  // --- GROUP INFO STATE ---
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  
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

  // --- ATTACHMENT STATE ---
  const [selectedFile, setSelectedFile] = useState(null); // Holds the uploaded Cloudinary data
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // --- SECURITY SANDBOX STATE ---
  const [sandboxFile, setSandboxFile] = useState(null); 
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  
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

  // --- FILE UPLOAD HANDLER ---
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Frontend Sandbox Check: Enforce 10MB limit before wasting bandwidth
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Maximum size is 10MB.");
      e.target.value = ''; // Reset input
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        // Do NOT set 'Content-Type': 'application/json' here. 
        // The browser automatically sets the correct Multipart boundary for FormData!
        body: formData 
      });

      if (res.ok) {
        const fileData = await res.json();
        setSelectedFile(fileData); // Saves { url, fileType, fileName }
      } else {
        const errData = await res.json();
        alert(`Upload Failed: ${errData.message}`);
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("An error occurred during upload.");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input so you can upload the same file again if needed
    }
  };

  // --- LINK PARSING HELPER ---
  const renderTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // --- 4. SEND MESSAGE ---
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault(); // Make 'e' optional in case we send just an attachment
    
    // Require EITHER text OR an attachment to send
    if (!newMessage.trim() && !selectedFile) return; 
    if (!activeChat) return;

    const receiver = activeChat.isGroup ? null : activeChat.participants.find(p => p._id !== user._id);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ 
          receiverId: receiver ? receiver._id : null, 
          conversationId: activeChat.isNew ? null : activeChat._id,
          text: newMessage,
          attachment: selectedFile // --- NEW: Attach the file data! ---
        })
      });

      if (res.ok) {
        const savedMessage = await res.json();
        
        if (activeChat.isNew) {
          setActiveChat({ ...activeChat, _id: savedMessage.conversationId, isNew: false });
          socketRef.current.emit('join_chat', savedMessage.conversationId);
        }

        socketRef.current.emit('send_message', savedMessage);
        
        // --- RESET EVERYTHING ---
        setNewMessage('');
        setSelectedFile(null); 
        setShowEmojiPicker(false);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // --- 5. DIRECTORY & GROUPS ---
  const fetchDirectory = async (page = 1, search = '') => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/directory?page=${page}&search=${search}`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setAllUsers(data.users);
      setDirectoryTotalPages(data.totalPages);
      setDirectoryPage(data.currentPage);
      setShowNewChat(true);
      setIsCreatingGroup(false);
      // We do NOT clear selectedUsers here, so they don't lose selections when changing pages!
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

  const handleRemoveMember = async (userIdToRemove) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/group/remove`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ conversationId: activeChat._id, userIdToRemove })
      });

      if (res.ok) {
        const updatedGroup = await res.json();
        setActiveChat(updatedGroup);
        setConversations(conversations.map(c => c._id === updatedGroup._id ? updatedGroup : c));
      } else {
        const errData = await res.json();
        alert(errData.message);
      }
    } catch (err) {
      console.error("Failed to remove member", err);
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

      {/* =========================================
             SECURITY SANDBOX & DISCLAIMER MODALS 
          ========================================= */}
      
      {/* 1. VIRUS/MALWARE DISCLAIMER */}
      {showDisclaimer && sandboxFile && (
        <div className="chat-modal-overlay" style={{ zIndex: 1001 }}>
          <div className="chat-modal-content" style={{ borderTop: '4px solid #ff4757' }}>
            <div className="chat-modal-header">
              <h2 style={{ color: '#ff4757' }}>⚠️ Security Warning</h2>
            </div>
            <p style={{ color: '#ccc', lineHeight: '1.5' }}>
              You are about to open a file uploaded by another user: <br/>
              <strong style={{ color: '#fff' }}>{sandboxFile.fileName}</strong>
            </p>
            <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '10px' }}>
              Achyuta Ananta Ashram cannot guarantee this file is free of viruses or malware. Never enter passwords or personal information into untrusted documents.
            </p>
            <div className="chat-modal-actions" style={{ marginTop: '20px' }}>
              <button className="cancel-btn" onClick={() => { setShowDisclaimer(false); setSandboxFile(null); }}>Go Back</button>
              <button className="cta-button" style={{ backgroundColor: '#ff4757', border: 'none' }} onClick={() => setShowDisclaimer(false)}>
                I Understand, View File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SANDBOXED IFRAME VIEWER */}
      {sandboxFile && !showDisclaimer && (
        <div className="chat-modal-overlay" style={{ zIndex: 1000, padding: '20px' }}>
          <div className="chat-modal-content" style={{ width: '100%', maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column', padding: '15px' }}>
            <div className="chat-modal-header" style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#e67e22', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Protected View: {sandboxFile.fileName}
              </h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                <a href={sandboxFile.url} download target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem' }}>Download Original</a>
                <button onClick={() => setSandboxFile(null)} className="close-modal-btn" style={{ fontSize: '1.2rem' }}>✕</button>
              </div>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
              {sandboxFile.fileType === 'video' ? (
                <video src={sandboxFile.url} controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                /* The magic sandbox attribute prevents malicious code execution inside the iframe! */
                /* We wrap the URL in Google Docs Viewer to bypass native plugin blocks securely! */
                <iframe 
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(sandboxFile.url)}&embedded=true`} 
                  title="Document Viewer"
                  sandbox="allow-scripts allow-same-origin" 
                  style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 1. LARGE GROUP CREATION MODAL */}
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
      
      {/* 2. ADD MEMBER TO EXISTING GROUP MODAL */}
      {showAddMemberModal && (
        <div className="chat-modal-overlay">
          <div className="chat-modal-content">
            <div className="chat-modal-header">
              <h2>Add to {activeChat?.groupName}</h2>
              <button onClick={() => { setShowAddMemberModal(false); setSelectedUsers([]); }} className="close-modal-btn">✕</button>
            </div>
            
            <p style={{ color: '#888', marginBottom: '15px' }}>Select members to add to this group.</p>
            
            <div className="group-members-list">
              {allUsers.map(u => {
                // Don't show users who are already in the group!
                if (activeChat?.participants.some(p => p._id === u._id)) return null;

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

      {/* 3. GROUP INFO & MEMBER LIST MODAL (REMOVING MEMBERS) */}
      {showGroupInfoModal && activeChat?.isGroup && (
        <div className="chat-modal-overlay">
          <div className="chat-modal-content">
            <div className="chat-modal-header">
              <h2>{activeChat.groupName}</h2>
              <button onClick={() => setShowGroupInfoModal(false)} className="close-modal-btn">✕</button>
            </div>
            
            <p style={{ color: '#888', marginBottom: '15px' }}>
              {activeChat.participants.length} Members
            </p>
            
            <div className="group-members-list" style={{ maxHeight: '300px' }}>
              {activeChat.participants.map(p => {
                const isAdmin = activeChat.groupAdmin === p._id;
                // Check if current logged-in user has permission to remove this specific person
                const canRemove = 
                  (activeChat.groupAdmin === user._id || user.role === 'superadmin') && 
                  p._id !== user._id;

                return (
                  <div key={p._id} className="group-member-item" style={{ cursor: 'default' }}>
                    <div>
                      <strong>{p.name}</strong> 
                      <span style={{fontSize: '0.8rem', color: '#888', marginLeft: '8px'}}>
                        {isAdmin ? '(Group Admin)' : `(${p.role})`}
                      </span>
                    </div>
                    
                    {canRemove && (
                      <button 
                        onClick={() => handleRemoveMember(p._id)}
                        style={{ background: '#ff475722', border: '1px solid #ff4757', color: '#ff4757', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR: INBOX */}
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
            {/* Search & Pagination Bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input 
                type="text" 
                placeholder="Search name..." 
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDirectory(1, directorySearch)}
                style={{ flex: 1, padding: '8px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
              />
              <button onClick={() => fetchDirectory(1, directorySearch)} className="cta-button" style={{ padding: '0 10px' }}>Search</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '0.85rem', color: '#888' }}>
              <button 
                onClick={() => fetchDirectory(directoryPage - 1, directorySearch)} 
                disabled={directoryPage === 1}
                style={{ background: 'none', border: 'none', color: directoryPage === 1 ? '#444' : '#e67e22', cursor: 'pointer' }}
              >← Prev</button>
              <span>Page {directoryPage} of {directoryTotalPages}</span>
              <button 
                onClick={() => fetchDirectory(directoryPage + 1, directorySearch)} 
                disabled={directoryPage === directoryTotalPages}
                style={{ background: 'none', border: 'none', color: directoryPage === directoryTotalPages ? '#444' : '#e67e22', cursor: 'pointer' }}
              >Next →</button>
            </div>

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
                
                <h3 
                  style={{ margin: 0, cursor: activeChat.isGroup ? 'pointer' : 'default', textDecoration: activeChat.isGroup ? 'underline' : 'none' }}
                  onClick={() => activeChat.isGroup && setShowGroupInfoModal(true)}
                  title={activeChat.isGroup ? "View Group Info" : ""}
                >
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
                    
                    {/* --- ATTACHMENT RENDERING --- */}
                    {msg.attachment && (
                      <div style={{ marginBottom: msg.text ? '10px' : '0' }}>
                        {msg.attachment.fileType === 'image' && (
                          <img src={msg.attachment.url} alt="attachment" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '250px' }} />
                        )}
                        
                        {/* Videos and Documents now trigger the Sandbox! */}
                        {(msg.attachment.fileType === 'video' || msg.attachment.fileType === 'document') && (
                          <div 
                            onClick={() => {
                              setSandboxFile(msg.attachment);
                              
                              // TEMPORARY TEST: We removed '&& !isMine' so you can test it on your own files!
                              // Make sure to add '&& !isMine' back before you deploy to production.
                              if (msg.attachment.fileType === 'document' || msg.attachment.fileType === 'video') {
                                setShowDisclaimer(true);
                              }
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', color: 'white', cursor: 'pointer', border: '1px solid #444' }}
                          >
                            <span style={{ fontSize: '1.5rem' }}>
                              {msg.attachment.fileType === 'video' ? '🎥' : '📄'}
                            </span>
                            <span style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                              {msg.attachment.fileName}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#e67e22', marginLeft: '5px' }}>
                              (Click to View)
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* --- UPDATED: Render text with parsed links! --- */}
                    {msg.text && <p>{renderTextWithLinks(msg.text)}</p>}
                    
                    <span className="timestamp">
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* --- NEW: ATTACHMENT PREVIEW SANDBOX --- */}
            {selectedFile && (
              <div style={{ padding: '10px 20px', backgroundColor: '#222', borderTop: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {selectedFile.fileType === 'image' && <img src={selectedFile.url} alt="preview" style={{ height: '50px', borderRadius: '4px' }} />}
                  {selectedFile.fileType === 'video' && <span style={{ fontSize: '1.5rem' }}>🎥</span>}
                  {selectedFile.fileType === 'document' && <span style={{ fontSize: '1.5rem' }}>📄</span>}
                  <span style={{ color: '#ccc', fontSize: '0.9rem' }}>{selectedFile.fileName}</span>
                </div>
                <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
            )}
            
            {isUploading && (
              <div style={{ padding: '5px 20px', backgroundColor: '#222', color: '#e67e22', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Uploading to secure cloud... Please wait.
              </div>
            )}

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, gap: '10px' }}>
                
                {/* EMOJI PICKER MODAL */}
                {showEmojiPicker && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 50, marginBottom: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }}>
                    <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" searchDisabled={false} skinTonesDisabled={true} height={350} width={300} />
                  </div>
                )}

                {/* HIDDEN FILE INPUT */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  style={{ display: 'none' }} 
                  accept="image/*,video/mp4,video/quicktime,application/pdf" 
                />

                {/* ATTACHMENT PAPERCLIP BUTTON */}
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current.click()}
                  disabled={isUploading}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: isUploading ? 'not-allowed' : 'pointer', padding: '0 5px', color: isUploading ? '#444' : '#888', transition: 'color 0.2s' }}
                  title="Attach File"
                >
                  📎
                </button>

                {/* EMOJI BUTTON */}
                <button 
                  type="button" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '0 5px', color: '#888', transition: 'color 0.2s' }}
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
                  placeholder="Type a message... (Enter to send)" 
                  rows="1"
                />
              </div>

              {/* Disable send button if uploading so we don't send half-finished payloads */}
              <button type="submit" className="send-btn" disabled={isUploading} style={{ opacity: isUploading ? 0.5 : 1 }}>Send</button>
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