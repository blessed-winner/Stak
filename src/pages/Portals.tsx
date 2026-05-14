import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Copy, ExternalLink, ChevronLeft, ChevronRight, User, MoreHorizontal, Archive, Trash2, RotateCcw } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import { Button } from '../components/ui/Button';
import { ROUTES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate, formatRelativeTime } from '../lib/utils';
import { usePortals, archivePortal, deletePortal, unarchivePortal } from '../hooks/usePortals';
import { Portal } from '../types';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'awaiting_action', label: 'Awaiting action' },
  { id: 'awaiting_client', label: 'Awaiting client' },
  { id: 'archived', label: 'Archived' },
];

export default function Portals() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { addToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const { portals, loading, refreshPortals } = usePortals();
  const typedPortals = portals as (Portal & { videoUrl?: string, lastUpdated: string })[];

  const handleCopyLink = (portal: Portal) => {
    const url = `${window.location.origin}/p/${profile?.slug}/${portal.slug}`;
    navigator.clipboard.writeText(url);
    addToast('Link copied', 'success');
  };

  const handleOpenExternal = (portal: Portal) => {
    const url = `${window.location.origin}/p/${profile?.slug}/${portal.slug}`;
    window.open(url, '_blank');
  };

  const handleArchive = async (id: string) => {
    try {
      await archivePortal(id);
      addToast('Portal archived', 'success');
      refreshPortals();
    } catch (error: any) {
      addToast(error.message || 'Failed to archive', 'error');
    }
    setActiveMenuId(null);
  };

  const handleUnarchive = async (id: string) => {
    try {
      await unarchivePortal(id);
      addToast('Portal restored from archive', 'success');
      refreshPortals();
    } catch (error: any) {
      addToast(error.message || 'Failed to unarchive', 'error');
    }
    setActiveMenuId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this portal?')) return;
    try {
      await deletePortal(id);
      addToast('Portal deleted', 'success');
      refreshPortals();
    } catch (error: any) {
      addToast(error.message || 'Failed to delete', 'error');
    }
    setActiveMenuId(null);
  };

  const filteredPortals = typedPortals.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(search.toLowerCase()) || 
      p.clientName.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'active' || filter === 'awaiting_client' || filter === 'awaiting_action') return matchesSearch && p.status === 'active';
    if (filter === 'archived') return matchesSearch && p.status === 'archived';
    return matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-surface-base text-text-primary">
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 px-4 md:px-8 lg:px-16 py-8 md:py-16 lg:ml-[240px] pb-24 lg:pb-16">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-serif tracking-tight font-medium">Portals</h1>
          <button 
            onClick={() => navigate(ROUTES.PORTALS_NEW)}
            className="bg-brand-primary text-text-inverse px-8 py-3 rounded-sm text-sm font-semibold hover:opacity-90 transition-stak flex items-center gap-2"
          >
            <Plus size={18} />
            New portal
          </button>
        </header>

        {/* Filter Bar */}
        <div className="mb-6 md:mb-10 border-b border-border-default overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-6 md:gap-10 whitespace-nowrap min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "pb-4 text-sm font-medium transition-stak relative",
                  filter === tab.id ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                )}
              >
                {tab.label}
                {filter === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" 
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-8 relative">
          <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input 
            type="text"
            placeholder="Search portals, clients, or projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-raised border border-border-default rounded-sm pl-14 pr-6 py-5 text-sm focus:outline-none focus:border-black/20 transition-stak"
          />
        </div>

        {/* Portals Table / Mobile Cards */}
        <div className="bg-surface-raised border border-border-default rounded-sm overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px] lg:min-w-0">
            <thead>
              <tr className="border-b border-black/5">
                <th className="px-8 py-6 text-[11px] font-bold text-black uppercase tracking-[0.08em]">Client</th>
                <th className="px-8 py-6 text-[11px] font-bold text-black uppercase tracking-[0.08em]">Project</th>
                <th className="px-8 py-6 text-[11px] font-bold text-black uppercase tracking-[0.08em]">Round</th>
                <th className="px-8 py-6 text-[11px] font-bold text-black uppercase tracking-[0.08em]">Status</th>
                <th className="px-8 py-6 text-[11px] font-bold text-black uppercase tracking-[0.08em]">Last Activity</th>
                <th className="px-8 py-6 text-[11px] font-bold text-black uppercase tracking-[0.08em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredPortals.map((portal) => (
                <tr 
                  key={portal.id}
                  className="group hover:bg-black/[0.01] cursor-pointer transition-stak"
                  onClick={() => navigate(ROUTES.PORTAL_DETAIL(portal.id))}
                >
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-black/5 border border-black/5 flex items-center justify-center text-[#999] shrink-0">
                        <User size={18} />
                      </div>
                      <span className="text-sm font-semibold">{portal.clientName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <div>
                      <p className="text-sm font-semibold mb-1">{portal.title}</p>
                      <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider">Project Portal</p>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <span className="px-2 py-1 bg-black/5 rounded-sm text-[10px] font-bold text-black/60 uppercase tracking-wider">
                      R2
                    </span>
                  </td>
                  <td className="px-8 py-8">
                    <StatusBadge status={portal.status} />
                  </td>
                  <td className="px-8 py-8 text-sm text-black/70 font-medium font-sans italic">
                    {formatRelativeTime(portal.lastUpdated)}
                  </td>
                  <td className="px-8 py-8 text-right relative">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-stak">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(portal);
                        }}
                        className="p-2 text-[#888] hover:text-black hover:bg-black/5 rounded-sm transition-stak"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenExternal(portal);
                        }}
                        className="p-2 text-[#888] hover:text-black hover:bg-black/5 rounded-sm transition-stak"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === portal.id ? null : portal.id);
                          }}
                          className="p-2 text-[#888] hover:text-black hover:bg-black/5 rounded-sm transition-stak"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        <AnimatePresence>
                          {activeMenuId === portal.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                }} 
                              />
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-white border border-black/5 rounded-sm shadow-xl z-20 overflow-hidden"
                              >
                                {portal.status === 'archived' ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnarchive(portal.id);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#444] hover:bg-black/[0.02] transition-stak text-left"
                                  >
                                    <RotateCcw size={14} />
                                    Unarchive
                                  </button>
                                ) : (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchive(portal.id);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#444] hover:bg-black/[0.02] transition-stak text-left"
                                  >
                                    <Archive size={14} />
                                    Archive
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(portal.id);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-stak text-left"
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-8 py-6 border-t border-black/5 flex items-center justify-between text-sm text-[#888] font-medium">
            <p>Showing {filteredPortals.length} of {portals.length} portals</p>
            <div className="flex items-center gap-2">
               <button className="p-2 hover:text-black transition-stak border border-black/5 rounded-sm disabled:opacity-30" disabled>
                <ChevronLeft size={16} />
              </button>
              <button className="p-2 hover:text-black transition-stak border border-black/5 rounded-sm">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string, text: string, label: string }> = {
    active: { bg: '#E0E7FF', text: '#4338CA', label: 'Awaiting Feedback' },
    approved: { bg: '#D1FAE5', text: '#059669', label: 'Approved' },
    archived: { bg: '#F3F4F6', text: '#374151', label: 'Archived' },
  };

  const item = config[status] || { bg: '#E0E7FF', text: '#4338CA', label: 'Awaiting Feedback' };

  // Matching the pill with dot style from image
  return (
    <div 
      className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none"
      style={{ backgroundColor: item.bg, color: item.text }}
    >
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.text }} />
      {item.label}
    </div>
  );
}
