import { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Onboarding } from '@/components/Onboarding';
import { MentorChat } from '@/components/MentorChat';
import { SettingsDialog } from '@/components/SettingsDialog';
import { UserProfile } from '@/types/mentor';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const { profile, updateProfile, resetProfile, isLoading } = useUserProfile();
  const [showSettings, setShowSettings] = useState(false);

  const handleOnboardingComplete = (data: Partial<UserProfile>) => {
    updateProfile(data);
  };

  const handleClearChat = () => {
    // Force re-render of chat by toggling a key
    window.location.reload();
  };

  const handleReset = () => {
    resetProfile();
    setShowSettings(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
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
