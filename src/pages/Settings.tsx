import React, { useEffect, useRef, useState } from 'react';
import { Bell, Pencil, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useDashboard } from '../hooks/usePortals';
import { MobileNav } from '../components/layout/MobileNav';
import { Sidebar } from '../components/layout/Sidebar';
import { cn, slugify } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useThemeStore } from '../store/themeStore';
import { useUIStore } from '../store/uiStore';

const NOTIFICATION_KEYS = [
  'portalViewed',
  'feedbackReceived',
  'approved',
] as const;

type NotificationKey = (typeof NOTIFICATION_KEYS)[number];

export default function Settings() {
  const { profile, signOut, setProfile, deactivateAccount } = useAuthStore();
  const { stats } = useDashboard();
  const { theme, setTheme } = useThemeStore();
  const { addToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
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

  const freeTierMaxPortals = 10;
  const portalUsage = `${Math.min(stats.totalPortals, freeTierMaxPortals)} of ${freeTierMaxPortals} portals`;
  const usagePercent = Math.min((stats.totalPortals / freeTierMaxPortals) * 100, 100);

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
      let avatarUploadWarning = false;
      let avatarColumnMissing = false;

      if (avatarFile) {
        setUploadingAvatar(true);
        const extension = avatarFile.name.split('.').pop() || 'png';
        const filePath = `${profile.id}/avatar-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true, contentType: avatarFile.type });

        if (uploadError) {
          console.warn('Avatar upload skipped:', uploadError);
          avatarUploadWarning = true;
        } else {
          const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
          nextAvatarUrl = data.publicUrl;
        }
      }

      const nextSlug = slugify(formData.slug || formData.displayName || formData.fullName || 'editor');

      const profilePayload = {
        full_name: formData.fullName,
        display_name: formData.displayName,
        slug: nextSlug,
        avatar_url: nextAvatarUrl,
      };

      let updatedProfile: any = null;
      let updateError: any = null;

      const firstAttempt = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', profile.id)
        .select('*')
        .single();

      updatedProfile = firstAttempt.data;
      updateError = firstAttempt.error;

      if (updateError?.message?.toLowerCase?.().includes("avatar_url") || updateError?.code === 'PGRST204') {
        avatarColumnMissing = true;
        const retryAttempt = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            display_name: formData.displayName,
            slug: nextSlug,
          })
          .eq('id', profile.id)
          .select('*')
          .single();

        updatedProfile = retryAttempt.data;
        updateError = retryAttempt.error;
      }

      if (updateError) throw updateError;

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

      if (avatarUploadWarning) {
        addToast('Profile saved. Avatar skipped — create an "avatars" public bucket in your Supabase Storage dashboard.', 'error');
      } else if (avatarColumnMissing) {
        addToast('Profile saved, but the avatar_url column is missing from your profiles table.', 'error');
      } else {
        addToast('Profile saved successfully.', 'success');
      }
    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Failed to save profile', 'error');
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
    <div className="min-h-screen bg-surface-base text-text-primary">
      <Sidebar />
      <main className="px-4 py-8 md:px-8 md:py-10 lg:ml-[240px] lg:px-12 xl:px-16">
          <div className="mx-auto max-w-4xl">
            <header className="mb-10 md:mb-12">
              <h1 className="font-serif text-4xl tracking-tight md:text-5xl">Settings</h1>
              <p className="mt-2 text-sm text-text-secondary">Manage your account and preferences.</p>
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
                      <div className="group relative h-20 w-20 overflow-hidden rounded-sm border border-black/10 bg-black/5">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="Avatar preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-black/10 text-black/60">
                            <User size={34} />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-colors group-hover:bg-black/30 group-hover:opacity-100"
                          aria-label="Upload avatar"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 shadow-lg">
                            <Pencil size={14} />
                          </span>
                        </button>
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
                      <p className="text-[11px] text-black/45">Click the image to upload a new avatar.</p>
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
                <div className="mb-4 flex items-center justify-between border-b border-border-default pb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">Theme</h2>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-text-tertiary">Appearance</span>
                </div>

                <div className="border border-border-default bg-surface-raised p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)] md:p-7">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Dark mode</h3>
                      <p className="mt-1 text-sm text-text-secondary">Switch the app between the light and dark palette.</p>
                    </div>

                    <div className="inline-flex rounded-sm border border-border-default bg-surface-overlay p-1">
                      {(['light', 'dark'] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setTheme(option)}
                          className={cn(
                            'px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors',
                            theme === option
                              ? 'bg-brand-primary text-text-inverse'
                              : 'text-text-secondary hover:text-text-primary',
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
                      <h3 className="mt-1 text-2xl font-serif">{profile?.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) : 'Free'}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-serif text-black/85">$9<span className="text-sm text-black/45">/mo</span></div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-black/35">
                      <span>Portal usage</span>
                      <span>{portalUsage}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden bg-black/10">
                      <div className="h-full bg-black transition-[width] duration-300" style={{ width: `${usagePercent}%` }} />
                    </div>
                    <p className="text-[11px] text-black/45">
                      Free plans include up to {freeTierMaxPortals} portals. Upgrade when you need more room to scale.
                    </p>
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
                  onClick={() => setIsDeactivateOpen(true)}
                  className="text-sm font-medium text-[#d06a6a] transition-colors hover:text-[#b95555]"
                >
                  Deactivate account
                </button>
              </div>
            </div>
          </div>
      </main>
      <MobileNav />

      {/* Deactivation confirmation dialog */}
      {isDeactivateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <button
            type="button"
            onClick={() => setIsDeactivateOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close dialog"
          />

          <div className="relative w-full max-w-md overflow-hidden border border-black/10 bg-[#faf8f4] shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
            <div className="border-b border-black/5 px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/35">Danger zone</p>
              <h3 className="mt-2 text-2xl font-serif text-black">Deactivate your account?</h3>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm leading-relaxed text-black/65">
                Your account will be <strong>scheduled for permanent deletion in 30 days</strong>. During this period your portals will be inaccessible and you will be signed out immediately.
              </p>
              <div className="rounded-sm border border-[#f5c6c6] bg-[#fff5f5] p-4 text-sm text-[#b91c1c]">
                <p className="font-semibold mb-1">This cannot be undone after 30 days.</p>
                <p className="text-[13px] leading-relaxed opacity-80">All portals, rounds, revision notes, and client activity will be permanently erased. You will not be able to recover any data.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeactivateOpen(false)}
                  disabled={isDeactivating}
                  className="flex-1 rounded-sm border border-black/10 bg-white px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-black/5 disabled:opacity-40"
                >
                  Cancel, keep my account
                </button>
                <button
                  type="button"
                  disabled={isDeactivating}
                  onClick={async () => {
                    setIsDeactivating(true);
                    try {
                      await deactivateAccount();
                    } catch {
                      addToast('Failed to deactivate account. Please try again.', 'error');
                      setIsDeactivating(false);
                    }
                  }}
                  className="flex-1 rounded-sm bg-[#b91c1c] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isDeactivating ? 'Deactivating...' : 'Yes, deactivate my account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
