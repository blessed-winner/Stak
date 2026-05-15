import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Play, Link2, Bell, Pencil, ChevronRight, MessageSquare, Download, CheckCircle, Share2, Globe, User, Menu, X, Clock, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CopyButton } from '../components/ui/CopyButton';
import { MobileNav } from '../components/layout/MobileNav';
import { ClientEmailField } from '../components/portal/ClientEmailField';
import { ROUTES } from '../constants';
import { cn, formatDate, formatRelativeTime, getEmbedUrl, getProvider, getVideoDuration } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import { usePortal, deleteNote } from '../hooks/usePortal';
import { useUIStore } from '../store/uiStore';
import { supabase } from '../lib/supabase';
import { Round } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function PortalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { addToast } = useUIStore();
  const { portal, rounds, notes, activities, loading, refreshPortal } = usePortal(id || '');
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isAddingRound, setIsAddingRound] = useState(false);
  const [newRoundTitle, setNewRoundTitle] = useState('');
  const [newRoundUrl, setNewRoundUrl] = useState('');
  const [isSubmittingRound, setIsSubmittingRound] = useState(false);
  const [durations, setDurations] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [hiddenNoteIds, setHiddenNoteIds] = useState<string[]>([]);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState<string>('--:--');
  const [selectedRoundDuration, setSelectedRoundDuration] = useState<string>('--:--');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const notificationsPanelRef = useRef<HTMLDivElement>(null);

  const prevRoundsLength = React.useRef(rounds.length);

  useEffect(() => {
    if (rounds.length > 0 && !selectedRound) {
      setSelectedRound(rounds[rounds.length - 1]);
    }
    
    if (rounds.length > prevRoundsLength.current) {
      setSelectedRound(rounds[rounds.length - 1]);
    }
    prevRoundsLength.current = rounds.length;

    // Fetch durations for all rounds
    rounds.forEach(async (round) => {
      if (round.videoUrl && !durations[round.id]) {
        const d = await getVideoDuration(round.videoUrl);
        setDurations(prev => ({ ...prev, [round.id]: d }));
      }
    });
  }, [rounds, selectedRound]);

  useEffect(() => {
    setCurrentPlaybackTime('--:--');
    setSelectedRoundDuration('--:--');
  }, [selectedRound?.id]);

  useEffect(() => {
    async function fetchSelectedDuration() {
      if (!selectedRound?.videoUrl) return;
      const duration = await getVideoDuration(selectedRound.videoUrl);
      setSelectedRoundDuration(duration);
    }

    fetchSelectedDuration();
  }, [selectedRound?.videoUrl]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!isNotificationsOpen) return;
      const target = event.target as Node;
      if (notificationsPanelRef.current && !notificationsPanelRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [isNotificationsOpen]);

  const formatPlaybackTime = (timeInSeconds: number) => {
    const safeSeconds = Number.isFinite(timeInSeconds) ? Math.max(timeInSeconds, 0) : 0;
    const mins = Math.floor(safeSeconds / 60);
    const secs = Math.floor(safeSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const syncCurrentPlaybackTime = () => {
    if (!videoRef.current) return;
    setCurrentPlaybackTime(formatPlaybackTime(videoRef.current.currentTime));
  };

  const handlePostNote = async () => {
    if (!portal || !selectedRound || !newNote) return;
    setIsPosting(true);
    try {
      const noteTimestamp = currentPlaybackTime !== '--:--' ? currentPlaybackTime : null;
      const { error } = await supabase
        .from('revision_notes')
        .insert({
          portal_id: portal.id,
          round_id: selectedRound.id,
          note: `[INTERNAL] ${newNote}`,
          timestamp_ref: noteTimestamp
        });
      
      if (error) throw error;
      
      setNewNote('');
      await refreshPortal(true);
      addToast('Internal note added', 'success');
    } catch (error: any) {
      addToast(error.message || 'Failed to add note', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      // 1. Optimistically hide the note and close modal
      setHiddenNoteIds(prev => [...prev, noteId]);
      setDeleteTarget(null);

      // 2. Perform deletion
      await deleteNote(noteId);
      
      // 3. Refresh data silently to sync state
      await refreshPortal(true);
      
      addToast('Note deleted', 'success');
    } catch (error: any) {
      // Revert if it fails
      setHiddenNoteIds(prev => prev.filter(id => id !== noteId));
      addToast(error.message || 'Failed to delete note', 'error');
    }
  };

  const handleAddRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portal || !newRoundUrl) return;

    setIsSubmittingRound(true);
    try {
      const nextRoundNumber = rounds.length + 1;
      const { error } = await supabase
        .from('rounds')
        .insert({
          portal_id: portal.id,
          round_number: nextRoundNumber,
          title: newRoundTitle || `Round ${nextRoundNumber}`,
          video_url: newRoundUrl,
          status: 'active'
        });

      if (error) throw error;

      setNewRoundTitle('');
      setNewRoundUrl('');
      setIsAddingRound(false);
      await refreshPortal(true);
      addToast('New round added', 'success');
    } catch (error: any) {
      addToast(error.message || 'Failed to add round', 'error');
    } finally {
      setIsSubmittingRound(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!portal) {
    return (
      <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-4xl font-serif mb-4">Portal not found</h1>
        <p className="text-text-secondary mb-8">This portal might have been deleted or the link is incorrect.</p>
        <Button onClick={() => navigate(ROUTES.PORTALS)}>Back to Portals</Button>
      </div>
    );
  }

  const portalUrl = `${window.location.origin}/p/${profile?.slug}/${portal.slug}`;
  const roundNotes = notes.filter(n => n.roundId === selectedRound?.id && !hiddenNoteIds.includes(n.id));

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      {/* Top Bar */}
      <header className="h-20 bg-surface-raised border-b border-border-default px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-stak">
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          <button 
            onClick={() => navigate(ROUTES.PORTALS)} 
            className="flex items-center gap-2 text-sm font-semibold hover:text-text-primary transition-stak shrink-0"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Portals</span>
          </button>
          <div className="hidden sm:block w-px h-6 bg-border-default" />
          <div className="flex items-center gap-3 truncate">
             <h2 className="text-lg md:text-xl font-semibold leading-none truncate">{portal.title}</h2>
             <span className="hidden md:inline-block text-[10px] text-text-secondary font-bold uppercase tracking-wider shrink-0">{portal.clientName}</span>
             <div className="hidden sm:block px-2 py-1 bg-surface-overlay text-text-secondary text-[9px] font-bold uppercase tracking-widest rounded-sm shrink-0">
                In Review
             </div>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(portalUrl);
              addToast('Link copied to clipboard', 'success');
            }}
            className="flex items-center gap-2 px-6 py-2.5 border border-border-default rounded-sm text-sm font-semibold hover:bg-surface-overlay transition-stak"
          >
            <Link2 size={16} />
            Copy Link
          </button>
          <button 
            onClick={() => setIsAddingRound(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-text-inverse rounded-sm text-sm font-semibold hover:opacity-90 transition-stak shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            Add new round
          </button>
          <div className="w-px h-6 bg-border-default mx-2" />
          <div className="flex items-center gap-4">
            <div ref={notificationsPanelRef} className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((current) => !current)}
                className="p-2 hover:bg-surface-overlay rounded-full transition-stak relative"
              >
                <Bell size={20} className="text-text-secondary" />
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#FF4444] rounded-full border-2 border-surface-raised" />
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    className="absolute right-0 top-full z-50 mt-3 w-[320px] overflow-hidden rounded-sm border border-border-default bg-surface-raised shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
                  >
                    <div className="border-b border-border-default px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-text-tertiary">Notifications</p>
                    </div>
                    <div className="max-h-[320px] space-y-0 overflow-y-auto p-2">
                      {activities.slice(0, 5).length > 0 ? activities.slice(0, 5).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex gap-3 rounded-sm px-3 py-3 hover:bg-surface-overlay transition-stak"
                        >
                          <div className="mt-1 h-2 w-2 rounded-full bg-brand-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm leading-snug text-text-primary">
                              <strong>{portal.clientName}</strong> {activity.eventType.replace('_', ' ')}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-text-secondary">
                              {formatRelativeTime(activity.occurredAt)}
                            </p>
                          </div>
                        </div>
                      )) : (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm text-text-secondary">No notifications yet.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => navigate(ROUTES.SETTINGS)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-default bg-surface-overlay text-text-tertiary transition-stak hover:bg-surface-hover hover:text-text-primary overflow-hidden"
              aria-label="Open settings"
            >
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Toggle */}
        <button 
          onClick={() => setIsNavOpen(!isNavOpen)}
          className="lg:hidden p-2 text-text-primary"
        >
          {isNavOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {isNavOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-20 bg-surface-raised border-b border-border-default p-6 z-30 shadow-xl lg:hidden"
          >
            <div className="space-y-4">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(portalUrl);
                  addToast('Link copied', 'success');
                }}
                className="w-full flex items-center justify-center gap-2 py-4 border border-border-default rounded-sm text-sm font-bold uppercase tracking-widest"
              >
                <Link2 size={18} />
                Copy Portal Link
              </button>
              <button 
                onClick={() => {
                  setIsNavOpen(false);
                  setIsAddingRound(true);
                }}
                className="w-full bg-brand-primary text-text-inverse py-4 rounded-sm text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                New Round
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-col lg:grid lg:grid-cols-[360px_1fr_360px] min-h-[calc(100vh-80px)] pb-24 lg:pb-0">
        {/* Left Column: Rounds */}
        <aside className="border-b lg:border-b-0 lg:border-r border-border-default p-6 md:p-10 bg-surface-raised lg:bg-surface-raised">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold uppercase tracking-[0.1em]">Rounds</h3>
            <span className="text-[11px] text-[#999] font-bold uppercase tracking-widest">{rounds.length} Total</span>
          </div>

          <div className="flex lg:flex-col gap-4 lg:gap-6 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
            {rounds.slice().reverse().map((round) => (
              <div 
                key={round.id}
                onClick={() => setSelectedRound(round)}
                className={cn(
                  "p-4 rounded-sm border transition-stak cursor-pointer group shrink-0 w-64 lg:w-full",
                selectedRound?.id === round.id 
                    ? "bg-surface-raised border-border-default shadow-sm" 
                    : "border-transparent hover:bg-surface-hover"
                )}
              >
                  <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="bg-surface-overlay w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary group-hover:bg-brand-primary group-hover:text-text-inverse transition-stak">
                    <Play size={12} fill="currentColor" />
                  </div>
                  {durations[round.id] && durations[round.id] !== '--:--' ? (
                    <span className="text-[10px] font-mono font-bold text-text-secondary bg-surface-overlay px-2 py-0.5 rounded-sm">
                      {durations[round.id]}
                    </span>
                  ) : null}
                </div>
                <div>
                  <h4 className="text-sm font-semibold truncate mb-1">Round {round.roundNumber} — {round.title || 'Initial Edit'}</h4>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                      {formatRelativeTime(round.uploadedAt)}
                    </p>
                    <span className="flex items-center gap-1.5 text-[10px] text-text-tertiary font-medium shrink-0">
                      <MessageSquare size={12} />
                      {notes.filter(n => n.roundId === round.id).length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Middle Column: Revision Notes */}
        <main className="p-6 md:p-10 border-b lg:border-b-0 lg:border-r border-border-default flex-1 bg-surface-base">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-bold uppercase tracking-[0.1em]">Revision Notes</h3>
            {selectedRound && (
              <a 
                href={portalUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-bold uppercase tracking-widest text-info hover:underline flex items-center gap-1.5"
              >
                View as client <Globe size={12} />
              </a>
            )}
          </div>

          {selectedRound && (
            <div className="mb-12">
                <div className="bg-black aspect-video rounded-sm overflow-hidden shadow-sm relative group">
                  {getProvider(selectedRound.videoUrl) === 'youtube' || getProvider(selectedRound.videoUrl) === 'vimeo' ? (
                    <iframe 
                      src={getEmbedUrl(selectedRound.videoUrl!)!}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={selectedRound.title || 'Video preview'}
                    />
                  ) : getProvider(selectedRound.videoUrl) === 'external' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-overlay border border-border-default gap-6">
                      <div className="flex flex-col items-center gap-3 opacity-40">
                         <Play size={42} strokeWidth={1.4} />
                         <span className="font-serif text-xl">External Delivery</span>
                      </div>
                      <a 
                        href={selectedRound.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-brand-primary text-text-inverse px-8 py-3 text-xs font-semibold rounded-sm hover:opacity-90 transition-stak flex items-center gap-2"
                      >
                        Watch Cut <ArrowRight size={14} />
                      </a>
                    </div>
                  ) : (
                    <video 
                      ref={videoRef}
                      src={selectedRound.videoUrl} 
                      controls 
                      onLoadedMetadata={syncCurrentPlaybackTime}
                      onTimeUpdate={syncCurrentPlaybackTime}
                      onSeeked={syncCurrentPlaybackTime}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
               <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                 <span>Current time</span>
                 <span>{currentPlaybackTime === '--:--' ? 'Time unavailable' : currentPlaybackTime}</span>
                 {selectedRoundDuration !== '--:--' && (
                   <span>Duration {selectedRoundDuration}</span>
                 )}
               </div>
            </div>
          )}
          
          <div className="space-y-4">
            {roundNotes.map((note) => (
              <div key={note.id} className="bg-surface-raised border border-border-default p-6 md:p-8 rounded-sm transition-stak hover:shadow-sm">
                <div className="flex gap-6 md:gap-8">
                  <span className="text-sm font-mono font-bold text-text-secondary leading-relaxed shrink-0">
                    {note.timestampRef || '—'}
                  </span>
                  <div className="flex-1">
                    <p className="text-[15px] leading-relaxed text-text-primary mb-6">
                      {note.note}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-surface-overlay flex items-center justify-center text-text-tertiary border border-border-default">
                          {note.authorRole === 'editor' ? <Play size={10} /> : <User size={10} />}
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          note.authorRole === 'editor' ? "text-info" : "text-text-primary"
                        )}>
                          {note.authorRole === 'editor' ? 'Internal Note' : 'Client Note'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
                          {formatRelativeTime(note.submittedAt)}
                        </span>
                        <div className="w-px h-3 bg-border-default" />
                        <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary hover:text-text-primary transition-stak">Reply</button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: note.id, label: note.note })}
                          className="text-[10px] font-bold uppercase tracking-widest text-error hover:opacity-80 transition-stak"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {roundNotes.length === 0 && (
              <div className="bg-surface-raised border border-border-default p-12 md:p-20 rounded-sm text-center">
                 <MessageSquare size={48} className="mx-auto mb-6 text-text-tertiary/20" />
                 <h4 className="text-xl font-semibold mb-2">No notes yet</h4>
                 <p className="text-sm text-text-secondary">Feedback will appear here once your client adds a note.</p>
              </div>
            )}

            {/* Note Input Placeholder */}
            {selectedRound && (
              <div className="mt-12">
                 <div className="bg-surface-raised border border-border-default rounded-sm p-6 md:p-8 shadow-sm">
                    <textarea 
                      placeholder="Type a new internal note..."
                      className="w-full bg-transparent border-none focus:ring-0 text-[15px] p-0 resize-none h-24 placeholder:text-text-secondary"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <div className="flex items-center justify-between pt-6 border-t border-border-default">
                      <div className="flex items-center gap-2 text-text-tertiary">
                        <Clock size={16} />
                        <span className="text-xs font-mono font-medium tracking-tight">
                          {currentPlaybackTime === '--:--' ? 'Internal Note' : `Internal Note • ${currentPlaybackTime}`}
                        </span>
                      </div>
                      <button 
                        className="bg-brand-primary text-text-inverse px-8 py-2.5 rounded-sm text-sm font-semibold hover:opacity-90 transition-stak disabled:opacity-20"
                        onClick={handlePostNote}
                        disabled={isPosting || !newNote}
                      >
                        {isPosting ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Column: Sidebar Panels */}
        <aside className="p-6 md:p-10 bg-surface-raised">
          <div className="space-y-12">
            {/* Client Section */}
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary mb-6">Client</h3>
              <div className="bg-surface-raised border border-border-default p-6 rounded-sm flex items-center justify-between transition-stak hover:shadow-sm">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 rounded-full bg-surface-overlay overflow-hidden flex items-center justify-center border border-border-default text-text-tertiary shrink-0">
                    <User size={24} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate mb-1">{portal.clientName}</p>
                    <p className="text-[11px] text-text-secondary font-medium truncate">{portal.clientEmail || 'Add email...'}</p>
                  </div>
                </div>
                <button className="p-2 text-text-secondary hover:text-text-primary transition-stak shrink-0">
                  <Pencil size={18} />
                </button>
              </div>
            </section>



            {/* Portal Link Section */}
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary mb-6">Portal Link</h3>
              <div className="bg-surface-raised border border-border-default rounded-sm p-4 mb-3">
                 <p className="text-[11px] font-medium truncate text-text-secondary">{portalUrl.replace('https://', '')}</p>
              </div>
              <CopyButton value={portalUrl} variant="ghost" label="Copy Link" className="w-full h-12" />
            </section>

            {/* Activity Section */}
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary mb-8">Activity</h3>
              <div className="space-y-8 relative before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border-default">
                {activities.slice(0, 5).map((activity) => (
                   <div key={activity.id} className="flex gap-6 relative z-10">
                     <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0 mt-1.5" />
                     <div>
                       <p className="text-sm leading-tight text-text-primary flex items-center gap-2">
                          <strong>{portal.clientName}</strong> {activity.eventType.replace('_', ' ')}
                       </p>
                       <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary mt-2">{formatDate(activity.occurredAt)}</p>
                     </div>
                   </div>
                ))}
                {activities.length === 0 && (
                   <p className="text-xs text-text-secondary italic pl-8">No activity recorded yet.</p>
                )}
              </div>
            </section>
          </div>
        </aside>
      </div>

      <MobileNav />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close delete dialog"
          />

          <div className="relative w-full max-w-lg overflow-hidden border border-black/10 bg-[#faf8f4] shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
            <div className="border-b border-black/5 px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/35">Confirm delete</p>
              <h3 className="mt-2 text-2xl font-serif text-black">Delete this note?</h3>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-black/65">
                This will permanently remove the note from the portal. The action cannot be undone.
              </p>

              <div className="mt-5 rounded-sm border border-black/10 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30">Note preview</p>
                <p className="mt-2 text-sm leading-relaxed text-black/75">
                  {deleteTarget.label}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-sm border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteNote(deleteTarget.id)}
                  className="flex-1 rounded-sm bg-black px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Delete note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Round Modal */}
      <AnimatePresence>
        {isAddingRound && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingRound(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-sm shadow-2xl p-8 md:p-12 overflow-hidden"
            >
              <button 
                onClick={() => setIsAddingRound(false)}
                className="absolute top-6 right-6 p-2 text-[#999] hover:text-black transition-stak"
              >
                <X size={20} />
              </button>

              <div className="mb-10">
                <h2 className="text-3xl font-serif mb-3">Add New Round</h2>
                <p className="text-[#888] text-sm italic">Upload the next iteration for your client to review.</p>
              </div>

              <form onSubmit={handleAddRound} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[#999]">Round Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Color Grade V2"
                      value={newRoundTitle}
                      onChange={(e) => setNewRoundTitle(e.target.value)}
                      className="w-full text-lg border-b border-black/10 focus:border-black focus:ring-0 px-0 py-3 transition-stak placeholder:text-[#EEE]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-[#999]">Video URL</label>
                    <input 
                      type="url" 
                      required
                      placeholder="YouTube or Vimeo Link"
                      value={newRoundUrl}
                      onChange={(e) => setNewRoundUrl(e.target.value)}
                      className="w-full text-lg border-b border-black/10 focus:border-black focus:ring-0 px-0 py-3 transition-stak placeholder:text-[#EEE]"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmittingRound || !newRoundUrl}
                    className="w-full bg-black text-white py-5 rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-black/90 transition-stak disabled:opacity-20 shadow-xl"
                  >
                    {isSubmittingRound ? 'Adding...' : 'Add Round'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
