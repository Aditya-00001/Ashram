import React, { useRef, useState, useEffect } from 'react';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Turn on the camera when the component mounts
  useEffect(() => {
    let activeStream = null;
    
    const startCamera = async () => {
      try {
        // Request video stream (facingMode 'environment' prefers the back camera on mobile)
        activeStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(activeStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        alert("Could not access camera. Please check your browser permissions.");
        onClose();
      }
    };

    startCamera();

    // CLEANUP: Turn off the camera hardware when the modal closes!
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onClose]);

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match the video feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame onto the hidden canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas drawing into a raw Blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Package the blob as a standard File object!
        const file = new File([blob], `snapshot_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file); 
        onClose(); // Close the camera modal
      }
    }, 'image/jpeg', 0.9); // 0.9 is the image quality
  };

  return (
    <div className="chat-modal-overlay" style={{ zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.9)' }}>
      <div className="chat-modal-content" style={{ backgroundColor: '#111', border: '1px solid #333', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#e67e22' }}>Take a Photo</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Live Video Feed */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '500px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }} // Mirrors the feed like a normal selfie cam
          />
        </div>

        {/* Hidden Canvas for processing the image */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Shutter Button */}
        <button 
          onClick={handleSnap}
          style={{ 
            marginTop: '20px', 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            backgroundColor: '#e67e22', 
            border: '4px solid #fff', 
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(230, 126, 34, 0.4)'
          }}
          title="Take Photo"
        />
      </div>
    </div>
  );
}