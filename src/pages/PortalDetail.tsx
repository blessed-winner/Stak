import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Play, Link2, Bell, Pencil, ChevronRight, MessageSquare, Download, CheckCircle, Share2, Globe, User, Menu, X, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CopyButton } from '../components/ui/CopyButton';
import { MobileNav } from '../components/layout/MobileNav';
import { ClientEmailField } from '../components/portal/ClientEmailField';
import { ROUTES } from '../constants';
import { cn, formatDate, getVideoDuration, getEmbedUrl, formatRelativeTime } from '../lib/utils';
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

  const handlePostNote = async () => {
    if (!portal || !selectedRound || !newNote) return;
    setIsPosting(true);
    try {
      const { error } = await supabase
        .from('revision_notes')
        .insert({
          portal_id: portal.id,
          round_id: selectedRound.id,
          note: `[INTERNAL] ${newNote}`,
          timestamp_ref: '0:00' // Base case for internal notes
        });
      
      if (error) throw error;
      
      setNewNote('');
      await refreshPortal();
      addToast('Internal note added', 'success');
    } catch (error: any) {
      addToast(error.message || 'Failed to add note', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteNote(noteId);
      await refreshPortal();
      addToast('Note deleted', 'success');
    } catch (error: any) {
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
      await refreshPortal();
      addToast('New round added', 'success');
    } catch (error: any) {
      addToast(error.message || 'Failed to add round', 'error');
    } finally {
      setIsSubmittingRound(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!portal) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-4xl font-serif mb-4">Portal not found</h1>
        <p className="text-[#888] mb-8">This portal might have been deleted or the link is incorrect.</p>
        <Button onClick={() => navigate(ROUTES.PORTALS)}>Back to Portals</Button>
      </div>
    );
  }

  const portalUrl = `${window.location.origin}/p/${profile?.slug}/${portal.slug}`;
  const roundNotes = notes.filter(n => n.roundId === selectedRound?.id);

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-black">
      {/* Top Bar */}
      <header className="h-20 bg-white border-b border-black/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-stak">
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          <button 
            onClick={() => navigate(ROUTES.PORTALS)} 
            className="flex items-center gap-2 text-sm font-semibold hover:text-black transition-stak shrink-0"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Portals</span>
          </button>
          <div className="hidden sm:block w-px h-6 bg-black/5" />
          <div className="flex items-center gap-3 truncate">
             <h2 className="text-lg md:text-xl font-semibold leading-none truncate">{portal.title}</h2>
             <span className="hidden md:inline-block text-[10px] text-[#888] font-bold uppercase tracking-wider shrink-0">{portal.clientName}</span>
             <div className="hidden sm:block px-2 py-1 bg-black/5 text-[#888] text-[9px] font-bold uppercase tracking-widest rounded-sm shrink-0">
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
            className="flex items-center gap-2 px-6 py-2.5 border border-black/5 rounded-sm text-sm font-semibold hover:bg-black/5 transition-stak"
          >
            <Link2 size={16} />
            Copy Link
          </button>
          <button 
            onClick={() => setIsAddingRound(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-sm text-sm font-semibold hover:bg-black/90 transition-stak shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            Add new round
          </button>
          <div className="w-px h-6 bg-black/5 mx-2" />
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-black/5 rounded-full transition-stak relative">
              <Bell size={20} className="text-[#888]" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-[#FF4444] rounded-full border-2 border-white" />
            </button>
            <div className="w-9 h-9 rounded-full bg-black/5 border border-black/5 flex items-center justify-center text-[#999]">
              <User size={18} />
            </div>
          </div>
        </div>

        {/* Mobile Nav Toggle */}
        <button 
          onClick={() => setIsNavOpen(!isNavOpen)}
          className="lg:hidden p-2 text-black"
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
            className="fixed inset-x-0 top-20 bg-white border-b border-black/5 p-6 z-30 shadow-xl lg:hidden"
          >
            <div className="space-y-4">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(portalUrl);
                  addToast('Link copied', 'success');
                }}
                className="w-full flex items-center justify-center gap-2 py-4 border border-black/5 rounded-sm text-sm font-bold uppercase tracking-widest"
              >
                <Link2 size={18} />
                Copy Portal Link
              </button>
              <button 
                onClick={() => {
                  setIsNavOpen(false);
                  setIsAddingRound(true);
                }}
                className="w-full bg-black text-white py-4 rounded-sm text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2"
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
        <aside className="border-b lg:border-b-0 lg:border-r border-black/5 p-6 md:p-10 bg-white lg:bg-transparent">
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
                    ? "bg-white border-black shadow-sm" 
                    : "border-transparent hover:bg-black/[0.02]"
                )}
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="bg-black/5 w-8 h-8 rounded-full flex items-center justify-center text-[#999] group-hover:bg-black group-hover:text-white transition-stak">
                    <Play size={12} fill="currentColor" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#CCC] bg-black/5 px-2 py-0.5 rounded-sm">
                    {durations[round.id] || '--:--'}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold truncate mb-1">Round {round.roundNumber} — {round.title || 'Initial Edit'}</h4>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] text-[#999] font-bold uppercase tracking-wider">
                      {formatRelativeTime(round.uploadedAt)}
                    </p>
                    <span className="flex items-center gap-1.5 text-[10px] text-[#999] font-medium shrink-0">
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
        <main className="p-6 md:p-10 border-b lg:border-b-0 lg:border-r border-black/5 flex-1 bg-[#F8F8F8]">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-bold uppercase tracking-[0.1em]">Revision Notes</h3>
            {selectedRound && (
              <a 
                href={portalUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-bold uppercase tracking-widest text-[#4338CA] hover:underline flex items-center gap-1.5"
              >
                View as client <Globe size={12} />
              </a>
            )}
          </div>

          {selectedRound && (
            <div className="mb-12">
               <div className="bg-black aspect-video rounded-sm overflow-hidden shadow-sm relative group">
                  {getEmbedUrl(selectedRound.videoUrl)?.includes('youtube.com') || getEmbedUrl(selectedRound.videoUrl)?.includes('vimeo.com') ? (
                    <iframe 
                      src={getEmbedUrl(selectedRound.videoUrl)!}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video 
                      src={selectedRound.videoUrl} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  )}
               </div>
            </div>
          )}
          
          <div className="space-y-4">
            {roundNotes.map((note) => (
              <div key={note.id} className="bg-white border border-black/5 p-6 md:p-8 rounded-sm transition-stak hover:shadow-sm">
                <div className="flex gap-6 md:gap-8">
                  <span className="text-sm font-mono font-bold text-black/40 leading-relaxed shrink-0">
                    {note.timestampRef || '0:00'}
                  </span>
                  <div className="flex-1">
                    <p className="text-[15px] leading-relaxed text-black mb-6">
                      {note.note}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center text-[#999] border border-black/5">
                          {note.authorRole === 'editor' ? <Play size={10} /> : <User size={10} />}
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          note.authorRole === 'editor' ? "text-[#4338CA]" : "text-black"
                        )}>
                          {note.authorRole === 'editor' ? 'Internal Note' : 'Client Note'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#BBB]">
                          {formatRelativeTime(note.submittedAt)}
                        </span>
                        <div className="w-px h-3 bg-black/5" />
                        <button className="text-[10px] font-bold uppercase tracking-widest text-[#999] hover:text-black transition-stak">Reply</button>
                        <button 
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-stak"
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
              <div className="bg-white border border-black/5 p-12 md:p-20 rounded-sm text-center">
                 <MessageSquare size={48} className="mx-auto mb-6 text-black/5" />
                 <h4 className="text-xl font-semibold mb-2">No notes yet</h4>
                 <p className="text-sm text-[#888]">Feedback will appear here once your client adds a note.</p>
              </div>
            )}

            {/* Note Input Placeholder */}
            {selectedRound && (
              <div className="mt-12">
                 <div className="bg-white border border-black/5 rounded-sm p-6 md:p-8 shadow-sm">
                    <textarea 
                      placeholder="Type a new internal note..."
                      className="w-full bg-transparent border-none focus:ring-0 text-[15px] p-0 resize-none h-24 placeholder:text-[#BBB]"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <div className="flex items-center justify-between pt-6 border-t border-black/5">
                      <div className="flex items-center gap-2 text-[#999]">
                        <Clock size={16} />
                        <span className="text-xs font-mono font-medium tracking-tight">Internal Note</span>
                      </div>
                      <button 
                        className="bg-black text-white px-8 py-2.5 rounded-sm text-sm font-semibold hover:bg-black/90 transition-stak disabled:opacity-20"
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
        <aside className="p-6 md:p-10 bg-[#F2F2F2]/50">
          <div className="space-y-12">
            {/* Client Section */}
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#999] mb-6">Client</h3>
              <div className="bg-white border border-black/5 p-6 rounded-sm flex items-center justify-between transition-stak hover:shadow-sm">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 rounded-full bg-black/5 overflow-hidden flex items-center justify-center border border-black/5 text-[#999] shrink-0">
                    <User size={24} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate mb-1">{portal.clientName}</p>
                    <p className="text-[11px] text-[#888] font-medium truncate">{portal.clientEmail || 'Add email...'}</p>
                  </div>
                </div>
                <button className="p-2 text-[#CCC] hover:text-black transition-stak shrink-0">
                  <Pencil size={18} />
                </button>
              </div>
            </section>

            {/* Payment Section */}
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#999] mb-6">Payment</h3>
              <button className="w-full py-6 border border-dashed border-black/10 rounded-sm text-[#888] text-sm font-semibold flex items-center justify-center gap-2 hover:border-black/30 hover:text-black transition-stak group">
                <Plus size={18} className="text-black/20 group-hover:text-black transition-stak" />
                Add Payment Link
              </button>
            </section>

            {/* Portal Link Section */}
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#999] mb-6">Portal Link</h3>
              <div className="bg-white border border-black/5 rounded-sm p-4 mb-3">
                 <p className="text-[11px] font-medium truncate text-[#888]">{portalUrl.replace('https://', '')}</p>
              </div>
              <CopyButton value={portalUrl} variant="ghost" label="Copy Link" className="w-full h-12" />
            </section>

            {/* Activity Section */}
            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#999] mb-8">Activity</h3>
              <div className="space-y-8 relative before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[2px] before:bg-black/5">
                {activities.slice(0, 5).map((activity) => (
                   <div key={activity.id} className="flex gap-6 relative z-10">
                     <div className="w-2 h-2 rounded-full bg-black shrink-0 mt-1.5" />
                     <div>
                       <p className="text-sm leading-tight text-black flex items-center gap-2">
                          <strong>{portal.clientName}</strong> {activity.eventType.replace('_', ' ')}
                       </p>
                       <p className="text-[10px] uppercase font-bold tracking-widest text-[#999] mt-2">{formatDate(activity.occurredAt)}</p>
                     </div>
                   </div>
                ))}
                {activities.length === 0 && (
                   <p className="text-xs text-[#999] italic pl-8">No activity recorded yet.</p>
                )}
              </div>
            </section>
          </div>
        </aside>
      </div>

      <MobileNav />

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
