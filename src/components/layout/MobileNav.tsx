import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Play, Settings, User, LogOut } from 'lucide-react';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.DASHBOARD },
  { label: 'Portals', icon: Play, path: ROUTES.PORTALS }, 
  { label: 'Settings', icon: Settings, path: ROUTES.SETTINGS },
];

export function MobileNav() {
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-surface-raised/90 backdrop-blur-md border border-border-default z-50 px-6 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.1)] rounded-none">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 p-2 transition-stak',
                isActive ? 'text-text-primary' : 'text-text-tertiary hover:text-text-primary'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button 
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={cn(
            "flex flex-col items-center gap-1 p-2 text-text-tertiary hover:text-red-500 transition-stak",
            isSigningOut && "opacity-50 cursor-not-allowed"
          )}
        >
          <LogOut size={20} strokeWidth={1.5} className={cn(isSigningOut && "animate-pulse")} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{isSigningOut ? '...' : 'Out'}</span>
        </button>
      </div>
    </nav>
  );
}
