import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Portal, Round, RevisionNote, Activity } from '../types';
import { isUUID } from '../lib/utils';

export function usePortal(portalId: string) {
  const [portal, setPortal] = useState<Portal | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [notes, setNotes] = useState<RevisionNote[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (silent = false) => {
    if (!portalId || !isUUID(portalId)) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);

    try {
      // 1. Fetch Portal
      const { data: portalData, error: portalError } = await supabase
        .from('portals')
        .select('*')
        .eq('id', portalId)
        .single();
      
      if (portalError) throw portalError;
      
      // Transform snake_case to camelCase
      setPortal({
        id: portalData.id,
        editorId: portalData.editor_id,
        slug: portalData.slug,
        title: portalData.title,
        clientName: portalData.client_name,
        clientEmail: portalData.client_email,
        lastReminderSentAt: portalData.last_reminder_sent_at,
        status: portalData.status,
        paymentLink: portalData.payment_link,
        accentColor: portalData.accent_color,
        watermark: portalData.watermark,
        createdAt: portalData.created_at,
      } as Portal);

      // 2. Fetch Rounds
      const { data: roundsData } = await supabase
        .from('rounds')
        .select('*')
        .eq('portal_id', portalId)
        .order('round_number', { ascending: true });
      
      setRounds(roundsData?.map(r => ({
        id: r.id,
        portalId: r.portal_id,
        roundNumber: r.round_number,
        title: r.title,
        videoUrl: r.video_url,
        status: r.status,
        uploadedAt: r.uploaded_at,
      } as Round)) || []);

      // 3. Fetch Notes
      const { data: notesData } = await supabase
        .from('revision_notes')
        .select('*')
        .eq('portal_id', portalId);
      
      setNotes(notesData?.map(n => {
        const isInternal = n.note.startsWith('[INTERNAL] ');
        const submittedAt = n.submitted_at || n.created_at || new Date().toISOString();
        return {
          id: n.id,
          roundId: n.round_id,
          portalId: n.portal_id,
          timestampRef: n.timestamp_ref,
          note: isInternal ? n.note.replace('[INTERNAL] ', '') : n.note,
          authorRole: isInternal ? 'editor' : 'client',
          submittedAt: submittedAt,
        } as RevisionNote;
      }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()) || []);

      // 4. Fetch Activity
      const { data: actData } = await supabase
        .from('activity')
        .select('*')
        .eq('portal_id', portalId)
        .order('created_at', { ascending: false });
      
      setActivities(actData?.map(a => ({
        id: a.id,
        portalId: a.portal_id,
        eventType: a.event_type,
        metadata: a.metadata,
        occurredAt: a.created_at,
      } as Activity)) || []);

    } catch (error) {
      console.error('Error fetching portal data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [portalId]);

  useEffect(() => {
    fetchData();

    // Real-time subscriptions
    const notesSub = supabase
      .channel(`notes:${portalId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'revision_notes', 
        filter: `portal_id=eq.${portalId}`
      }, () => {
        fetchData(true);
      })
      .subscribe();

    const activitySub = supabase
      .channel(`activity:${portalId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'activity', 
        filter: `portal_id=eq.${portalId}`
      }, () => {
        fetchData(true);
      })
      .subscribe();

    return () => {
      notesSub.unsubscribe();
      activitySub.unsubscribe();
    };
  }, [fetchData, portalId]);

  return { portal, rounds, notes, activities, loading, refreshPortal: fetchData };
}

export async function addRound(portalId: string, roundNumber: number, data: { videoUrl: string, title?: string }) {
  const { error: roundError } = await supabase
    .from('rounds')
    .insert({
      portal_id: portalId,
      round_number: roundNumber,
      title: data.title || `Round ${roundNumber}`,
      video_url: data.videoUrl,
      status: 'pending',
    });

  if (roundError) throw roundError;

  await supabase.from('activity').insert({
    portal_id: portalId,
    event_type: 'round_uploaded',
    metadata: { round_number: roundNumber },
  });
}

export async function approvePortal(portalId: string, roundId: string) {
  const { error: portalError } = await supabase
    .from('portals')
    .update({ status: 'approved' })
    .eq('id', portalId);
  
  if (portalError) throw portalError;

  const { error: roundError } = await supabase
    .from('rounds')
    .update({ status: 'approved' })
    .eq('id', roundId);
    
  if (roundError) throw roundError;

  await supabase.from('activity').insert({
    portal_id: portalId,
    event_type: 'approved',
  });
}

export async function deletePortal(portalId: string) {
  const { error } = await supabase
    .from('portals')
    .delete()
    .eq('id', portalId);
  
  if (error) throw error;
}

export async function unarchivePortal(portalId: string) {
  const { error } = await supabase
    .from('portals')
    .update({ status: 'active' })
    .eq('id', portalId);
  
  if (error) throw error;
}

export async function archivePortal(portalId: string) {
  const { error } = await supabase
    .from('portals')
    .update({ status: 'archived' })
    .eq('id', portalId);
  
  if (error) throw error;
}

export async function deleteNote(noteId: string) {
  const { data, error } = await supabase
    .from('revision_notes')
    .delete()
    .select('id')
    .eq('id', noteId);
  
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('No note was deleted');
  }
}
