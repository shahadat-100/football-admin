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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <span className="text-3xl leading-none">⚽</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-2 text-center">
            Enter your credentials to access the Football Admin Panel
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[13px] px-4 py-3 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-foreground">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="Enter your email"
                    onFocus={() => setError(null)}
                    className={cn(
                      "w-full bg-background border border-input rounded-lg py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                      errors.email && "border-destructive focus:border-destructive focus:ring-destructive/20"
                    )}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-medium text-foreground">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    onFocus={() => setError(null)}
                    className={cn(
                      "w-full bg-background border border-input rounded-lg py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                      errors.password && "border-destructive focus:border-destructive focus:ring-destructive/20"
                    )}
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="px-6 py-4 bg-muted/50 border-t border-border flex justify-center">
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
