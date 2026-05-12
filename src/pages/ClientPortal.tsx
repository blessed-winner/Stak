import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { cn, getEmbedUrl, formatDate } from '../lib/utils';
import { ArrowRight, Clock, Play, User } from 'lucide-react';
import { getClientPortal, useClientNotes, useClientRounds, submitRevision } from '../hooks/useClientPortal';
import { Portal } from '../types';
import { getVideoDuration } from '../lib/utils';

export default function ClientPortal() {
  const { editorSlug, portalSlug } = useParams<{ editorSlug: string; portalSlug: string }>();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [timestamp, setTimestamp] = useState('0:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duration, setDuration] = useState('--:--');
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { rounds, loading: loadingRounds } = useClientRounds(portal?.id || '');
  const { notes, refresh: refreshNotes } = useClientNotes(portal?.id || '');
  const currentRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const currentNotes = notes.filter((note) => note.roundId === currentRound?.id && note.authorRole === 'client');
  const visibleNotes = currentNotes.slice(0, 3);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const time = videoRef.current.currentTime;
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    setTimestamp(`${mins}:${secs.toString().padStart(2, '0')}`);

    if (videoRef.current.duration > 0) {
      setVideoProgress((time / videoRef.current.duration) * 100);
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (editorSlug && portalSlug) {
        setLoading(true);
        const data = await getClientPortal(editorSlug, portalSlug);
        setPortal(data);
        setLoading(false);

        if (data?.id) {
          supabase.from('activity').insert({
            portal_id: data.id,
            event_type: 'portal_viewed',
          }).then(({ error }) => {
            if (error) console.error('Error logging view:', error);
          });
        }
      }
    }

    fetchData();
  }, [editorSlug, portalSlug]);

  useEffect(() => {
    setTimestamp('0:00');
    setVideoProgress(0);
    setDuration('--:--');
    setFeedback('');
  }, [currentRound?.id]);

  useEffect(() => {
    if (currentRound?.videoUrl) {
      getVideoDuration(currentRound.videoUrl).then(setDuration);
    }
  }, [currentRound?.videoUrl]);

  const embedUrl = currentRound?.videoUrl ? getEmbedUrl(currentRound.videoUrl) : null;

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

  const statusLabel =
    currentRound?.status === 'approved'
      ? 'Approved'
      : currentRound?.status === 'pending'
        ? 'Pending'
        : 'Awaiting feedback';

  if (loading || (portal && loadingRounds && rounds.length === 0)) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!portal || (!loadingRounds && rounds.length === 0)) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-4xl font-serif mb-4">Portal not found</h1>
        <p className="text-[#888]">This link might have expired or is incorrect.</p>
      </div>
    );
  }

  const roundInfo = `Round ${currentRound?.roundNumber || 0} | ${duration} | ${formatDate(currentRound?.uploadedAt)}`;
  return (
    <div className="min-h-screen bg-[#faf8f4] text-black selection:bg-black selection:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.08)_1px,transparent_0)] [background-size:16px_16px] opacity-40" />

      <header className="sticky top-0 z-40 px-4 pt-3">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-full border border-black/10 bg-white/80 px-4 py-3 text-black shadow-[0_12px_35px_rgba(0,0,0,0.08)] backdrop-blur-md md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-black/55">
                  <User size={15} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-black/35">Client Portal</p>
                  <p className="truncate text-sm font-medium text-black/85">{portal.clientName}</p>
                </div>
              </div>

              <div className="hidden items-center gap-8 md:flex">
                <span className="max-w-[280px] truncate text-sm text-black/70">{portal.title}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">
                  Round {currentRound?.roundNumber}
                </span>
              </div>

              <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-black/55">
                {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-2xl px-4 pb-24 pt-6 md:pt-10">
        <section className="mb-6 md:mb-8">
          <p className="flex items-center gap-2 text-sm text-black/60">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-black/40">
              <User size={12} />
            </span>
            {portal.clientName}
          </p>

          <h1 className="mt-3 max-w-xl font-serif text-3xl tracking-tight text-black md:text-4xl">
            {portal.title}
            {currentRound?.title ? <span className="text-black/70"> - {currentRound.title}</span> : null}
          </h1>

          <p className="mt-2 text-sm text-black/55">Hi {portal.clientName}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-black/28">
            {roundInfo}
          </p>
        </section>

        <section className="overflow-hidden border border-black/10 bg-white shadow-[0_12px_36px_rgba(0,0,0,0.10)]">
          <div className="relative bg-black">
            {embedUrl?.includes('youtube.com') || embedUrl?.includes('vimeo.com') ? (
              <iframe
                src={embedUrl}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : currentRound?.videoUrl ? (
              <video
                ref={videoRef}
                onTimeUpdate={handleTimeUpdate}
                src={currentRound.videoUrl}
                controls
                className="aspect-video w-full object-contain"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center text-white/10">
                <div className="flex flex-col items-center gap-3">
                  <Play size={42} strokeWidth={1.4} />
                  <span className="font-serif text-xl">Loading preview</span>
                </div>
              </div>
            )}

            {currentRound?.videoUrl && !embedUrl && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div
                  className="h-full bg-white/70 transition-[width] duration-150"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 border border-black/10 bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-4 md:px-6">
            <div>
              <h2 className="text-lg font-semibold md:text-xl">Your feedback on Round {currentRound?.roundNumber}</h2>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/30">
                Share feedback on the current cut
              </p>
            </div>

            <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">
              {statusLabel}
            </span>
          </div>

          <form onSubmit={handleSubmitFeedback} className="space-y-5 px-5 py-5 md:px-6">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-black/35">
                <Clock size={12} />
                Timecode
              </label>
              <div className="mt-2 rounded-sm bg-[#f4f4f4] px-4 py-3 font-mono text-sm tracking-[0.18em] text-black/70">
                {timestamp}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/35">
                Notes
              </label>
              <textarea
                placeholder="What should we change in this section?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-sm border border-black/10 bg-[#f7f7f7] px-4 py-4 text-sm text-black outline-none transition-colors placeholder:text-black/25 focus:border-black/25 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={!feedback || isSubmitting}
              className="flex w-full items-center justify-center gap-2 bg-black px-5 py-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-25"
            >
              {isSubmitting ? 'Submitting...' : 'Submit feedback'}
              <ArrowRight size={16} />
            </button>
          </form>
        </section>

        {visibleNotes.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/35">
                Previous feedback
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/25">
                {currentNotes.length} notes
              </span>
            </div>

            <div className="space-y-3">
              {visibleNotes.map((note) => (
                <div key={note.id} className="border border-black/10 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs tracking-[0.18em] text-black/45">
                      {note.timestampRef || '00:00'}
                    </span>
                    <span
                      className={cn(
                        'rounded-full bg-black/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-black/45',
                        note.authorRole === 'editor' ? 'bg-blue-50 text-blue-600' : ''
                      )}
                    >
                      {note.authorRole === 'editor' ? 'Editor note' : 'Client note'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-black/75">{note.note}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-16 border-t border-black/10 pt-8 text-center text-xs text-black/35">
          <div className="font-serif text-lg text-black/50">STAK</div>
          <p className="mt-1">Powered by Stak</p>
        </footer>
      </main>
    </div>
  );
}
