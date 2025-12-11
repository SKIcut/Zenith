import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import { Onboarding } from '@/components/Onboarding';
import { MentorChat } from '@/components/MentorChat';
import { SettingsDialog } from '@/components/SettingsDialog';
import { UserProfile } from '@/types/mentor';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ZenithLogo } from '@/components/ZenithLogo';

const Index = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, resetProfile, isLoading: profileLoading } = useUserProfile();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const handleOnboardingComplete = (data: Partial<UserProfile>) => {
    updateProfile(data);
  };

  const handleClearChat = () => {
    window.location.reload();
  };

  const handleReset = () => {
    resetProfile();
    setShowSettings(false);
  };

  // Show auth prompt if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-background flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-foreground mb-3">Welcome to Zenith</h1>
          <p className="text-muted-foreground mb-8">
            Your AI mentor for personal growth and achievement. Sign in to access your private mentorship space.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile.onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <MentorChat
        profile={profile}
        onOpenSettings={() => setShowSettings(true)}
        onClearChat={handleClearChat}
      />
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        profile={profile}
        onUpdateProfile={updateProfile}
        onReset={handleReset}
      />
      <Toaster />
    </>
  );
};

export default Index;
