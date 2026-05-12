import React, { useState } from 'react';
import { LayoutDashboard, Clock, AlertCircle, Play, ChevronRight, MessageSquare, Download, CheckCircle, Share2, User } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { useAuthStore } from '../store/authStore';
import { usePortals, useDashboard } from '../hooks/usePortals';
import { motion } from 'motion/react';
import { cn, formatDate, formatRelativeTime } from '../lib/utils';
import { Portal } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { portals, stats, recentActivity, loading } = useDashboard();
  const [showAllActivity, setShowAllActivity] = useState(false);
  const typedPortals = portals as (Portal & { videoUrl?: string })[];
  const visibleActivity = showAllActivity ? recentActivity : recentActivity.slice(0, 5);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F8F8]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center lg:ml-[240px]">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F8F8] text-black">
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>
      
      <main className="flex-1 px-4 md:px-8 lg:px-16 py-8 md:py-16 lg:ml-[240px] pb-24 lg:pb-16">
        <header className="mb-10 md:mb-14">
          <p className="text-[#888] text-sm mb-4 font-medium">{formatDate(new Date())}</p>
          <h1 className="text-3xl md:text-5xl font-serif tracking-tight font-medium">
            Good morning, {profile?.displayName?.split(' ')[0] || 'Editor'}.
          </h1>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-16">
          <div className="bg-white border border-black/5 p-6 md:p-8 rounded-sm transition-stak hover:shadow-sm">
            <p className="text-[#888] text-xs font-semibold mb-6 uppercase tracking-widest">Active Portals</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-5xl font-serif">{stats.activePortals}</span>
              <span className="text-[#888] text-lg md:text-xl font-serif">/ {stats.totalPortals} total</span>
            </div>
          </div>
          
          <div className="bg-white border border-black/5 p-6 md:p-8 rounded-sm transition-stak hover:shadow-sm">
            <p className="text-[#888] text-xs font-semibold mb-6 uppercase tracking-widest">Recent Notes</p>
            <div className="flex items-baseline gap-4">
              <span className="text-3xl md:text-5xl font-serif text-black">{stats.recentNotes}</span>
              {stats.recentNotes > 0 && (
                <span className="bg-[#FFE5E5] text-[#FF4444] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm">
                  Review
                </span>
              )}
            </div>
          </div>

          <div className="bg-white border border-black/5 p-6 md:p-8 rounded-sm transition-stak hover:shadow-sm">
            <p className="text-[#888] text-xs font-semibold mb-6 uppercase tracking-widest">Total Views</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-5xl font-serif">{stats.totalViews}</span>
              <span className="text-[#888] text-lg md:text-xl font-serif tracking-tight">Across all</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-16">
          {/* Needs Attention */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-xl font-semibold">Portals</h2>
              <span className="bg-black/5 text-[#888] px-2 py-0.5 rounded-full text-[11px] font-bold">{portals.length}</span>
            </div>
            
            <div className="space-y-4">
              {typedPortals.length > 0 ? typedPortals.slice(0, 5).map((portal) => (
                <div 
                  key={portal.id} 
                  className="bg-white border border-black/5 p-4 rounded-sm flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 group cursor-pointer transition-stak hover:border-black/20"
                  onClick={() => navigate(ROUTES.PORTAL_DETAIL(portal.id))}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-4">
                       <div className="flex items-center gap-3 truncate">
                          <div className={cn(
                            "w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-stak",
                            portal.status === 'active' ? "bg-black text-white border-black" : "bg-black/5 border-black/10 text-[#999]"
                          )}>
                             <User size={16} />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium truncate">{portal.title}</h3>
                            <p className="text-xs text-[#888] font-medium tracking-tight">Client: {portal.clientName}</p>
                          </div>
                       </div>
                      <span className={cn(
                        "px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-sm shrink-0",
                        portal.status === 'active' ? "bg-black/5 text-black" : "bg-[#FFE5E5] text-[#FF4444]"
                      )}>
                        {portal.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#BBB] uppercase font-bold tracking-widest mt-2">{formatDate(portal.createdAt)}</p>
                  </div>
                  <ChevronRight size={20} className="hidden sm:block text-black/20 group-hover:text-black transition-stak" />
                </div>
              )) : (
                <div className="p-16 border border-dashed border-black/10 rounded-sm text-center">
                  <p className="text-[#888] text-sm">No portals yet</p>
                  <Button 
                    variant="primary" 
                    className="mt-4"
                    onClick={() => navigate(ROUTES.PORTALS)}
                  >
                    Create your first portal
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Recent Activity */}
          <section>
             <h2 className="text-xl font-semibold mb-8">Recent Activity</h2>
             <div className="bg-white border border-black/5 p-8 rounded-sm">
                <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-black/5">
                  {visibleActivity.length > 0 ? visibleActivity.map((act: any) => (
                    <ActivityItem 
                      key={act.id}
                      icon={
                        act.type === 'notes_submitted' ? MessageSquare : 
                        act.type === 'portal_created' ? LayoutDashboard : 
                        act.type === 'approved' ? CheckCircle : 
                        act.type === 'portal_viewed' ? User :
                        act.type === 'round_uploaded' ? Play :
                        Play
                      } 
                      title={
                        <p className="text-sm leading-relaxed text-black">
                          {act.type === 'portal_created' && <>New portal <strong>{act.portalTitle}</strong> created</>}
                          {act.type === 'notes_submitted' && <>New feedback on <strong>{act.portalTitle}</strong></>}
                          {act.type === 'approved' && <><strong>{act.portalTitle}</strong> was approved</>}
                          {act.type === 'round_uploaded' && <>New round added to <strong>{act.portalTitle}</strong></>}
                          {act.type === 'portal_viewed' && <><strong>{act.portalTitle}</strong> was viewed by client</>}
                        </p>
                      }
                      time={formatRelativeTime(act.timestamp)}
                    />
                  )) : (
                    <p className="text-sm text-[#888] italic">No recent activity</p>
                  )}
                </div>
                {recentActivity.length > 5 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllActivity((current) => !current)}
                    className="w-full mt-10 py-3 border-t border-black/5 text-[#888] text-sm hover:text-black transition-stak font-medium"
                  >
                    {showAllActivity ? 'Show less activity' : `Show more activity (${recentActivity.length - 5})`}
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate(ROUTES.PORTALS)}
                    className="w-full mt-12 py-3 border-t border-black/5 text-[#888] text-sm hover:text-black transition-stak font-medium"
                  >
                    Manage Portals
                  </button>
                )}
             </div>
          </section>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

interface ActivityItemProps {
  key?: any;
  icon: any;
  title: React.ReactNode;
  time: string;
}

function ActivityItem({ icon: Icon, title, time }: ActivityItemProps) {
  return (
    <div className="flex gap-4 relative z-10">
      <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center shrink-0">
        <Icon size={12} className="text-white" />
      </div>
      <div>
        {title}
        <p className="text-[10px] uppercase font-bold tracking-widest text-[#999] mt-1">{time}</p>
      </div>
    </div>
  );
}
