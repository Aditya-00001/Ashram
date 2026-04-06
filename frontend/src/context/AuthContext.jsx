import React, { createContext, useState, useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ashramUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  // --- NEW: Verify Email Function ---
  const verifyEmail = async (email, code) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (response.ok) {
      // Once verified, the backend sends back the login token. Log them in!
      setUser(data); 
      localStorage.setItem('ashramUser', JSON.stringify(data));
      return { success: true, role: data.role }; 
    } else {
      return { success: false, message: data.message };
    }
  };

  // --- NEW: Registration Function ---
  // Inside AuthContext.jsx
  const register = async (name, email, password) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // REMOVED auto-login logic here. Just return success!
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

  // DON'T FORGET to add 'register' to this list!
  return (
    <AuthContext.Provider value={{ user, setUser, login, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};