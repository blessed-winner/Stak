import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { cn, getEmbedUrl, formatDate } from '../lib/utils';
import { MessageSquare, Clock, CheckCircle2, ChevronRight, Play, MoreHorizontal, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getClientPortal, useClientRounds, useClientNotes, submitRevision } from '../hooks/useClientPortal';
import { Portal, Round } from '../types';
import { getVideoDuration } from '../lib/utils';

export default function ClientPortal() {
  const { editorSlug, portalSlug } = useParams<{ editorSlug: string; portalSlug: string }>();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [timestamp, setTimestamp] = useState('0:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duration, setDuration] = useState('--:--');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleTimeUpdate = () => {
    if (videoRef.current && !feedback) {
      const time = videoRef.current.currentTime;
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      setTimestamp(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
  };

  const { rounds, loading: loadingRounds } = useClientRounds(portal?.id || '');
  const { notes, refresh: refreshNotes } = useClientNotes(portal?.id || '');
  const currentRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const currentNotes = notes.filter(n => n.roundId === currentRound?.id && n.authorRole === 'client');

  useEffect(() => {
    async function fetchData() {
      if (editorSlug && portalSlug) {
        setLoading(true);
        const data = await getClientPortal(editorSlug, portalSlug);
        setPortal(data);
        setLoading(false);
        
        // Log view activity
        if (data?.id) {
          supabase.from('activity').insert({
            portal_id: data.id,
            event_type: 'portal_viewed'
          }).then(({ error }) => {
            if (error) console.error('Error logging view:', error);
          });
        }
      }
    }
    fetchData();
  }, [editorSlug, portalSlug]);

  useEffect(() => {
    if (currentRound?.videoUrl) {
      getVideoDuration(currentRound.videoUrl).then(setDuration);
    }
  }, [currentRound]);

  const embedUrl = currentRound ? getEmbedUrl(currentRound.videoUrl) : null;

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portal || !currentRound || !feedback) return;

    setIsSubmitting(true);
    try {
      await submitRevision(portal.id, currentRound.id, feedback, timestamp);
      setFeedback('');
      await refreshNotes();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || (portal && loadingRounds && rounds.length === 0)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!portal || (!loadingRounds && rounds.length === 0)) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-4xl font-serif mb-4">Portal not found</h1>
        <p className="text-[#888]">This link might have expired or is incorrect.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-black selection:bg-black selection:text-white">
      {/* Top Header */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 md:px-10 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6 md:gap-10 min-w-0">
          <div className="text-2xl font-black italic tracking-tighter shrink-0 text-black">STAK</div>
          <div className="hidden md:block w-px h-6 bg-black/10" />
          <h1 className="text-sm md:text-lg font-serif font-medium truncate opacity-40 hover:opacity-100 transition-opacity cursor-default">
            {portal.title}
          </h1>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-8">
           <div className="flex flex-col items-end">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-black/30">Current Phase</p>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                 <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-black">Round {currentRound?.roundNumber} — In Review</span>
              </div>
           </div>
           <button className="bg-black text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black/80 transition-stak shadow-xl shadow-black/10">
             Approve session
           </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-black"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-20 bg-white border-b border-black/5 p-10 z-40 md:hidden shadow-2xl"
          >
            <div className="space-y-10">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center border border-black/10 text-black/20">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em]">{portal.clientName}</p>
                  <p className="text-[10px] text-black/40 uppercase tracking-widest">Client Portal Access</p>
                </div>
              </div>
              <div className="py-2 text-black text-[10px] font-bold uppercase tracking-[0.25em] flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
                Round {currentRound?.roundNumber} — Seeking Approval
              </div>
              <button className="w-full bg-black text-white py-5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                Approve project
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Video Container */}
      <div className="w-full bg-[#111] py-4 md:py-16 border-b border-black/5">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10">
          <div className="bg-black aspect-video rounded-xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative group ring-1 ring-white/5">
            {embedUrl?.includes('youtube.com') || embedUrl?.includes('vimeo.com') ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : currentRound?.videoUrl ? (
              <video 
                ref={videoRef}
                onTimeUpdate={handleTimeUpdate}
                src={currentRound.videoUrl} 
                controls 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/10 italic font-serif text-2xl">
                Synthesizing Asset...
              </div>
            )}
            
            <div className="absolute top-8 right-10 pointer-events-none opacity-20 hidden md:block">
              <p className="text-xs font-black italic tracking-tighter text-white">STAK STUDIO</p>
            </div>
          </div>

          {/* Editorial Label Bar */}
          <div className="mt-12 flex flex-col md:flex-row md:items-end justify-between gap-10 max-w-[1100px] mx-auto">
             <div className="flex items-center gap-12">
               <div className="space-y-3">
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Version Id</span>
                 <p className="text-2xl font-serif text-white/90">Round {currentRound?.roundNumber}</p>
               </div>
               <div className="w-px h-12 bg-white/10" />
               <div className="space-y-3">
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Total Length</span>
                 <p className="text-2xl font-mono tabular-nums text-white/90">{duration}</p>
               </div>
               <div className="hidden sm:block w-px h-12 bg-white/10" />
               <div className="hidden sm:block space-y-3">
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">Archived At</span>
                 <p className="text-2xl font-serif text-white/90">{formatDate(currentRound?.uploadedAt)}</p>
               </div>
             </div>
             
             <button className="flex items-center gap-4 text-white/30 hover:text-white transition-all group">
               <div className="p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors border border-white/5">
                  <Play size={18} fill="currentColor" className="text-inherit" />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Review Playback</span>
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 md:px-10 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-24">
          <div>
            <div className="flex items-center justify-between mb-20 border-b border-black/5 pb-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-black">
                Revision Log
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/20">
                {currentNotes.length} Entries
              </span>
            </div>

            <div className="space-y-20 pb-60">
               {currentNotes.length > 0 ? (
                 currentNotes.map((note) => (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     key={note.id} 
                     className="group"
                   >
                     <div className="flex items-baseline gap-8">
                        <span className="text-xs font-mono font-bold text-black/30 tabular-nums shrink-0 pt-1">
                          {note.timestampRef || '00:00'}
                        </span>
                        <div className="flex-1">
                           <p className="text-xl md:text-2xl leading-[1.6] text-black/80 mb-8 font-light">
                              {note.note}
                           </p>
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                <span className={cn(
                                  "text-[9px] font-bold uppercase tracking-[0.25em] px-2.5 py-1.5 bg-black/5 rounded-sm text-black/40",
                                  note.authorRole === 'editor' ? "bg-blue-50 text-blue-600" : ""
                                )}>
                                  {note.authorRole === 'editor' ? 'Editor Note' : 'Reviewer Note'}
                                </span>
                              </div>
                           </div>
                        </div>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="py-32 text-center bg-black/[0.01] rounded-xl border border-dashed border-black/5">
                    <p className="text-black/10 font-serif italic text-2xl mb-4">Silence is acceptance.</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/10">Drop your first note below</p>
                 </div>
               )}
            </div>
          </div>

          <aside className="hidden lg:block space-y-16">
            <div className="bg-white p-10 rounded-xl border border-black/5 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 mb-10">Production Manifest</h4>
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-black/[0.03] pb-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-black/20">Version</span>
                  <span className="text-sm font-serif">Round {currentRound?.roundNumber}</span>
                </div>
                <div className="flex justify-between items-center border-b border-black/[0.03] pb-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-black/20">Status</span>
                  <span className="text-sm font-serif italic text-blue-600">Review</span>
                </div>
                <div className="flex justify-between items-center border-b border-black/[0.03] pb-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-black/20">Output</span>
                  <span className="text-sm font-serif">Original Master</span>
                </div>
              </div>
            </div>

            <div className="bg-black/5 p-10 rounded-xl">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 mb-6 font-serif">Contact Studio</h4>
              <p className="text-[13px] leading-relaxed text-black/60 mb-8 font-light italic">
                For administrative requests or urgent changes, please contact your editor directly.
              </p>
              <button className="w-full py-5 bg-white border border-black/5 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] hover:bg-black hover:text-white transition-all shadow-sm">
                Request Meeting
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky Bottom Feedback Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-black/5 px-4 md:px-10 py-6 md:py-10 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1100px] mx-auto">
           <form onSubmit={handleSubmitFeedback} className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex items-center gap-6 w-full md:w-auto">
                 <div className="flex items-center gap-3 px-5 py-3.5 bg-black text-white rounded-full text-sm font-mono font-bold tabular-nums shrink-0 shadow-2xl shadow-black/20">
                   <Clock size={16} />
                   {timestamp}
                 </div>
              </div>
              
              <div className="flex-1 relative w-full group">
                <input 
                  type="text"
                  placeholder="Drop a note on this frame..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full bg-transparent border-b border-black/10 focus:border-black transition-all px-0 py-3 text-lg md:text-xl text-black placeholder:text-black/10 focus:ring-0 outline-none font-light"
                />
                <div className="absolute top-0 right-0 py-3 pointer-events-none">
                   <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/10 opacity-0 group-focus-within:opacity-100 transition-opacity">Return to post</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={!feedback || isSubmitting}
                className="w-full md:w-auto px-12 py-5 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-black/90 disabled:opacity-20 transition-all shadow-xl shadow-black/10 whitespace-nowrap"
              >
                {isSubmitting ? 'Posting...' : 'Post Revision'}
              </button>
           </form>
           <p className="hidden md:block text-[9px] font-bold uppercase tracking-[0.4em] text-black/20 mt-6 text-center font-bold">
             Frame-accurate feedback system
           </p>
        </div>
      </div>
    </div>
  );
}
