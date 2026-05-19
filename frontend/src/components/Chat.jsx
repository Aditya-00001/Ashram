import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { 
  importPrivateKey, 
  importPublicKey, 
  deriveSharedSecret, 
  encryptMessage,
  decryptMessage,
  generateGroupMessageKey,
  encryptKeyForRecipient,
  decryptKeyBuffer,
  unwrapPrivateKey,
  wrapPrivateKey, 
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey
} from '../utils/cryptoUtils';
import EmojiPicker from 'emoji-picker-react';
import io from 'socket.io-client';
import '../styles/Chat.css';
import CameraCapture from './CameraCapture';
import CreatePollModal from './CreatePollModal';
import ChatVaultModal from './ChatVaultModal';
import SpiritualLoader from './SpiritualLoader';
// ==========================================
// 🔓 E2EE DECRYPTION COMPONENT 
// ==========================================
const MessageBubble = ({ msg, activeChat, user, renderTextWithLinks, setSandboxFile, setShowDisclaimer, handleVote }) => {
  const [displayText, setDisplayText] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const decrypt = async () => {
      if (msg.iv?.length > 0 && msg.text?.startsWith('[')) {
        if (isMounted) setIsDecrypting(true);
        try {
          let sharedKey;
          const myPrivKeyRaw = JSON.parse(localStorage.getItem(`e2ee_priv_${user._id}`));
          const myPrivKey = await importPrivateKey(myPrivKeyRaw);

          if (activeChat.isGroup) {
            // === GROUP DECRYPTION ===
            // 1. Convert to standard object if it's a Map and use String for the ID
            const envelopesObj = msg.envelopes instanceof Map ? Object.fromEntries(msg.envelopes) : msg.envelopes;
            const myId = user._id.toString();

            if (!envelopesObj || !envelopesObj[myId]) {
              console.warn("My ID not found in envelopes:", myId, envelopesObj);
              setDisplayText("🔒 [Envelope Missing]");
              return;
            }
            
            const myEnvelope = envelopesObj[myId];
            
            // 2. Derive the secret used to "lock" this specific envelope
            // =====================================================================
            // ✅ FIXED: STRING-SAFE GROUP SENDER LOOKUP INJECTED HERE
            // =====================================================================
            const senderId = typeof msg.sender === 'object' ? String(msg.sender._id) : String(msg.sender);
            const groupSender = activeChat.participants.find(p => String(p._id) === senderId);
            const targetGroupPubKeyJWK = groupSender?.publicKey || msg.sender?.publicKey;

            if (!targetGroupPubKeyJWK) {
              console.warn("Public key unavailable for group sender identity:", senderId);
              setDisplayText("🔒 [Sender Key Unavailable]");
              return;
            }

            const senderPubKey = await importPublicKey(targetGroupPubKeyJWK);
            const derivationSecret = await deriveSharedSecret(myPrivKey, senderPubKey);
            // =====================================================================
            
            // 3. Unlock the envelope to get the raw Message Key
            const rawMessageKey = await decryptKeyBuffer(
              myEnvelope.encryptedKey, 
              myEnvelope.iv, 
              derivationSecret
            );
            // 4. Import that raw key back as a CryptoKey object for AES-GCM
            sharedKey = await window.crypto.subtle.importKey(
              "raw", 
              rawMessageKey, 
              "AES-GCM", 
              true, 
              ["decrypt"]
            );
          } else {
              // === 1-on-1 DECRYPTION ===
              // Identify the other participant safely using string casting
              const receiver = activeChat.participants.find(p => String(p._id) !== String(user._id));
              
              // Determine who sent this message to get the correct public key
              const senderId = typeof msg.sender === 'object' ? String(msg.sender._id) : String(msg.sender);
              const isMsgFromMe = senderId === String(user._id);
              
              // Choose the appropriate public key to derive the shared secret
              let targetPublicKeyJWK;
              if (isMsgFromMe) {
                // If I sent it, use the receiver's public key to decrypt my copy
                targetPublicKeyJWK = receiver?.publicKey;
              } else {
                // If they sent it, use the sender's public key from the participant list
                const actualSender = activeChat.participants.find(p => String(p._id) === senderId);
                targetPublicKeyJWK = actualSender?.publicKey || msg.sender?.publicKey;
              }

              if (!targetPublicKeyJWK) {
                console.warn("Public key missing for decryption target identity:", senderId);
                if (isMounted) setDisplayText("🔒 [Public Key Unavailable]");
                return;
              }

              const theirPubKey = await importPublicKey(targetPublicKeyJWK);
              sharedKey = await deriveSharedSecret(myPrivKey, theirPubKey);
            }

          const ciphertextArray = JSON.parse(msg.text);
          const plainText = await decryptMessage(ciphertextArray, msg.iv, sharedKey);
          if (isMounted) setDisplayText(plainText);
        } catch (err) {
          console.error("Decryption failed", err);
          if (isMounted) setDisplayText("🔒 [Decryption Error]");
        } finally {
          if (isMounted) setIsDecrypting(false);
        }
      }
    };

    decrypt();
    return () => { isMounted = false; };
  }, [msg, activeChat, user._id]);

  const isMine = msg.sender === user._id || (msg.sender && msg.sender._id === user._id);
  const senderName = msg.sender?.name || 'Member';

  return (
    <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
      {activeChat.isGroup && !isMine && (
        <strong style={{ display: 'block', fontSize: '0.8rem', color: '#e67e22', marginBottom: '3px' }}>
          {senderName}
        </strong>
      )}
      
      {/* --- ATTACHMENT RENDERING --- */}
      {msg.attachment && (
        <div style={{ marginBottom: displayText ? '10px' : '0' }}>
          {msg.attachment.fileType === 'image' && (
            <img 
              src={msg.attachment.url} 
              alt="attachment" 
              onClick={() => {
                setSandboxFile(msg.attachment);
                // No need to set showDisclaimer for images!
              }}
              style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '250px', cursor: 'pointer' }} 
            />
          )}
          
          {(msg.attachment.fileType === 'video' || msg.attachment.fileType === 'document') && (
            <div 
              onClick={() => {
                setSandboxFile(msg.attachment);
                if (msg.attachment.fileType === 'document' || msg.attachment.fileType === 'video') {
                  setShowDisclaimer(true);
                }
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', color: 'white', cursor: 'pointer', border: '1px solid #444' }}
            >
              <span style={{ fontSize: '1.5rem' }}>{msg.attachment.fileType === 'video' ? '🎥' : '📄'}</span>
              <span style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>{msg.attachment.fileName}</span>
              <span style={{ fontSize: '0.7rem', color: '#e67e22', marginLeft: '5px' }}>(Click to View)</span>
            </div>
          )}
        </div>
      )}

      {/* --- TEXT OR POLL RENDERING --- */}
      {msg.messageType === 'poll' && msg.pollData ? (
        <div style={{ minWidth: '250px', marginTop: '5px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>📊 {msg.pollData.question}</h4>
          
          {msg.pollData.options.map((opt) => {
            // Calculate votes and percentages
            const totalVotes = msg.pollData.options.reduce((sum, o) => sum + o.voters.length, 0);
            const percent = totalVotes === 0 ? 0 : Math.round((opt.voters.length / totalVotes) * 100);
            const hasVoted = opt.voters.includes(user._id);

            return (
              <div 
                key={opt._id}
                onClick={() => handleVote(msg._id, opt._id)} // <--- INSTANT VOTE TRIGGER
                style={{
                  position: 'relative',
                  padding: '10px 15px',
                  marginBottom: '8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: hasVoted ? '1px solid #e67e22' : '1px solid #444',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'space-between',
                  backgroundColor: '#222'
                }}
              >
                {/* The animated background progress bar! */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, height: '100%', 
                  width: `${percent}%`, 
                  backgroundColor: hasVoted ? 'rgba(230, 126, 34, 0.3)' : 'rgba(255,255,255,0.1)',
                  transition: 'width 0.4s ease-out',
                  zIndex: 1
                }} />
                
                <span style={{ position: 'relative', zIndex: 2, fontWeight: hasVoted ? 'bold' : 'normal', color: hasVoted ? '#e67e22' : '#fff' }}>
                  {opt.optionText}
                </span>
                <span style={{ position: 'relative', zIndex: 2, color: '#888', fontSize: '0.9rem' }}>
                  {totalVotes > 0 ? `${percent}%` : ''}
                </span>
              </div>
            );
          })}
          <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'right', marginTop: '5px' }}>
            {msg.pollData.options.reduce((sum, o) => sum + o.voters.length, 0)} votes
          </div>
        </div>
      ) : isDecrypting ? (
         <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>🔒 Decrypting...</p>
      ) : (
         displayText && <p>{renderTextWithLinks(displayText)}</p>
      )}
      
      <span className="timestamp">
        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        
        {/* --- NEW: READ RECEIPT TICKS --- */}
        {isMine && (
          <span style={{ marginLeft: '5px', fontSize: '0.8rem', color: msg.isRead ? '#FFD700' : '#FFFFFF' }}>
            {msg.isRead ? '✓✓' : '✓'}
          </span>
        )}
      </span>
    </div>
  );
};

export default function Chat() {
  const { user } = useContext(AuthContext);
  
  // --- STATE ---
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

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
  const candidateQueue = useRef([]);
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

  const [showCamera, setShowCamera] = useState(false);

  const [showPollModal, setShowPollModal] = useState(false);

  const [showVault, setShowVault] = useState(false);

  const [loadingMessages, setLoadingMessages] = useState(false);

  // const [loadingConversations, setLoadingConversations] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null); // { name, convoId }
  const typingTimeoutRef = useRef(null);

  // --- WebRTC State ---
  const [calling, setCalling] = useState(false);
  const [receivingCall, setReceivingCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callType, setCallType] = useState(null); // 'audio' or 'video'
  const [callerInfo, setCallerInfo] = useState(null);

  // <--- 2. ADD THESE LINES HERE --->
  const { addToast } = useContext(ToastContext);
  
  // We use a ref here because Socket.io listeners need the absolute latest busy status without stale closures
  const isInCallRef = useRef(false);
  useEffect(() => {
    isInCallRef.current = calling || receivingCall || callAccepted;
  }, [calling, receivingCall, callAccepted]);

  const myVideoRef = useRef();
  const peerVideoRef = useRef();
  const connectionRef = useRef();
  const localStreamRef = useRef();

  // --- Chat PIN Vault States ---
  const [vaultStatus, setVaultStatus] = useState('checking'); // 'checking' | 'setup_required' | 'locked' | 'unlocked'
  const [chatPin, setChatPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [escrowParams, setEscrowParams] = useState(null);
  const [vaultError, setVaultError] = useState('');

  // <--- 3. ADD THIS HARDWARE CHECKER --->
  const verifyMediaHardware = async (type) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        addToast("Your browser does not support video calling.", "error");
        return false;
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      const hasMic = devices.some(device => device.kind === 'audioinput');

      if (type === 'video' && !hasCamera) {
        addToast("No camera detected. Please plug in a webcam.", "error");
        return false;
      }
      if (!hasMic) {
        addToast("No microphone detected. They won't be able to hear you!", "info");
      }
      
      return true; // Hardware looks good!
    } catch (err) {
      console.error("Hardware verification failed:", err);
      addToast("Unable to verify camera/microphone permissions.", "error");
      return false;
    }
  };
  // <------------------------------------>

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

    socketRef.current.emit('user_online', user._id);

    socketRef.current.on('online_users_list', (list) => setOnlineUsers(list));
    
    socketRef.current.on('user_typing', (data) => {
      if (activeChatRef.current && activeChatRef.current._id === data.conversationId) {
        setTypingUser(data.userName);
      }
    });

    socketRef.current.on('user_stopped_typing', () => setTypingUser(null));

    socketRef.current.on('receive_message', async (incomingMessage) => {
      
      // 1. Only append to the open chat window if it matches!
      if (activeChatRef.current && activeChatRef.current._id === incomingMessage.conversationId) {
        setMessages((prevMessages) => [...prevMessages, incomingMessage]);
        
        // =======================================================
        // --- FIXED: AUTO-READ RECEIPT (DATABASE + SOCKET) ---
        // =======================================================
        try {
          // 1. Tell the database this specific chat is now read
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/read/${incomingMessage.conversationId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${user.token}` }
          });
          
          if (res.ok) {
            // 2. ONLY emit the socket event after the DB is updated!
            // This ensures the sender's React state has had time to render the new message first.
            socketRef.current.emit('mark_as_read', { 
              conversationId: incomingMessage.conversationId, 
              readerId: user._id 
            });
          }
        } catch (err) {
          console.error("Auto-read background update failed", err);
        }
      }

      // 2. Always update the sidebar inbox to show the latest message and bump it to the top
      setConversations((prevConvos) => {
        let isExisting = false;
        const updatedConvos = prevConvos.map(convo => {
          if (convo._id === incomingMessage.conversationId) {
            isExisting = true;
            return { ...convo, lastMessage: incomingMessage, updatedAt: new Date().toISOString() };
          }
          return convo;
        });

        return updatedConvos.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      });
    });

    // --- NEW: LISTEN FOR UPDATED MESSAGES (LIKE POLL VOTES) ---
    socketRef.current.on('update_message', (updatedMessage) => {
      setMessages((prevMessages) => 
        prevMessages.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg)
      );
    });

    socketRef.current.on('messages_read', (data) => {
      // Only update messages if the user currently has that specific chat open
      if (activeChatRef.current && activeChatRef.current._id === data.conversationId) {
        setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
      }
    });

    // --- 📞 WebRTC INCOMING LISTENERS ---
    socketRef.current.on('incoming_call', (data) => {
      if (isInCallRef.current) {
        // 🚨 EDGE CASE: User is already busy! Tell the server to bounce the call.
        socketRef.current.emit('call_rejected', { 
          to: data.from, 
          reason: "busy" 
        });
        return;
      }
      setReceivingCall(true);
      setCallerInfo(data);
      setCallType(data.callType);
    });

    socketRef.current.on('call_rejected', (data) => {
      if (data.reason === "busy") {
        addToast("The user is currently on another call.", "info");
      } else {
        addToast("The user declined your call.", "error");
      }
      endCallLocally();
    });

    socketRef.current.on('ice_candidate', (candidate) => {
      // Use the ref from the top level
      if (connectionRef.current && connectionRef.current.remoteDescription) {
        connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(e => console.error("Error adding received ice candidate", e));
      } else {
        candidateQueue.current.push(candidate);
      }
    });

    socketRef.current.on('call_accepted', (signal) => {
      setCallAccepted(true);
      if (connectionRef.current) {
        connectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      }
    });

    socketRef.current.on('call_ended', () => {
      endCallLocally();
    });

    return () => socketRef.current.disconnect(); 
  }, [user, addToast]);

  useEffect(() => {
  if (user) {
    subscribeUserToPush();
  }
}, [])

  const subscribeUserToPush = async () => {
    try {
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      // Safety Guard: Don't proceed if the key isn't loaded
      if (!vapidKey) {
        console.warn('🔔 Push notifications disabled: VITE_VAPID_PUBLIC_KEY is missing.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) // Use the local variable
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/subscribe`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}` 
        },
        body: JSON.stringify(subscription)
      });

      if (res.ok) {
        console.log('🔔 Push Subscription Successful');
      } else {
        console.error('❌ Server failed to save subscription');
}
    } catch (err) {
      console.error('Failed to subscribe user', err);
    }
  };

  // Helper function to convert the VAPID key
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const startCall = async (type) => {
    const isHardwareReady = await verifyMediaHardware(type);
    if (!isHardwareReady) return;

    setCallType(type);
    setCalling(true);

    try {
      // 1. Get Media (Camera/Mic)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: type === 'video', 
        audio: true 
      });
      localStreamRef.current = stream;
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;

      // 2. Create Peer Connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Free Google STUN server
      });

      // 3. Add tracks to connection
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // 4. Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice_candidate', {
            to: activeChat.participants.find(p => p._id !== user._id)._id,
            candidate: event.candidate
          });
        }
      };

      // 5. Handle Incoming Stream
      pc.ontrack = (event) => {
        peerVideoRef.current.srcObject = event.streams[0];
      };

      // 6. Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit('call_user', {
        userToCall: activeChat.participants.find(p => p._id !== user._id)._id,
        signalData: offer,
        from: user._id,
        name: user.name,
        callType: type
      });

      connectionRef.current = pc;
    } catch (err) {
      console.error("Failed to start call", err);
      setCalling(false);
      // <--- ADD PERMISSION GUARD --->
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        addToast("Microphone and Camera access was blocked by your browser.", "error");
      } else if (err.name === 'NotFoundError') {
        addToast("Requested camera/mic could not be found.", "error");
      } else {
        addToast("Failed to access media devices.", "error");
      }
    }
  };

  const acceptCall = async () => {
    setCallAccepted(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: callType === 'video', 
        audio: true 
      });
      localStreamRef.current = stream;
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice_candidate', { to: callerInfo.from, candidate: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (peerVideoRef.current) peerVideoRef.current.srcObject = event.streams[0];
      };

      await pc.setRemoteDescription(new RTCSessionDescription(callerInfo.signal));

      // PROCESS QUEUED CANDIDATES
      candidateQueue.current.forEach(candidate => {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      });
      candidateQueue.current = []; // Clear the queue
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit('answer_call', { to: callerInfo.from, signal: answer });
      connectionRef.current = pc;
    } catch (err) {
      console.error("Failed to accept call", err);
    }
  };

  const rejectCall = () => {
    socketRef.current.emit('call_rejected', { to: callerInfo.from, reason: 'declined' });
    setReceivingCall(false);
    setCallerInfo(null);
  };

  const endCallLocally = (targetId = null) => {
    // 1. If we are the one initiating the "hang up", notify the other user
    if (targetId && socketRef.current) {
      socketRef.current.emit('end_call', { to: targetId });
    }

    // 2. Close the PeerConnection
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }

    // 3. Stop all Camera/Mic tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // 4. Reset UI State
    setCalling(false);
    setReceivingCall(false);
    setCallAccepted(false);
    setCallerInfo(null);
    setCallType(null);
  };

  // Function to handle the typing event
  const handleTyping = () => {
    if (!activeChat) return;

    socketRef.current.emit('typing_start', { 
      conversationId: activeChat._id, 
      userName: user.name 
    });

    // Clear existing timeout and set a new one to stop typing indicator after 2 seconds
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing_stop', { conversationId: activeChat._id });
    }, 2000);
  };

  const handleMarkAsRead = useCallback(async (convoId) => {
  if (!convoId) return;
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/read/${convoId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
    
    if (res.ok) {
      socketRef.current.emit('mark_as_read', { conversationId: convoId, readerId: user._id });
      
      setConversations(prev => prev.map(c => 
        c._id === convoId ? { ...c, lastMessage: { ...c.lastMessage, isRead: true } } : c
      ));
    }
  } catch (err) {
    console.error("Read receipt error", err);
  }
}, [user.token, user._id]);

  // --- 2. FETCH MESSAGES ---
  useEffect(() => {
    if (!activeChat || activeChat.isNew) return;

    const fetchMessages = async () => {
      // Only show the big loader for the initial load (page 1)
      if (messagePage === 1) setLoadingMessages(true); 

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/${activeChat._id}?page=${messagePage}&limit=50`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => messagePage === 1 ? data.messages : [...data.messages, ...prev]);
        setHasMoreMessages(data.hasMore);
      }
      setLoadingMessages(false); // Turn off loader
    };

    fetchMessages();
    socketRef.current.emit('join_chat', activeChat._id);
    // --- TRIGGER READ RECEIPT ---
    handleMarkAsRead(activeChat._id);
  }, [activeChat, messagePage, user.token,handleMarkAsRead]);
  // --- 3. AUTO-SCROLL TO BOTTOM ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  useEffect(() => {
    const checkVaultStatus = async () => {
      try {
        // 1. Always check the backend first to see if a secure backup exists
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/escrow`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const localKey = localStorage.getItem(`e2ee_priv_${user._id}`);
          
          // CASE A: Cryptographic Escrow exists in the database
          if (data.escrowedPrivateKey && data.escrowedPrivateKey.length > 0) {
            setEscrowParams(data);
            if (localKey) {
              setVaultStatus('unlocked');
            } else {
              setVaultStatus('locked'); // Needs PIN to unlock on this device
            }
          } 
          // CASE B: Escrow fields are completely missing from the database (Phase 6 legacy user)
          else {
            if (localKey) {
              // User has keys locally but hasn't backed them up yet. Prompt for PIN to sync!
              setVaultStatus('backup_required');
            } else {
              // Fresh new user with no history at all
              setVaultStatus('setup_required');
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch vault configuration", err);
      }
    };
    if (user) checkVaultStatus();
  }, [user]);

  // === FIX: PRESERVE EXISTING CRYPTO KEYS DURING INITIAL ESCROW SYNC ===
  const handleInitializeVault = async (e) => {
    e.preventDefault();
    if (chatPin.length < 4) return setVaultError("PIN/Passphrase must be at least 4 characters.");
    if (chatPin !== confirmPin) return setVaultError("PIN entries do not match.");

    try {
      let privJWK;
      let pubJWK = null;

      if (vaultStatus === 'backup_required') {
        // ✅ CRITICAL FIX: Pull your existing key so we don't break your chat history!
        privJWK = JSON.parse(localStorage.getItem(`e2ee_priv_${user._id}`));
        console.log("Migrating existing chat history key container into vault backup...");
      } else {
        // True fresh user: safe to generate clean keys
        const keyPair = await generateKeyPair();
        pubJWK = await exportPublicKey(keyPair.publicKey);
        privJWK = await exportPrivateKey(keyPair.privateKey);
      }

      // Wrap the target private key with the user's custom PIN entry
      const escrowPayload = await wrapPrivateKey(privJWK, chatPin);
      
      if (pubJWK) {
        escrowPayload.publicKey = pubJWK;
      }

      // Save encrypted container attributes straight to MongoDB
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/escrow`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify(escrowPayload)
      });

      if (res.ok) {
        localStorage.setItem(`e2ee_priv_${user._id}`, JSON.stringify(privJWK));
        setVaultStatus('unlocked');
        setChatPin('');
        setConfirmPin('');
        setVaultError('');
        if (addToast) addToast("Chat Vault initialized and safely backed up!", "success");
      }
    } catch (err) {
      console.error("Initialization failed", err);
      setVaultError("Failed to initialize vault container.");
    }
  };

  // === FIX: FORCE PRIMITIVE ARRAY FORMATTING FOR PRODUCTION ENDPOINTS ===
  const handleUnlockVault = async (e) => {
    e.preventDefault();
    if (!chatPin) return;

    try {
      // ✅ CRITICAL PRODUCTION FIX: Convert potential object models safely back into flat arrays
      const formattedPrivateKey = Array.isArray(escrowParams.escrowedPrivateKey)
        ? escrowParams.escrowedPrivateKey
        : Object.values(escrowParams.escrowedPrivateKey);

      const formattedSalt = Array.isArray(escrowParams.escrowSalt)
        ? escrowParams.escrowSalt
        : Object.values(escrowParams.escrowSalt);

      const formattedIv = Array.isArray(escrowParams.escrowIv)
        ? escrowParams.escrowIv
        : Object.values(escrowParams.escrowIv);

      // Now pass the standard primitive arrays down into the Web Crypto API
      const decryptedPrivKey = await unwrapPrivateKey(
        formattedPrivateKey,
        formattedSalt,
        formattedIv,
        chatPin
      );

      localStorage.setItem(`e2ee_priv_${user._id}`, JSON.stringify(decryptedPrivKey));
      setVaultStatus('unlocked');
      setChatPin('');
      setVaultError('');
      
      if (addToast) addToast("Secure Vault Unlocked successfully!", "success");
      
      // Force reload active chat messages to decrypt immediately with the correct key
      window.location.reload();
    } catch (err) {
      console.error("Decryption failed with provided PIN:", err);
      setVaultError("Incorrect Passphrase or PIN. Unable to unwrap cryptographic key.");
    }
  };

  // const handleChatSelect = (convo) => {
    // if (activeChat && activeChat._id === convo._id) return;
  //   setActiveChat(convo);
  //   setMessages([]); // Clear instantly to prevent UI flickering
  //   setMessagePage(1); // Reset pagination
  //   setHasMoreMessages(true);
  // };

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

  // --- CAMERA CAPTURE HANDLER ---
  const handleCameraCapture = (file) => {
    // We mock an event object so we can reuse our existing handleFileSelect logic!
    const mockEvent = { target: { files: [file] } };
    handleFileSelect(mockEvent);
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

  // --- 4. SEND MESSAGE (NOW WITH E2EE!) ---
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return; 
    if (!activeChat) return;

    // FORCE STRING NORMALIZATION IN SEND PAYLOADS
    const receiver = activeChat.isGroup 
      ? null 
      : activeChat.participants.find(p => String(p._id) !== String(user._id)); // ✅ FIX: Added String() wrapper
    
    // Variables to hold our payload
    let textToSend = newMessage;
    let ivToSend = [];
    let groupEnvelopes = null;

    // ==========================================
    // 🔒 E2EE ENCRYPTION BLOCK (1-on-1 Chats Only)
    // ==========================================
    if (activeChat.isGroup) {
    // === GROUP E2EE (ENVELOPE) ===
    const msgKey = await generateGroupMessageKey();
    const encryptedMsg = await encryptMessage(newMessage, msgKey); // Uses AES-GCM
    textToSend = JSON.stringify(encryptedMsg.ciphertext);
    ivToSend = encryptedMsg.iv;

    const myPrivKeyRaw = JSON.parse(localStorage.getItem(`e2ee_priv_${user._id}`));
    const myPrivKey = await importPrivateKey(myPrivKeyRaw);

    groupEnvelopes = {};
    for (const p of activeChat.participants) {
      if (!p.publicKey) continue; // Skip members who haven't initialized their keys yet
      
      try {
        // Import the participant's public key securely
        const theirPubKey = await importPublicKey(p.publicKey);
        
        // Lock a distinct copy of the message key inside this member's envelope
        groupEnvelopes[p._id] = await encryptKeyForRecipient(msgKey, myPrivKey, theirPubKey);
      } catch (err) {
        // Captures errors gracefully if a single key corrupts, preventing a complete send failure
        console.error(`Failed to lock digital envelope for user ${p._id}:`, err);
      }
    }} else if (!activeChat.isGroup && receiver) {
      if (!receiver.publicKey) {
        alert("This user hasn't updated their app to support encryption yet!");
        return;
      }

      try {
        // 1. Get My Private Key from LocalStorage
        const myPrivKeyJWK = JSON.parse(localStorage.getItem(`e2ee_priv_${user._id}`));
        const myPrivKey = await importPrivateKey(myPrivKeyJWK);
        
        // 2. Get Their Public Key from the active chat data
        const theirPubKey = await importPublicKey(receiver.publicKey);
        
        // 3. Derive the Shared Secret!
        const sharedSecret = await deriveSharedSecret(myPrivKey, theirPubKey);
        
        // 4. Encrypt the message text
        const encryptedData = await encryptMessage(newMessage, sharedSecret);
        
        // 5. Convert ciphertext array to a JSON string so MongoDB can store it as a standard String
        textToSend = JSON.stringify(encryptedData.ciphertext);
        ivToSend = encryptedData.iv;
        
        console.log("🔒 Message Encrypted Successfully!");
      } catch (err) {
        console.error("Encryption failed:", err);
        alert("Failed to encrypt message. Connection is not secure.");
        return; // Stop the send if encryption fails!
      }
    }
    // ==========================================

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ 
          receiverId: receiver ? receiver._id : null, 
          conversationId: activeChat.isNew ? null : activeChat._id,
          text: textToSend,       // This is now scrambled ciphertext!
          iv: ivToSend,
          envelopes: groupEnvelopes,           // The IV needed for decryption
          attachment: selectedFile 
        })
      });

      if (res.ok) {
        const savedMessage = await res.json();
        
        let actualConvoId = savedMessage.conversationId;

        if (activeChat.isNew) {
          setActiveChat({ ...activeChat, _id: actualConvoId, isNew: false });
          socketRef.current.emit('join_chat', actualConvoId);
        }

        // Broadcast to everyone else
        socketRef.current.emit('send_message', savedMessage);
        
        // =========================================================
        // --- INSTANT AUTO-REACTIVE UPDATE FOR THE SENDER ---
        // =========================================================
        
        // 1. Instantly append the message to our own chat screen
        setMessages((prev) => [...prev, savedMessage]);

        // 2. Instantly update our sidebar so our sent message shows up and bumps to the top
        setConversations((prevConvos) => {
          return prevConvos.map(convo => 
            (convo._id === actualConvoId || convo.isNew) 
              ? { ...convo, _id: actualConvoId, lastMessage: savedMessage, isNew: false, updatedAt: new Date().toISOString() } 
              : convo
          ).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
        });
        
        // --- RESET EVERYTHING ---
        setNewMessage('');
        setSelectedFile(null); 
        setShowEmojiPicker(false);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  

  const handleSendPoll = async (pollData) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ 
          conversationId: activeChat.isNew ? null : activeChat._id,
          receiverId: activeChat.isGroup ? null : activeChat.participants.find(p => p._id !== user._id)?._id,
          messageType: 'poll',
          pollData: pollData 
        })
      });

      if (res.ok) {
        const savedMessage = await res.json();
        socketRef.current.emit('send_message', savedMessage);
        setShowPollModal(false);
      }
    } catch (err) {
      console.error("Failed to send poll", err);
    }
  };

  // --- HANDLE POLL VOTING (INSTANT UI UPDATE) ---
  const handleVote = async (messageId, optionId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/poll/${messageId}/vote`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ optionId })
      });

      if (res.ok) {
        const updatedMsg = await res.json();
        
        // 1. Instantly update the local UI for the person who clicked it!
        setMessages((prev) => prev.map(msg => msg._id === updatedMsg._id ? updatedMsg : msg));

        // 2. Broadcast the updated message to everyone else in the group via WebSockets!
        socketRef.current.emit('update_message', updatedMsg);
      }
    } catch (err) {
      console.error("Failed to cast vote", err);
    }
  };

  const handleOpenVaultDocument = (attachment) => {
    setSandboxFile(attachment);
    if (attachment.fileType === 'document' || attachment.fileType === 'video') {
      setShowDisclaimer(true);
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


  if (vaultStatus === 'checking') {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <SpiritualLoader size="small" message="Synchronizing Secure Chat Containers..." />
      </div>
    );
  }

  // === FIX: INJECT ADAPTIVE MIGRATION UI LABELS ===
  if (vaultStatus === 'locked' || vaultStatus === 'setup_required' || vaultStatus === 'backup_required') {
    return (
      <div className="chat-modal-overlay" style={{ zIndex: 6000, backgroundColor: '#0a0a0a' }}>
        <div className="chat-modal-content" style={{ maxWidth: '450px', padding: '35px', textAlign: 'center', borderRadius: '16px', borderTop: '4px solid #e67e22' }}>
          <h2 style={{ color: '#e67e22', marginBottom: '10px' }}>
            {vaultStatus === 'setup_required' && '🕉️ Set Your Chat Passphrase'}
            {vaultStatus === 'backup_required' && '🔒 Secure Your Chat History'}
            {vaultStatus === 'locked' && '🔒 Secure Chat Container Locked'}
          </h2>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' }}>
            {vaultStatus === 'setup_required' && 'Create a private PIN or Passphrase to secure your end-to-end encrypted conversations across all devices. The server never stores this secret.'}
            {vaultStatus === 'backup_required' && 'We detected active encryption keys from a previous session stored locally. Create a custom PIN or Passphrase to safely back up this key history to your profile vault so you can unlock your messages on other devices.'}
            {vaultStatus === 'locked' && 'Enter your custom Chat PIN or Passphrase to download and unwrap your end-to-end encryption keys.'}
          </p>

          <form onSubmit={vaultStatus === 'locked' ? handleUnlockVault : handleInitializeVault}>
            <input 
              type="password"
              placeholder={(vaultStatus === 'setup_required' || vaultStatus === 'backup_required') ? "Create Secure PIN / Passphrase" : "Enter PIN to Unlock"}
              value={chatPin}
              onChange={(e) => setChatPin(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: '#111', color: '#fff', border: '1px solid #333', borderRadius: '8px', textAlign: 'center', fontSize: '1.1rem' }}
            />

            {(vaultStatus === 'setup_required' || vaultStatus === 'backup_required') && (
              <input 
                type="password"
                placeholder="Confirm PIN / Passphrase"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                style={{ width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: '#111', color: '#fff', border: '1px solid #333', borderRadius: '8px', textAlign: 'center', fontSize: '1.1rem' }}
              />
            )}

            {vaultError && <p style={{ color: '#ff4757', fontSize: '0.85rem', marginBottom: '15px' }}>{vaultError}</p>}

            <button type="submit" className="cta-button" style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 'bold' }}>
              {vaultStatus === 'locked' ? 'Unlock Chat History' : 'Secure Existing History'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`chat-container ${activeChat ? 'mobile-chat-open' : ''}`}>

      {/* =========================================
             SECURITY SANDBOX & DISCLAIMER MODALS 
          ========================================= */}
      
      {/* 1. VIRUS/MALWARE DISCLAIMER */}
      {showDisclaimer && sandboxFile && (
        <div className="chat-modal-overlay" style={{ zIndex: 3001 }}> {/* <-- INCREASED TO 3001 */}
          <div className="chat-modal-content" style={{ borderTop: '4px solid #ff4757' }}>
            {/* ... rest of the disclaimer content stays exactly the same ... */}
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

      {/* 2. UNIVERSAL MEDIA VIEWER (SANDBOX) */}
      {sandboxFile && !showDisclaimer && (
        <div className="chat-modal-overlay" style={{ zIndex: 3000, padding: '20px' }}> {/* <-- INCREASED TO 3000 */}
          <div className="chat-modal-content" style={{ width: '100%', maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column', padding: '15px' }}>
            <div className="chat-modal-header" style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#e67e22', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Protected View: {sandboxFile.fileName || 'Image'}
              </h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                <a href={sandboxFile.url} download target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem' }}>Download Original</a>
                <button onClick={() => setSandboxFile(null)} className="close-modal-btn" style={{ fontSize: '1.2rem' }}>✕</button>
              </div>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
              {/* --- NEW: RENDER IMAGES, VIDEOS, OR IFRAMES --- */}
              {sandboxFile.fileType === 'image' ? (
                <img src={sandboxFile.url} alt="Full screen preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : sandboxFile.fileType === 'video' ? (
                <video src={sandboxFile.url} controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
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
              // ✅ FIX: Cast participant ID lookup to string safely
              const participant = convo.participants.find(p => String(p._id) !== String(user._id));
              const chatName = convo.isGroup ? convo.groupName : participant?.name || 'Unknown';
              
              const isOnline = !convo.isGroup && onlineUsers.some(id => String(id) === String(participant?._id));

            return (
              <div key={convo._id} className={`conversation-item ...`} onClick={() => setActiveChat(convo)}>
                <div className="convo-avatar">
                  {chatName.charAt(0)}
                  {/* --- NEW: GREEN DOT --- */}
                  {isOnline && <div className="online-status-dot" />}
                </div>
                <div className="convo-info">
                  <h4>{chatName} {convo.isGroup && <span style={{fontSize:'0.7rem', color: '#e67e22'}}>(Group)</span>}</h4>
                  
                  {/* --- NEW: Hide Ciphertext in the Sidebar Preview --- */}
                  <p>
                    {convo.lastMessage 
                      ? (convo.lastMessage.iv && convo.lastMessage.iv.length > 0 
                          ? '🔒 Encrypted Message' 
                          : convo.lastMessage.text) 
                      : 'No messages yet.'}
                  </p>

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

                {typingUser && (
                  <span style={{ fontSize: '0.8rem', color: '#e67e22', fontStyle: 'italic', marginLeft: '10px' }}>
                    {typingUser} is typing...
                  </span>
                )}

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
                {/* --- NEW: CHAT VAULT BUTTON --- */}
                <button 
                  onClick={() => setShowVault(true)}
                  style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.2rem', cursor: 'pointer', padding: '0 5px' }}
                  title="Open Chat Vault"
                >
                  📁
                </button>

                {/* --- Chat Header Updates --- */}
                {!activeChat.isGroup && (
                  <div style={{ display: 'flex', gap: '15px', marginRight: '10px' }}>
                    <button 
                      onClick={() => startCall('audio')} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                      title="Audio Call"
                    >
                      📞
                    </button>
                    <button 
                      onClick={() => startCall('video')} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                      title="Video Call"
                    >
                      📹
                    </button>
                  </div>
                )}

              </div>
              
              <button className="close-chat-btn" onClick={handleCloseChat}>✕</button>
            </div>
            
            <div className="chat-messages">
              {/* --- NEW: LOAD MORE MESSAGES --- */}
              {/* --- ADD THE LOADER HERE --- */}
              {loadingMessages ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <SpiritualLoader size="small" message="Opening Sacred Space..." />
                </div>
              ) : (
                <>
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

              {messages.map((msg, index) => (
                <MessageBubble 
                  key={msg._id || index} 
                  msg={msg} 
                  activeChat={activeChat} 
                  user={user} 
                  renderTextWithLinks={renderTextWithLinks}
                  setSandboxFile={setSandboxFile}
                  setShowDisclaimer={setShowDisclaimer}
                  handleVote={handleVote} /* <--- NEW PROP! */
                />
              ))}
              </>
              )}
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


            {/* --- NEW: CAMERA MODAL --- */}
            {showCamera && (
              <CameraCapture 
                onCapture={handleCameraCapture} 
                onClose={() => setShowCamera(false)} 
              />
            )}

            {/* --- NEW: POLL MODAL --- */}
            {showPollModal && (
              <CreatePollModal 
                onSubmit={handleSendPoll} 
                onClose={() => setShowPollModal(false)} 
              />
            )}

            {/* --- NEW: CHAT VAULT MODAL --- */}
            {showVault && (
              <ChatVaultModal 
                conversationId={activeChat._id}
                chatName={activeChat.isGroup ? activeChat.groupName : activeChat.participants.find(p => p._id !== user._id)?.name}
                token={user.token}
                onClose={() => setShowVault(false)}
                onOpenDocument={handleOpenVaultDocument}
              />
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

                {/* --- NEW: CAMERA BUTTON --- */}
                <button 
                  type="button" 
                  onClick={() => setShowCamera(true)}
                  disabled={isUploading}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: isUploading ? 'not-allowed' : 'pointer', padding: '0 5px', color: isUploading ? '#444' : '#888', transition: 'color 0.2s' }}
                  title="Take Photo"
                >
                  📷
                </button>
                
                {/* --- NEW: POLL BUTTON (GROUPS ONLY) --- */}
                {activeChat.isGroup && (
                  <button 
                    type="button" 
                    onClick={() => setShowPollModal(true)}
                    disabled={isUploading}
                    style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: isUploading ? 'not-allowed' : 'pointer', padding: '0 5px', color: isUploading ? '#444' : '#888', transition: 'color 0.2s' }}
                    title="Create Poll"
                  >
                    📊
                  </button>
                )}

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
                  onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} 
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

      {/* =========================================
            📞 INCOMING CALL MODAL (MOVED OUTSIDE UNIVERSALLY)
          ========================================= */}
      {receivingCall && !callAccepted && (
        <div className="chat-modal-overlay" style={{ zIndex: 4000 }}>
          <div className="chat-modal-content" style={{ textAlign: 'center', padding: '30px' }}>
            <div className="spiritual-loader-container small">
              <SpiritualLoader size="small" message="" />
            </div>
            <h2 style={{ color: '#e67e22', marginTop: '20px' }}>Incoming {callerInfo?.callType || 'Spiritual'} Call</h2>
            <p style={{ color: '#fff', fontSize: '1.2rem' }}>{callerInfo?.name || 'A Community Member'} is calling...</p>
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
              <button className="cancel-btn" onClick={rejectCall} style={{ padding: '10px 30px' }}>
                Decline
              </button>
              <button className="cta-button" onClick={acceptCall} style={{ padding: '10px 30px', backgroundColor: '#2ecc71', border: 'none' }}>
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

    
      {/* =========================================
          📞 ACTIVE CALL MODAL (MOVED HERE!)
        ========================================= */}
      {(calling || callAccepted) && (
        <div className="chat-modal-overlay" style={{ zIndex: 5000, backgroundColor: '#000' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '20px' }}>
              <h3>{callType === 'video' ? 'Video Call' : 'Audio Call'} with {activeChat?.participants.find(p => p._id !== user._id)?.name || callerInfo?.name}</h3>
              <button 
                onClick={() => {
                  const peerId = activeChat?.participants.find(p => p._id !== user._id)?._id || callerInfo?.from;
                  endCallLocally(peerId);
                }} 
                style={{ backgroundColor: '#ff4757', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
              >
                End Call
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* My Video */}
              <div style={{ width: callType === 'video' ? '300px' : '150px', aspectRatio: '16/9', backgroundColor: '#222', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e67e22', position: 'relative' }}>
                <video playsInline muted ref={myVideoRef} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }}>You</span>
              </div>

              {/* Peer Video */}
              {callAccepted ? (
                <div style={{ width: callType === 'video' ? '600px' : '150px', aspectRatio: '16/9', backgroundColor: '#111', borderRadius: '12px', overflow: 'hidden', border: '2px solid #444', position: 'relative' }}>
                  <video playsInline ref={peerVideoRef} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }}>{activeChat?.participants.find(p => p._id !== user._id)?.name || callerInfo?.name}</span>
                </div>
              ) : (
                <div style={{ color: '#888', textAlign: 'center' }}>
                  <SpiritualLoader size="small" message="Waiting for response..." />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}