import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../constants';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && !loading && !user) {
      navigate(ROUTES.LOGIN);
    }
  }, [user, loading, initialized, navigate]);

  if (!initialized || (loading && !user)) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <>{children}</> : null;
}
