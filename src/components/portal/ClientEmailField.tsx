import React, { useState } from 'react';
import { Mail, Edit2, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useUIStore } from '../../store/uiStore';

interface ClientEmailFieldProps {
  portalId: string;
  initialEmail?: string;
}

export function ClientEmailField({ portalId, initialEmail = '' }: ClientEmailFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [currentEmail, setCurrentEmail] = useState(initialEmail);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useUIStore();

  const handleSave = async () => {
    if (email === currentEmail) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('portals')
        .update({ client_email: email })
        .eq('id', portalId);

      if (error) throw error;

      setCurrentEmail(email);
      setIsEditing(false);
      addToast('Client email updated', 'success');
    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Failed to update email', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@email.com"
            className="h-9 min-w-0" // Ensure it fits in small container
          />
        </div>
        <div className="flex gap-1 mb-0.5">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleSave} 
            isLoading={isSaving}
            className="h-9 w-9 p-0 bg-brand-ghost text-brand-primary border-brand-primary/20"
          >
            <Check size={16} />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => {
              setEmail(currentEmail);
              setIsEditing(false);
            }}
            disabled={isSaving}
            className="h-9 w-9 p-0 bg-surface-raised border-border-default"
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="group flex items-center justify-between py-1 px-2 -mx-2 rounded-md hover:bg-surface-hover cursor-pointer transition-colors"
      onClick={() => setIsEditing(true)}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <Mail size={14} className="text-text-tertiary shrink-0" />
        <span className="text-xs text-text-primary truncate font-medium">
          {currentEmail || <span className="text-brand-primary">+ Add email</span>}
        </span>
      </div>
      <Edit2 size={12} className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
