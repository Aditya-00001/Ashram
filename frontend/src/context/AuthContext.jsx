import React, { createContext, useState, useEffect } from 'react';
// --- NEW: Import our crypto engine ---
import { generateKeyPair, exportPublicKey, exportPrivateKey } from '../utils/cryptoUtils';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // FIX: Read directly from 'ashramUser' so we have the data instantly on load
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('ashramUser')) || null);

  // --- NEW: E2EE KEY INITIALIZATION ---
  useEffect(() => {
    const initializeKeys = async () => {
      if (!user || !user.token) return;

      try {
        // 1. Check if the private key already exists in this browser
        const storedPrivateKey = localStorage.getItem(`e2ee_priv_${user._id}`);
        
        if (!storedPrivateKey) {
          console.log("🔒 E2EE: No private key found. Generating new Key Pair...");
          
          // 2. Generate a fresh ECDH Key Pair
          const keyPair = await generateKeyPair();
          
          // 3. Export them to JSON Web Key (JWK) format
          const publicKeyJWK = await exportPublicKey(keyPair.publicKey);
          const privateKeyJWK = await exportPrivateKey(keyPair.privateKey);

          // 4. LOCK THE PRIVATE KEY IN LOCAL STORAGE (Never send to server!)
          localStorage.setItem(`e2ee_priv_${user._id}`, JSON.stringify(privateKeyJWK));

          // 5. SEND THE PUBLIC KEY TO MONGODB
          await fetch(`${import.meta.env.VITE_API_URL}/api/users/public-key`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ publicKey: publicKeyJWK })
          });

          console.log("✅ E2EE: Keys generated and Public Key registered with server.");
        }
      } catch (error) {
        console.error("❌ E2EE Initialization Failed:", error);
      }
    }; 

    initializeKeys();
  }, [user]);

  // --- NEW: Verify Email Function ---
  const verifyEmail = async (email, code) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (response.ok) {
      setUser(data); 
      localStorage.setItem('ashramUser', JSON.stringify(data));
      return { success: true, role: data.role }; 
    } else {
      return { success: false, message: data.message };
    }
  };

  // --- NEW: Registration Function ---
  const register = async (name, email, password) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true }; 
    } else {
      return { success: false, message: data.message };
    }
  };

  // --- EXISTING: Login Function ---
  const login = async (email, password) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      setUser(data); 
      localStorage.setItem('ashramUser', JSON.stringify(data));
      return { success: true, role: data.role }; 
    } else {
      return { success: false, message: data.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ashramUser');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};