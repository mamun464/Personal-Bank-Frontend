import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const authKey = localStorage.getItem('authkey');

  if (!authKey) {
    // If no authkey, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If authenticated, show the protected page
  return children;
}
