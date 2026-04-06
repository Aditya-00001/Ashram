import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useContext(AuthContext);

  // If they are not logged in at all, kick them to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If this route requires Admin, but they are a normal user, kick them to their profile
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/my-profile" replace />;
  }

  // If they pass the checks, render the page!
  return children;
}