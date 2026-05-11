import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Portal } from '../types';

export function usePortals() {
  const { user } = useAuthStore();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortals = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('portals')
      .select(`
        *,
        rounds (
          video_url,
          round_number,
          uploaded_at
        ),
        activity (
          created_at
        )
      `)
      .eq('editor_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching portals:', error);
    } else {
      setPortals(data?.map(p => {
        // Get the video URL from the latest round
        const sortedRounds = (p.rounds || []).sort((a: any, b: any) => b.round_number - a.round_number);
        const latestVideoUrl = sortedRounds[0]?.video_url || '';
        
        // Find latest activity timestamp
        const activityTimestamps = [
          p.created_at,
          ...(p.rounds || []).map((r: any) => r.uploaded_at),
          ...(p.activity || []).map((a: any) => a.created_at)
        ].filter(Boolean).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        const lastUpdated = activityTimestamps[0] || p.created_at;
        
        return {
          id: p.id,
          editorId: p.editor_id,
          slug: p.slug,
          title: p.title,
          clientName: p.client_name,
          clientEmail: p.client_email,
          status: p.status,
          paymentLink: p.payment_link,
          accentColor: p.accent_color,
          watermark: p.watermark,
          createdAt: p.created_at,
          lastUpdated: lastUpdated,
          videoUrl: latestVideoUrl
        } as Portal & { videoUrl?: string, lastUpdated: string };
      }) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPortals();
  }, [fetchPortals]);

  return { portals, loading, refreshPortals: fetchPortals };
}

export function useDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>({
    portals: [],
    stats: {
      activePortals: 0,
      totalPortals: 0,
      totalViews: 0,
      recentNotes: 0,
      pendingApprovals: 0
    },
    recentActivity: [],
    loading: true
  });

  const fetchDashboard = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Fetch Portals
      const { data: portalsData, error: pError } = await supabase
        .from('portals')
        .select(`
          *,
          rounds (
            video_url,
            round_number,
            uploaded_at,
            status
          ),
          activity (
            created_at
          )
        `)
        .eq('editor_id', user.id)
        .order('created_at', { ascending: false });

      if (pError) throw pError;

      const portalIds = portalsData?.map(p => p.id) || [];

      // 2. Fetch Activity for the list
      const { data: activities, error: aError } = await supabase
        .from('activity')
        .select(`
          *,
          portals (
            title,
            slug
          )
        `)
        .in('portal_id', portalIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (aError && portalIds.length > 0) throw aError;

      // 3. Fetch Notes for stats
      const { data: notes, error: nError } = await supabase
        .from('revision_notes')
        .select('id')
        .in('portal_id', portalIds);

      if (nError && portalIds.length > 0) throw nError;

      // 4. Fetch Views for stats
      const { data: views, error: vError } = await supabase
        .from('activity')
        .select('id')
        .eq('event_type', 'portal_viewed')
        .in('portal_id', portalIds);

      if (vError && portalIds.length > 0) throw vError;

      const mappedPortals = (portalsData || []).map(p => {
        const sortedRounds = (p.rounds || []).sort((a: any, b: any) => b.round_number - a.round_number);
        const latestVideoUrl = sortedRounds[0]?.video_url || '';
        
        const activityTimestamps = [
          p.created_at,
          ...(p.rounds || []).map((r: any) => r.uploaded_at),
          ...(p.activity || []).map((a: any) => a.created_at)
        ].filter(Boolean).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        const lastUpdated = activityTimestamps[0] || p.created_at;
        
        return {
          id: p.id,
          editorId: p.editor_id,
          slug: p.slug,
          title: p.title,
          clientName: p.client_name,
          clientEmail: p.client_email,
          status: p.status,
          paymentLink: p.payment_link,
          accentColor: p.accent_color,
          watermark: p.watermark,
          createdAt: p.created_at,
          lastUpdated: lastUpdated,
          videoUrl: latestVideoUrl
        };
      });

      const allRounds = portalsData?.flatMap(p => p.rounds || []) || [];

      setData({
        portals: mappedPortals,
        stats: {
          activePortals: portalsData?.filter(p => p.status === 'active').length || 0,
          totalPortals: portalsData?.length || 0,
          totalViews: views?.length || 0,
          recentNotes: notes?.length || 0,
          pendingApprovals: allRounds.filter((r: any) => r.status === 'pending').length || 0
        },
        recentActivity: (activities || []).map((act: any) => ({
          id: act.id,
          type: act.event_type,
          portalTitle: act.portals?.title,
          timestamp: act.created_at,
          portalId: act.portal_id
        })),
        loading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { ...data, refresh: fetchDashboard };
}

export async function deletePortal(portalId: string) {
  const { error } = await supabase
    .from('portals')
    .delete()
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

export async function createPortal(data: Partial<Portal>, firstRound: { videoUrl: string, title: string }) {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Not authenticated');

  const { data: portal, error: portalError } = await supabase
    .from('portals')
    .insert({
      editor_id: user.id,
      title: data.title,
      slug: data.slug,
      client_name: data.clientName,
      client_email: data.clientEmail,
      status: 'active',
      accent_color: '#111111',
      watermark: true,
    })
    .select()
    .single();

  if (portalError) throw portalError;

  // Create first round
  const { error: roundError } = await supabase
    .from('rounds')
    .insert({
      portal_id: portal.id,
      round_number: 1,
      title: firstRound.title || 'Round 1',
      video_url: firstRound.videoUrl,
      status: 'pending',
    });

  if (roundError) throw roundError;

  // Log activity
  await supabase.from('activity').insert({
    portal_id: portal.id,
    event_type: 'portal_created',
  });

  return portal.id;
}
