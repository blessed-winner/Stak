import React, { useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, ChevronUp, ExternalLink, MessageSquare, PlayCircle, Search, Upload } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import { cn } from '../lib/utils';

const quickTopics = [
  'Client approvals',
  'Export settings',
  'Billing',
  'API access',
];

const helpCards = [
  {
    icon: BookOpen,
    title: 'Help articles',
    description: 'Browse the guides for portals, review rounds, settings, and account setup.',
  },
  {
    icon: PlayCircle,
    title: 'Video tutorials',
    description: 'See short walkthroughs for creating portals, sharing reviews, and managing feedback.',
  },
  {
    icon: MessageSquare,
    title: 'Contact us',
    description: 'Send a message if you need help with your workspace, plans, or collaboration flow.',
  },
];

const faqGroups = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'How do I create my first portal?',
        answer: 'Open the Portals page, click Create Portal, add your video link, and share the generated client portal with your editor or client.',
      },
      {
        question: 'What video formats are supported?',
        answer: 'STAK supports YouTube, Vimeo, and direct video files. If the link is pasted correctly, the portal will build the player automatically.',
      },
      {
        question: 'Can I customize the branding?',
        answer: 'Yes. Use Settings to update your profile, avatar, display name, and portal slug so your workspace feels like your own.',
      },
      {
        question: 'How do I manage client permissions?',
        answer: 'Each portal can be shared independently, and the review flow keeps notes, approvals, and timestamps attached to the right project.',
      },
    ],
  },
  {
    title: 'Payments & Billing',
    items: [
      {
        question: 'What happens on the free plan?',
        answer: 'The free tier includes up to 10 portals. The Plan & Billing card in Settings shows your usage so you can see when you are getting close to the limit.',
      },
      {
        question: 'Where do I check usage?',
        answer: 'Open Settings to see the portal usage bar, current plan, and the account details tied to your workspace.',
      },
    ],
  },
  {
    title: 'Portals & Collaboration',
    items: [
      {
        question: 'How do review notes work?',
        answer: 'Clients can leave feedback against the current video time, so notes stay tied to a specific moment in the project.',
      },
      {
        question: 'Can clients approve a deliverable?',
        answer: 'Yes. Approval is handled from the client portal and updates the portal status so you can keep track of the final decision.',
      },
    ],
  },
  {
    title: 'Account Security',
    items: [
      {
        question: 'Where do I change my profile image?',
        answer: 'Go to Settings and use the avatar editor. If your database has the avatar_url field and your storage bucket is ready, uploads will persist automatically.',
      },
      {
        question: 'Can I switch themes?',
        answer: 'Yes. The theme setting in Settings lets you toggle between the light and dark modes used across the app.',
      },
    ],
  },
];

const tutorialCards = [
  {
    title: 'Workflow Masterclass',
    description: 'Optimizing your STAK portal flow from upload to approval.',
  },
  {
    title: 'Custom Branding',
    description: 'Personalizing your editor workspace and client portal experience.',
  },
];

const supportLinks = [
  'Community Forum',
  'Product Changelog',
  'System Status',
];

export default function Support() {
  const [openGroup, setOpenGroup] = useState('Getting Started');

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <Sidebar />
      <main className="px-4 py-8 md:px-8 md:py-10 lg:ml-[240px] lg:px-12 xl:px-16">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="font-serif text-4xl tracking-tight md:text-5xl">Support</h1>
              <p className="mt-2 text-sm text-text-secondary">How can we help you create today?</p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-border-default bg-surface-raised px-4 py-1.5 text-xs text-text-secondary shadow-sm">
              <span className="h-2 w-2 rounded-full bg-success" />
              All systems operational
            </div>
          </header>

          <section className="space-y-6">
            <div className="rounded-sm border border-border-default bg-surface-raised p-4 shadow-[0_12px_30px_rgba(0,0,0,0.04)] md:p-5">
              <div className="flex items-center gap-3 rounded-sm border border-border-default bg-surface-base px-4 py-3">
                <Search size={18} className="text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search for documentation, guides, or tutorials..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-text-tertiary"
                />
                <kbd className="rounded-sm border border-border-default bg-surface-overlay px-2 py-1 text-[10px] text-text-tertiary">⌘K</kbd>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-text-tertiary">
                <span className="font-semibold">Popular:</span>
                {quickTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className="rounded-full border border-border-default bg-surface-base px-3 py-1 text-[11px] tracking-normal text-text-secondary transition-stak hover:bg-surface-overlay hover:text-text-primary"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {helpCards.map((card) => (
                <article key={card.title} className="rounded-sm border border-border-default bg-surface-raised p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
                  <card.icon size={22} className="text-text-primary" />
                  <h2 className="mt-4 text-lg font-medium">{card.title}</h2>
                  <p className="mt-2 text-sm text-text-secondary">{card.description}</p>
                </article>
              ))}
            </div>

            <section className="pt-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.32em] text-text-tertiary">Frequently Asked Questions</h2>
                <span className="hidden text-xs text-text-tertiary md:inline">Support topics tailored to STAK</span>
              </div>

              <div className="space-y-3">
                {faqGroups.map((group) => {
                  const expanded = openGroup === group.title;
                  return (
                    <div key={group.title} className="overflow-hidden rounded-sm border border-border-default bg-surface-raised shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
                      <button
                        type="button"
                        onClick={() => setOpenGroup(expanded ? '' : group.title)}
                        className="flex w-full items-center justify-between px-5 py-4 text-left"
                      >
                        <span className="text-sm font-medium">{group.title}</span>
                        {expanded ? <ChevronUp size={18} className="text-text-tertiary" /> : <ChevronDown size={18} className="text-text-tertiary" />}
                      </button>

                      {expanded && (
                        <div className="border-t border-border-default px-5 pb-5">
                          <div className="space-y-5 pt-5">
                            {group.items.map((item, index) => (
                              <div key={item.question} className={cn(index !== group.items.length - 1 && 'border-b border-border-default pb-5')}>
                                <p className="text-sm font-medium text-text-primary">{item.question}</p>
                                <p className="mt-2 text-sm leading-6 text-text-secondary">{item.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="pt-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.32em] text-text-tertiary">Latest Video Tutorials</h2>
                <button type="button" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-text-secondary transition-stak hover:text-text-primary">
                  View all <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {tutorialCards.map((card, index) => (
                  <article key={card.title} className="overflow-hidden rounded-sm border border-border-default bg-surface-raised shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
                    <div className={cn('relative aspect-[16/10]', index === 0 ? 'bg-[linear-gradient(135deg,#1c2333_0%,#0f1116_50%,#2d3650_100%)]' : 'bg-[linear-gradient(135deg,#0d1118_0%,#1c1c22_40%,#d7d0c5_100%)]')}>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,255,0,0.18),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_30%)]" />
                      <div className="absolute bottom-3 right-3 rounded-sm bg-black/80 px-2 py-1 text-[10px] font-medium text-white">
                        {index === 0 ? '04:12' : '08:48'}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium">{card.title}</h3>
                      <p className="mt-1 text-sm text-text-secondary">{card.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-4 pt-4 lg:grid-cols-[1fr_280px]">
              <div className="rounded-sm border border-border-default bg-surface-raised p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)] md:p-6">
                <h2 className="text-sm font-medium">Send us a message</h2>
                <div className="mt-5 space-y-4">
                  <label className="grid gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-tertiary">Subject</span>
                    <div className="flex items-center justify-between rounded-sm border border-border-default bg-surface-base px-4 py-3">
                      <span className="text-sm text-text-secondary">Technical issue</span>
                      <ChevronDown size={16} className="text-text-tertiary" />
                    </div>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-tertiary">Message</span>
                    <textarea
                      rows={6}
                      placeholder="How can we help? Be as detailed as possible."
                      className="rounded-sm border border-border-default bg-surface-base px-4 py-3 text-sm outline-none placeholder:text-text-tertiary"
                    />
                  </label>
                  <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border-default bg-surface-base text-center text-sm text-text-secondary transition-stak hover:bg-surface-overlay">
                    <Upload size={18} className="text-text-tertiary" />
                    <span>Click to upload or drag screenshot</span>
                    <input type="file" className="hidden" />
                  </label>
                  <button type="button" className="w-full rounded-sm bg-brand-primary px-4 py-3 text-sm font-semibold text-text-inverse transition-opacity hover:opacity-90">
                    Send Support Ticket
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-sm border border-border-default bg-surface-raised p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-tertiary">Plan Context</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Support plan</span>
                      <span className="text-sm font-medium text-text-primary">Standard</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Response time</span>
                      <span className="text-sm font-medium text-text-primary">24-48 hours</span>
                    </div>
                    <p className="text-xs text-text-tertiary">Upgrade to Pro for priority support and faster turnaround on tickets.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {supportLinks.map((link) => (
                    <button
                      key={link}
                      type="button"
                      className="flex w-full items-center justify-between rounded-sm border border-border-default bg-surface-raised px-4 py-3 text-left text-sm text-text-primary shadow-[0_12px_30px_rgba(0,0,0,0.04)] transition-stak hover:bg-surface-overlay"
                    >
                      <span>{link}</span>
                      <ExternalLink size={14} className="text-text-tertiary" />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-2 overflow-hidden rounded-sm bg-surface-overlay p-6 text-text-primary shadow-[0_16px_40px_rgba(0,0,0,0.18)] md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-serif">Still need help?</h2>
                  <p className="mt-2 max-w-xl text-sm text-text-secondary">Our team is available Monday through Friday and we will help you get the right piece moving again.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="button" className="rounded-sm border border-border-default bg-transparent px-5 py-3 text-sm font-medium text-text-primary transition-stak hover:bg-surface-raised">
                    Browse all articles
                  </button>
                  <button type="button" className="rounded-sm bg-brand-primary px-5 py-3 text-sm font-semibold text-text-inverse transition-opacity hover:opacity-90">
                    Send us a message
                  </button>
                </div>
              </div>
            </section>
          </section>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
