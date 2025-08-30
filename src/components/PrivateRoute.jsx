import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('authkey'); // check your login token
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
