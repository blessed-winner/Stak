import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Portals from './pages/Portals';
import PortalNew from './pages/PortalNew';
import PortalDetail from './pages/PortalDetail';
import ClientPortal from './pages/ClientPortal';
import Settings from './pages/Settings';
import Support from './pages/Support';
import { ROUTES } from './constants';
import { useUIStore } from './store/uiStore';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useEffect } from 'react';
import { useThemeStore } from './store/themeStore';

function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`w-[320px] bg-surface-raised border border-border-default p-4 flex items-start gap-3 shadow-md rounded-lg ${
              toast.type === 'success' ? 'border-l-4 border-l-success' : 'border-l-4 border-l-error'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path={ROUTES.LOGIN} element={<Auth />} />
        <Route path={ROUTES.SIGNUP} element={<Auth />} />
        
        <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path={ROUTES.PORTALS} element={<ProtectedRoute><Portals /></ProtectedRoute>} />
        <Route path={ROUTES.PORTALS_NEW} element={<ProtectedRoute><PortalNew /></ProtectedRoute>} />
        <Route path="/portals/:id" element={<ProtectedRoute><PortalDetail /></ProtectedRoute>} />
        <Route path="/p/:editorSlug/:portalSlug" element={<ClientPortal />} />
        <Route path={ROUTES.SETTINGS} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path={ROUTES.SUPPORT} element={<ProtectedRoute><Support /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
}
