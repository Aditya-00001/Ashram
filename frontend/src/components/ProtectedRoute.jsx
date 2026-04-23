import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useContext(AuthContext);

  // If they are not logged in at all, kick them to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // --- UPDATED: Allow both roles through the 'adminOnly' gate ---
  if (adminOnly && user.role !== 'admin' && user.role !== 'trustee' && user.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }

  // If they pass the checks, render the page!
  return children;
}