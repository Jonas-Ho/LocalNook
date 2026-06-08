import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (fromPath) => {
    if (isAuthenticated) return true;
    navigate('/login', { state: { from: { pathname: fromPath || window.location.pathname } } });
    return false;
  };
}