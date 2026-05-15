import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ROUTES } from '../constants';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { createPortal } from '../hooks/usePortals';
import { slugify, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function PortalNew() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    projectTitle: '',
    clientEmail: '',
    videoUrl: '',
    roundLabel: 'Round 1',
  });

  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const { profile } = useAuthStore();

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const slug = slugify(formData.projectTitle);
      const portalId = await createPortal({
        title: formData.projectTitle,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        slug: slug,
      }, {
        videoUrl: formData.videoUrl,
        title: formData.roundLabel,
      });

      if (portalId) {
        addToast('Portal created Successfully', 'success');
        navigate(ROUTES.PORTAL_DETAIL(portalId));
      }
    } catch (error) {
      console.error(error);
      addToast('Failed to create portal', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const generatedSlug = slugify(formData.projectTitle) || 'your-project-slug';

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-black flex flex-col font-sans">
      {/* Top Bar */}
      <div className="px-12 py-8 flex items-center justify-between border-b border-black/5 bg-white">
        <button 
          onClick={() => navigate(ROUTES.PORTALS)}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[#888] hover:text-black transition-stak"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className={cn("w-1.5 h-1.5 rounded-full transition-stak", step === 1 ? "bg-black" : "bg-black/10")} />
          <div className={cn("w-1.5 h-1.5 rounded-full transition-stak", step === 2 ? "bg-black" : "bg-black/10")} />
        </div>
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-24">
        <div className="max-w-[500px] w-full">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <header>
                  <h2 className="text-5xl font-serif tracking-tighter mb-4">New Project</h2>
                  <p className="text-[#888] font-medium italic">Define your project details and client access.</p>
                </header>

                <div className="space-y-10">
                  <Input 
                    label="Client Name"
                    placeholder="Who is this project for?"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  />
                  <div className="space-y-2">
                    <Input 
                      label="Project Title"
                      placeholder="e.g. Nike — Air Max 2024"
                      value={formData.projectTitle}
                      onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                    />
                    <p className="text-[10px] font-mono text-[#AAA] px-1">
                      stak.link/{profile?.slug || 'your-slug'}/<span className="text-black font-bold">{generatedSlug}</span>
                    </p>
                  </div>
                  <Input 
                    label="Client Email (Optional)"
                    placeholder="We'll notify them when rounds are shared"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  />
                </div>

                <div className="pt-6">
                  <Button 
                    className="w-full h-14" 
                    disabled={!formData.clientName || !formData.projectTitle}
                    onClick={() => setStep(2)}
                  >
                    Continue
                    <ChevronRight size={18} className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <header>
                  <h2 className="text-5xl font-serif tracking-tighter mb-4">First Round</h2>
                  <p className="text-[#888] font-medium italic">Upload your first cut to start receiving feedback.</p>
                </header>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <Input 
                      label="Video URL"
                      placeholder="Paste a YouTube, Vimeo, or direct link"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    />
                    {formData.videoUrl && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="aspect-video w-full bg-black flex flex-col items-center justify-center rounded-sm border border-black group shadow-sm transition-all"
                      >
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                           <Play size={24} className="text-white ml-1" fill="currentColor" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Video Source Detected</p>
                      </motion.div>
                    )}
                  </div>
                  <Input 
                    label="Label"
                    placeholder="e.g. Round 1 — Initial Edit"
                    value={formData.roundLabel}
                    onChange={(e) => setFormData({ ...formData, roundLabel: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="ghost" className="h-14 flex-1" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button 
                    className="h-14 flex-[2.5]" 
                    disabled={!formData.videoUrl}
                    onClick={handleCreate}
                    isLoading={isLoading}
                  >
                    Create Portal
                    <Check size={18} className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
