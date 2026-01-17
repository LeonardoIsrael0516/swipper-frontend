import { ReactNode } from 'react';
import { Header } from './Header';
import { EmailVerificationBanner } from './EmailVerificationBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  
  // Fetch app settings to check if email verification is required
  const { data: settings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      try {
        const response = await api.getSettings();
        return (response as any).data || response;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Check if banner should be shown
  const showBanner = 
    user &&
    settings &&
    settings.requireEmailVerification &&
    !user.emailVerified;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <EmailVerificationBanner />
      <main className={showBanner ? 'pt-[88px]' : 'pt-16'}>
        {children}
      </main>
    </div>
  );
}
