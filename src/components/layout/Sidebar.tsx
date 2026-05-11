import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Play, Settings, HelpCircle, User, LogOut } from 'lucide-react';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.DASHBOARD },
  { label: 'Portals', icon: Play, path: ROUTES.PORTALS }, 
  { label: 'Settings', icon: Settings, path: ROUTES.SETTINGS },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();

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
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-white border-r border-black/5 z-40 transition-stak">
      <div className="flex flex-col h-full py-10">
        {/* Logo */}
        <div className="px-8 mb-10">
          <h1 className="text-3xl font-serif tracking-tight font-medium leading-none">STAK</h1>
          <p className="text-[11px] text-[#999] mt-2 font-medium">Professional Editor</p>
        </div>

        <div className="px-4 flex-1">
          {/* Nav Items */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-4 px-4 py-3 transition-stak group relative',
                    isActive 
                      ? 'text-black' 
                      : 'text-[#888] hover:text-black hover:bg-black/[0.02]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-black rounded-l" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="px-6 mt-auto space-y-6">
          {/* Upgrade Plan Card */}
          <div className="bg-[#F2F2F2] p-6 rounded-sm text-center">
            <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1">Free Plan</h4>
            <div className="flex justify-center mb-4">
               <button className="bg-black text-white px-6 py-2.5 text-xs font-semibold rounded-sm hover:bg-black/90 transition-stak w-full">
                Upgrade Plan
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <a href="#" className="flex items-center gap-4 px-2 py-1 text-[#888] hover:text-black transition-stak">
              <HelpCircle size={20} strokeWidth={1.5} />
              <span className="text-sm font-medium">Support</span>
            </a>

            <div className="pt-6 border-t border-black/5 flex items-center justify-between gap-3 px-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-black/5 shrink-0 border border-black/5 flex items-center justify-center text-[#999]">
                  <User size={16} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-black truncate">{profile?.displayName || 'Editor Name'}</p>
                  <p className="text-[10px] text-[#999] uppercase tracking-wider font-bold">{profile?.plan || 'Free Plan'}</p>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={cn(
                  "p-2 text-[#999] hover:text-red-500 transition-stak",
                  isSigningOut && "opacity-50 cursor-not-allowed"
                )}
                title="Log Out"
              >
                <LogOut size={16} className={cn(isSigningOut && "animate-pulse")} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
