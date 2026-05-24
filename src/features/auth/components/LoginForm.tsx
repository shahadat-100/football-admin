import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/useAuthStore';
import { loginSchema, LoginFormValues } from '../schemas';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export function LoginForm() {
  const { login, error, setError } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch (err) {
      // Error is handled by the store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] relative overflow-hidden p-4">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gray-800/40 rounded-full blur-[120px] animate-pulse"></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-popover/40 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="p-8">
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-gray-800 flex items-center justify-center shadow-lg shadow-primary/20 mb-4 rotate-3 group-hover:rotate-0 transition-transform duration-300">
                <span className="text-white text-3xl leading-none">⚽</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
              <p className="text-muted-foreground text-sm mt-2 text-center">
                Enter your credentials to access the Football Admin Panel
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[13px] px-4 py-3 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-gray-400 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="admin@football.com"
                    onFocus={() => setError(null)}
                    className={cn(
                      "w-full bg-background/50 border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
                      errors.email && "border-destructive/50 focus:border-destructive/50 focus:ring-destructive/10"
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-destructive mt-1 ml-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-gray-400 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    onFocus={() => setError(null)}
                    className={cn(
                      "w-full bg-background/50 border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
                      errors.password && "border-destructive/50 focus:border-destructive/50 focus:ring-destructive/10"
                    )}
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive mt-1 ml-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="px-8 py-4 bg-muted/30 border-t border-border/50 flex justify-center">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Secure Administrative Access
            </span>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[12px] text-muted-foreground">
          &copy; {new Date().getFullYear()} Football Admin Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  );
}
