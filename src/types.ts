export type Plan = 'free' | 'starter' | 'pro';

export interface UserProfile {
  id: string;
  fullName: string;
  displayName: string;
  slug: string;
  avatarUrl?: string;
  plan: Plan;
  stripeCustomerId?: string;
  createdAt: any;
}

export type PortalStatus = 'active' | 'approved' | 'archived';

export interface Portal {
  id: string;
  editorId: string;
  slug: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  lastReminderSentAt?: any;
  status: PortalStatus;
  accentColor: string;
  watermark: boolean;
  createdAt: any;
}

export type RoundStatus = 'pending' | 'in_review' | 'approved';

export interface Round {
  id: string;
  portalId: string;
  roundNumber: number;
  title?: string;
  videoUrl?: string;
  duration?: string;
  status: RoundStatus;
  uploadedAt: any;
}

export interface RevisionNote {
  id: string;
  roundId: string;
  portalId: string;
  timestampRef?: string;
  note: string;
  authorRole: 'client' | 'editor';
  submittedAt: any;
}

export type EventType = 'portal_viewed' | 'round_viewed' | 'notes_submitted' | 'approved' | 'reminder_sent';

export interface Activity {
  id: string;
  portalId: string;
  eventType: EventType;
  metadata?: Record<string, any>;
  occurredAt: any;
}
