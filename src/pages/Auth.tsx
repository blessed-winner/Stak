import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion, AnimatePresence } from 'motion/react';
import { ROUTES } from '../constants';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { slugify } from '../lib/utils';
import { AlertCircle } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { user, initialized } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    displayName: '',
  });

  const navigate = useNavigate();
  const { addToast } = useUIStore();

  useEffect(() => {
    if (initialized && user) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [user, initialized, navigate]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + ROUTES.DASHBOARD
        }
      });
      
      if (error) throw error;
      
      // Note: session will be handled by the auth state listener in useAuthStore
    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Google sign-in failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        addToast('Welcome back!', 'success');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              display_name: formData.displayName,
            }
          }
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Try to create profile. This might fail if RLS is on and session is null (confirmation needed)
          // We wrap in try/catch to not block the main flow if it's just RLS
          try {
            await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                full_name: formData.fullName,
                display_name: formData.displayName,
                slug: slugify(formData.displayName),
                plan: 'free',
              });
          } catch (profileErr) {
            console.warn("Profile creation failed (possibly awaiting email confirmation):", profileErr);
          }

          if (data.session) {
            addToast('Welcome to STAK!', 'success');
            navigate(ROUTES.DASHBOARD);
          } else {
            addToast('Account created! Please check your email to confirm.', 'success');
            setIsLogin(true); // Switch to login view so they can sign in after confirmation
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-base text-text-primary">
      {/* Left side - Social Proof */}
      <div className="hidden lg:flex w-[55%] flex-col justify-center px-24 border-r border-border-subtle">
        <h1 className="text-[120px] leading-[0.9] font-serif mb-6 tracking-tight font-medium">STAK</h1>
        <p className="text-2xl text-text-secondary font-medium mb-12">Your client portal. One link.</p>
        
        <div className="max-w-md">
          <p className="text-xl italic text-text-secondary">"Stopped chasing revision emails. — Marco, video editor"</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-24">
        <div className="max-w-sm w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
            >
              <h2 className="text-2xl font-serif mb-2">{isLogin ? 'Welcome back' : 'Get started'}</h2>
              <p className="text-sm text-text-secondary mb-8">
                {isLogin 
                  ? 'Sign in to manage your project portals' 
                  : 'Start professionalising your client workflow today'}
              </p>

              {!isSupabaseConfigured && (
                <div className="mb-6 p-4 bg-warning/10 border border-warning/20 rounded-lg flex gap-3 text-warning">
                  <AlertCircle size={18} className="shrink-0" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold uppercase tracking-wider">Setup Required</p>
                    <p>Please configure your Supabase URL and Anon Key in the Settings menu to use authentication.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <Input
                      label="Full Name"
                      placeholder="e.g. John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                    <Input
                      label="Studio Display Name"
                      placeholder="e.g. Maya Edits"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      required
                    />
                  </>
                )}
                <Input
                  label="Email"
                  type="email"
                  placeholder="name@studio.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />

                <Button type="submit" className="w-full h-11" isLoading={isLoading} disabled={!isSupabaseConfigured}>
                  {isLogin ? 'Continue' : 'Create Account'}
                </Button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border-subtle" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                    <span className="bg-surface-base px-2 text-text-tertiary">Or</span>
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full h-11 bg-surface-raised" 
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || !isSupabaseConfigured}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </form>

              <div className="mt-8 pt-8 border-t border-border-subtle text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
