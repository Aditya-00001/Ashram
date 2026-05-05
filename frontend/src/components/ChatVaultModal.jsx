import React, { useState, useEffect } from 'react';

export default function ChatVaultModal({ conversationId, chatName, token, onClose, onOpenDocument }) {
  const [activeTab, setActiveTab] = useState('media'); // 'media' or 'docs'
  const [mediaItems, setMediaItems] = useState([]);
  const [docItems, setDocItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVaultData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/${conversationId}/media`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMediaItems(data.media);
          setDocItems(data.docs);
        }
      } catch (error) {
        console.error("Failed to fetch vault data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVaultData();
  }, [conversationId, token]);

  return (
    <div className="chat-modal-overlay" style={{ zIndex: 2000 }}>
      <div className="chat-modal-content" style={{ width: '100%', maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111' }}>
          <div>
            <h3 style={{ margin: 0, color: '#e67e22' }}>Chat Vault</h3>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>{chatName}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #333', backgroundColor: '#1a1a1a' }}>
          <button 
            onClick={() => setActiveTab('media')}
            style={{ flex: 1, padding: '15px', background: 'none', border: 'none', color: activeTab === 'media' ? '#e67e22' : '#888', borderBottom: activeTab === 'media' ? '2px solid #e67e22' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Media ({mediaItems.length})
          </button>
          <button 
            onClick={() => setActiveTab('docs')}
            style={{ flex: 1, padding: '15px', background: 'none', border: 'none', color: activeTab === 'docs' ? '#e67e22' : '#888', borderBottom: activeTab === 'docs' ? '2px solid #e67e22' : 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Documents ({docItems.length})
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#0a0a0a' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>Loading Vault...</p>
          ) : (
            <>
              {/* MEDIA GRID TAB */}
              {activeTab === 'media' && (
                mediaItems.length === 0 ? <p style={{ textAlign: 'center', color: '#555' }}>No media shared yet.</p> :
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                  {mediaItems.map(msg => (
                    <div key={msg._id} style={{ width: '100%', aspectRatio: '1', backgroundColor: '#222', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                      {msg.attachment.fileType === 'image' ? (
                        <div 
                          onClick={() => onOpenDocument(msg.attachment)} 
                          style={{ width: '100%', height: '100%', cursor: 'pointer' }}
                        >
                          <img src={msg.attachment.url} alt="Shared Image" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                      ) : (
                        <div 
                          onClick={() => onOpenDocument(msg.attachment)} 
                          style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#111' }}
                        >
                          <span style={{ fontSize: '2rem' }}>🎥</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* DOCUMENT VAULT TAB */}
              {activeTab === 'docs' && (
                docItems.length === 0 ? <p style={{ textAlign: 'center', color: '#555' }}>No documents shared yet.</p> :
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {docItems.map(msg => (
                    <div key={msg._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '2rem' }}>📄</span>
                        <div style={{ overflow: 'hidden' }}>
                          <h4 style={{ margin: 0, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.attachment.fileName}</h4>
                          <span style={{ fontSize: '0.8rem', color: '#888' }}>
                            Shared by {msg.sender?.name || 'Member'} • {new Date(msg.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => onOpenDocument(msg.attachment)}
                          style={{ background: '#e67e2222', color: '#e67e22', border: '1px solid #e67e22', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}