import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Portal, Round } from '../types';
import { isUUID } from '../lib/utils';

export async function getClientPortal(editorSlug: string, portalSlug: string) {
  try {
    // 1. Get editor profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', editorSlug)
      .single();
    
    if (profileError || !profile) return null;

    // 2. Get portal
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .select('*')
      .eq('editor_id', profile.id)
      .eq('slug', portalSlug)
      .single();
    
    if (portalError || !portal) return null;
    
    // Transform snake_case to camelCase
    return {
      id: portal.id,
      editorId: portal.editor_id,
      slug: portal.slug,
      title: portal.title,
      clientName: portal.client_name,
      clientEmail: portal.client_email,
      status: portal.status,
      paymentLink: portal.payment_link,
      accentColor: portal.accent_color,
      watermark: portal.watermark,
      createdAt: portal.created_at,
    } as Portal;
  } catch (error) {
    console.error('Error fetching client portal:', error);
    return null;
  }
}

export function useClientRounds(portalId: string) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!portalId || !isUUID(portalId)) return;
    
    async function fetchRounds() {
      setLoading(true);
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('portal_id', portalId)
        .order('round_number', { ascending: true });

      if (error) {
        console.error('Error fetching rounds:', error);
      } else {
        setRounds(data?.map(r => ({
          id: r.id,
          portalId: r.portal_id,
          roundNumber: r.round_number,
          title: r.title,
          videoUrl: r.video_url,
          status: r.status,
          uploadedAt: r.uploaded_at,
        } as Round)) || []);
      }
      setLoading(false);
    }

    fetchRounds();

    // Set up real-time subscription for rounds
    const subscription = supabase
      .channel(`rounds:${portalId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rounds', 
        filter: `portal_id=eq.${portalId}` 
      }, () => {
        fetchRounds();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [portalId]);

  return { rounds, loading };
}

export function useClientNotes(portalId: string) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotes() {
    if (!portalId || !isUUID(portalId)) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('revision_notes')
      .select('*')
      .eq('portal_id', portalId);

    if (error) {
      console.error('Error fetching notes:', error);
    } else {
      setNotes(data?.map(n => {
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
        };
      }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchNotes();

    const subscription = supabase
      .channel(`notes:${portalId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'revision_notes', 
        filter: `portal_id=eq.${portalId}` 
      }, () => {
        fetchNotes();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [portalId]);

  return { notes, loading, refresh: fetchNotes };
}

export async function submitRevision(portalId: string, roundId: string, note: string, timestamp?: string) {
  const { error: noteError } = await supabase
    .from('revision_notes')
    .insert({
      portal_id: portalId,
      round_id: roundId,
      note,
      timestamp_ref: timestamp || null,
    });

  if (noteError) throw noteError;

  await supabase.from('activity').insert({
    portal_id: portalId,
    event_type: 'notes_submitted',
    metadata: { round_id: roundId },
  });
}

export async function deleteNote(noteId: string) {
  const { error } = await supabase
    .from('revision_notes')
    .delete()
    .eq('id', noteId);
  
  if (error) throw error;
}
