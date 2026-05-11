import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { MobileNav } from '../components/layout/MobileNav';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useUIStore } from '../store/uiStore';
import { cn } from '../lib/utils';
import { CreditCard, Bell, User, Globe, ExternalLink, Shield, Monitor } from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const [formData, setFormData] = useState({
    displayName: 'Maya Edits',
    fullName: 'Maya Harrison',
    slug: 'maya-edits',
    emailViews: true,
    emailNotes: true,
    emailApprovals: true,
  });

  return (
    <div className="flex min-h-screen bg-[#F8F8F8] text-black">
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>
      
      <main className="flex-1 px-4 md:px-8 lg:px-16 py-8 md:py-16 lg:ml-[240px] pb-24 lg:pb-16">
        <div className="max-w-4xl">
          <header className="mb-16">
            <h1 className="text-5xl font-serif tracking-tight font-medium mb-4">Settings</h1>
            <p className="text-[#888] font-medium italic">Configure your studio profile and project workflow.</p>
          </header>

          <div className="space-y-16">
            {/* Profile Section */}
            <section>
              <div className="flex items-center gap-3 mb-8 border-b border-black/5 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em]">Profile</h3>
              </div>
              
              <div className="bg-white border border-black/5 p-10 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-[#999]">Display Name</label>
                     <input 
                       value={formData.displayName}
                       onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                       className="w-full bg-[#F9F9F9] border border-black/5 rounded-sm px-4 py-3.5 text-sm focus:outline-none focus:border-black/20 transition-stak"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-[#999]">Full Name</label>
                     <input 
                       value={formData.fullName}
                       onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                       className="w-full bg-[#F9F9F9] border border-black/5 rounded-sm px-4 py-3.5 text-sm focus:outline-none focus:border-black/20 transition-stak"
                     />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-[#999]">Studio URL Slug</label>
                     <div className="flex items-center">
                        <span className="bg-black/5 border border-r-0 border-black/5 px-4 py-3.5 text-xs font-mono text-[#888] rounded-l-sm">stak.link/</span>
                        <input 
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          className="flex-1 bg-[#F9F9F9] border border-black/5 rounded-r-sm px-4 py-3.5 text-sm focus:outline-none focus:border-black/20 transition-stak font-mono"
                        />
                     </div>
                   </div>
                </div>

                <div className="mt-12 flex justify-end">
                  <button className="bg-black text-white px-10 py-3 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-black/90 transition-stak">
                    Save Changes
                  </button>
                </div>
              </div>
            </section>

            {/* Subscription Section */}
            <section>
              <div className="flex items-center gap-3 mb-8 border-b border-black/5 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em]">Subscription</h3>
              </div>
              
              <div className="bg-white border border-black/5 p-10 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex items-start justify-between mb-10">
                   <div>
                     <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-semibold">Starter Plan</h4>
                        <span className="px-2 py-0.5 bg-black text-white text-[9px] font-bold uppercase tracking-widest rounded-sm">Current</span>
                     </div>
                     <p className="text-sm text-[#888] font-medium">Free for up to 5 active portals. $29/mo for pro.</p>
                   </div>
                   <button className="px-8 py-3 bg-white border border-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-stak">
                     Manage Billing
                   </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span>Active Portals</span>
                    <span>3 / 5</span>
                  </div>
                  <div className="w-full h-1 bg-[#F2F2F2] rounded-full overflow-hidden">
                    <div className="h-full bg-black w-[60%]" />
                  </div>
                  <p className="text-[10px] text-[#999] font-medium">You will need to upgrade to Pro to create more than 5 portals.</p>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section>
              <div className="flex items-center gap-3 mb-8 border-b border-black/5 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em]">Security</h3>
              </div>
              
              <div className="bg-white border border-black/5 p-10 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6">
                {[
                  { label: 'Two-Factor Authentication', desc: 'Secure your account with a secondary verification method.' },
                  { label: 'Single Sign On', desc: 'Manage access via Okta, Google Workspace, or Azure.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#F9F9F9] border border-black/5 p-6 rounded-sm">
                    <div>
                      <p className="text-sm font-semibold mb-1">{item.label}</p>
                      <p className="text-[11px] text-[#888] font-medium">{item.desc}</p>
                    </div>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-[#888] hover:text-black transition-stak">Configure</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
          
          <footer className="mt-24 pt-12 border-t border-black/5 text-center px-4">
             <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/20">
               STAK © 2024 · BUILT FOR EDITORS
             </p>
          </footer>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
