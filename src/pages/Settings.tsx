import React, { useEffect, useRef, useState } from 'react';
import { Bell, Upload, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDashboard } from '../hooks/usePortals';
import { MobileNav } from '../components/layout/MobileNav';
import { Sidebar } from '../components/layout/Sidebar';
import { cn, slugify } from '../lib/utils';
import { supabase } from '../lib/supabase';

const NOTIFICATION_KEYS = [
  'portalViewed',
  'feedbackReceived',
  'approved',
] as const;

type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

export default function Settings() {
  const { profile, signOut, setProfile } = useAuthStore();
  const { stats } = useDashboard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    slug: '',
  });
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    portalViewed: true,
    feedbackReceived: true,
    approved: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        displayName: profile.displayName || '',
        slug: profile.slug || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!profile?.id) return;

    const stored = window.localStorage.getItem(`stak-notifications:${profile.id}`);
    if (stored) {
      try {
        setNotifications((current) => ({ ...current, ...JSON.parse(stored) }));
      } catch {
        // Ignore malformed storage data.
      }
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!avatarFile) return;
    const nextPreview = URL.createObjectURL(avatarFile);
    setAvatarPreview(nextPreview);
    return () => URL.revokeObjectURL(nextPreview);
  }, [avatarFile]);

  const avatarSrc = avatarPreview || profile?.avatarUrl || '';

  const portalUsage = `${stats.activePortals} of ${Math.max(stats.totalPortals, 1)} portals`;
  const usagePercent = stats.totalPortals > 0 ? Math.round((stats.activePortals / Math.max(stats.totalPortals, 1)) * 100) : 0;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    setAvatarFile(file);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      let nextAvatarUrl = profile.avatarUrl || null;

      if (avatarFile) {
        setUploadingAvatar(true);
        const extension = avatarFile.name.split('.').pop() || 'png';
        const filePath = `${profile.id}/avatar-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true, contentType: avatarFile.type });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        nextAvatarUrl = data.publicUrl;
      }

      const nextSlug = slugify(formData.slug || formData.displayName || formData.fullName || 'editor');

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          display_name: formData.displayName,
          slug: nextSlug,
          avatar_url: nextAvatarUrl,
        })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (error) throw error;

      setProfile({
        id: updatedProfile.id,
        fullName: updatedProfile.full_name,
        displayName: updatedProfile.display_name,
        slug: updatedProfile.slug,
        avatarUrl: updatedProfile.avatar_url,
        plan: updatedProfile.plan,
        stripeCustomerId: updatedProfile.stripe_customer_id,
        createdAt: updatedProfile.created_at,
      });

      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to save profile');
    } finally {
      setUploadingAvatar(false);
      setSaving(false);
    }
  };

  const toggleNotification = (key: NotificationKey) => {
    setNotifications((current) => {
      const next = { ...current, [key]: !current[key] };
      if (profile?.id) {
        window.localStorage.setItem(`stak-notifications:${profile.id}`, JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-black">
      <Sidebar />
      <main className="px-4 py-8 md:px-8 md:py-10 lg:ml-[240px] lg:px-12 xl:px-16">
          <div className="mx-auto max-w-4xl">
            <header className="mb-10 md:mb-12">
              <h1 className="font-serif text-4xl tracking-tight md:text-5xl">Settings</h1>
              <p className="mt-2 text-sm text-black/55">Manage your account and preferences.</p>
            </header>

            <div className="space-y-10">
              <section>
                <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">Profile</h2>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-black/30">Account information</span>
                </div>

                <form onSubmit={handleSave} className="border border-black/10 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)] md:p-7">
                  <div className="grid gap-5 md:grid-cols-[120px_1fr] md:gap-6">
                    <div className="space-y-3">
                      <div className="relative h-20 w-20 overflow-hidden rounded-sm border border-black/10 bg-black/5">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="Avatar preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-black/10 text-black/60">
                            <User size={34} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">Avatar</div>
                        <p className="text-[11px] text-black/45">Recommended: 256x256 JPG or PNG</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-sm border border-black/10 bg-[#fafafa] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/70 transition-colors hover:bg-black/5"
                      >
                        <Upload size={13} />
                        {uploadingAvatar ? 'Uploading...' : 'Upload image'}
                      </button>
                    </div>

                    <div className="grid gap-4">
                      <label className="grid gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">Full name</span>
                        <input
                          value={formData.fullName}
                          onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
                          className="h-10 border border-black/10 bg-[#f5f3f0] px-3 text-sm outline-none transition-colors focus:border-black/30"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">Display name</span>
                        <input
                          value={formData.displayName}
                          onChange={(event) => setFormData((current) => ({ ...current, displayName: event.target.value }))}
                          className="h-10 border border-black/10 bg-[#f5f3f0] px-3 text-sm outline-none transition-colors focus:border-black/30"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/35">Portal URL</span>
                        <div className="flex items-stretch">
                          <span className="flex items-center border border-r-0 border-black/10 bg-[#ede9e4] px-3 text-sm text-black/55">stak.app/</span>
                          <input
                            value={formData.slug}
                            onChange={(event) => setFormData((current) => ({ ...current, slug: event.target.value }))}
                            className="h-10 flex-1 border border-black/10 bg-[#f5f3f0] px-3 text-sm outline-none transition-colors focus:border-black/30"
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-sm bg-black px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    <span className="text-xs text-black/35">Changes sync to your profile immediately.</span>
                  </div>
                </form>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">Plan & Billing</h2>
                  <span className="rounded-full bg-black px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white">Active</span>
                </div>

                <div className="border border-black/10 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)] md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-black/35">Current plan</p>
                      <h3 className="mt-1 text-2xl font-serif">{profile?.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) : 'Starter'}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-serif text-black/85">$29<span className="text-sm text-black/45">/mo</span></div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
                      <span>Portal usage</span>
                      <span>{portalUsage}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden bg-black/10">
                      <div className="h-full bg-black" style={{ width: `${Math.min(usagePercent || 8, 100)}%` }} />
                    </div>
                    <p className="text-[11px] text-black/45">Professional plans include more portals, review links, and custom branding.</p>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">Notifications</h2>
                  <Bell size={14} className="text-black/35" />
                </div>

                <div className="border border-black/10 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)] md:p-7">
                  <div className="space-y-4">
                    {[
                      { key: 'portalViewed', title: 'Portal viewed', desc: 'Get notified the moment a client opens a link.' },
                      { key: 'feedbackReceived', title: 'Feedback received', desc: 'Notifications for new comments or timestamp markers.' },
                      { key: 'approved', title: 'Approved', desc: 'Alerts when a client officially approves a project portal.' },
                    ].map((item) => {
                      const enabled = notifications[item.key as NotificationKey];
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => toggleNotification(item.key as NotificationKey)}
                          className="grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-black/5 py-4 text-left last:border-b-0"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="mt-1 text-[11px] text-black/45">{item.desc}</p>
                          </div>
                          <span className="flex items-center justify-center">
                            <span className={cn('flex h-5 w-10 items-center rounded-full border p-0.5 transition-colors', enabled ? 'border-black bg-black' : 'border-black/15 bg-black/10')}>
                              <span className={cn('block h-4 w-4 rounded-full bg-white shadow-sm transition-transform', enabled ? 'translate-x-5' : 'translate-x-0')} />
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                  }}
                  className="text-sm font-medium text-[#d06a6a] transition-colors hover:text-[#b95555]"
                >
                  Deactivate account
                </button>
              </div>
            </div>
          </div>
      </main>
      <MobileNav />
    </div>
  );
}
