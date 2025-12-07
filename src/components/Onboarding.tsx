import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserProfile, RoleModel } from '@/types/mentor';
import { ArrowRight, ArrowLeft, Sparkles, Target, Mountain, Users, Heart } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: Partial<UserProfile>) => void;
}

type Step = 'welcome' | 'name' | 'goals' | 'challenges' | 'roleModels' | 'style';

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [goals, setGoals] = useState<string[]>(['']);
  const [challenges, setChallenges] = useState<string[]>(['']);
  const [roleModels, setRoleModels] = useState<RoleModel[]>([{ name: '', reason: '' }]);
  const [style, setStyle] = useState<'direct' | 'supportive' | 'balanced'>('balanced');

  const steps: Step[] = ['welcome', 'name', 'goals', 'challenges', 'roleModels', 'style'];
  const currentIndex = steps.indexOf(step);

  const nextStep = () => {
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleComplete = () => {
    onComplete({
      name,
      goals: goals.filter(g => g.trim()),
      challenges: challenges.filter(c => c.trim()),
      roleModels: roleModels.filter(rm => rm.name.trim()),
      communicationStyle: style,
      onboardingComplete: true,
    });
  };

  const addGoal = () => setGoals([...goals, '']);
  const addChallenge = () => setChallenges([...challenges, '']);
  const addRoleModel = () => setRoleModels([...roleModels, { name: '', reason: '' }]);

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-blob-1" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-blob-2" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8 flex justify-center gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-all ${
                i <= currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="bg-glass backdrop-blur-glass border border-glass rounded-2xl p-8 animate-fade-in">
          {/* Welcome */}
          {step === 'welcome' && (
            <div className="text-center space-y-6">
              <div className="bg-gradient-primary w-20 h-20 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Welcome to Forge
              </h1>
              <p className="text-xl text-muted-foreground max-w-md mx-auto">
                I'm your personal guide to growth and success. I know the paths of every great achiever in history, and I'm here to help you forge your own.
              </p>
              <p className="text-muted-foreground">
                This is your private space. Everything shared here stays between us.
              </p>
              <Button onClick={nextStep} size="lg" className="bg-gradient-primary text-primary-foreground">
                Begin Your Journey <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Name */}
          {step === 'name' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/20 p-3 rounded-xl">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Let's get to know each other</h2>
              </div>
              <p className="text-muted-foreground">What should I call you?</p>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="text-lg h-14 bg-input border-glass"
              />
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button onClick={nextStep} disabled={!name.trim()} className="bg-gradient-primary text-primary-foreground">
                  Continue <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Goals */}
          {step === 'goals' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-secondary/20 p-3 rounded-xl">
                  <Target className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">What are you working toward?</h2>
              </div>
              <p className="text-muted-foreground">Share your goals - big or small. What do you want to achieve?</p>
              <div className="space-y-3">
                {goals.map((goal, i) => (
                  <Input
                    key={i}
                    value={goal}
                    onChange={(e) => {
                      const newGoals = [...goals];
                      newGoals[i] = e.target.value;
                      setGoals(newGoals);
                    }}
                    placeholder={`Goal ${i + 1}`}
                    className="bg-input border-glass"
                  />
                ))}
                <Button variant="outline" onClick={addGoal} className="w-full border-glass">
                  + Add another goal
                </Button>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button onClick={nextStep} className="bg-gradient-primary text-primary-foreground">
                  Continue <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Challenges */}
          {step === 'challenges' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-accent/20 p-3 rounded-xl">
                  <Mountain className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">What's standing in your way?</h2>
              </div>
              <p className="text-muted-foreground">Be honest. What challenges are you facing right now?</p>
              <div className="space-y-3">
                {challenges.map((challenge, i) => (
                  <Textarea
                    key={i}
                    value={challenge}
                    onChange={(e) => {
                      const newChallenges = [...challenges];
                      newChallenges[i] = e.target.value;
                      setChallenges(newChallenges);
                    }}
                    placeholder={`Challenge ${i + 1}`}
                    className="bg-input border-glass min-h-[80px]"
                  />
                ))}
                <Button variant="outline" onClick={addChallenge} className="w-full border-glass">
                  + Add another challenge
                </Button>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button onClick={nextStep} className="bg-gradient-primary text-primary-foreground">
                  Continue <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Role Models */}
          {step === 'roleModels' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/20 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Who inspires you?</h2>
              </div>
              <p className="text-muted-foreground">I know every successful person in history. Tell me who inspires you, and I'll share their wisdom with you.</p>
              <div className="space-y-4">
                {roleModels.map((rm, i) => (
                  <div key={i} className="space-y-2 p-4 bg-muted/30 rounded-xl">
                    <Input
                      value={rm.name}
                      onChange={(e) => {
                        const newRMs = [...roleModels];
                        newRMs[i].name = e.target.value;
                        setRoleModels(newRMs);
                      }}
                      placeholder="Name (e.g., Steve Jobs, Oprah, Marcus Aurelius)"
                      className="bg-input border-glass"
                    />
                    <Input
                      value={rm.reason}
                      onChange={(e) => {
                        const newRMs = [...roleModels];
                        newRMs[i].reason = e.target.value;
                        setRoleModels(newRMs);
                      }}
                      placeholder="Why do they inspire you?"
                      className="bg-input border-glass"
                    />
                  </div>
                ))}
                <Button variant="outline" onClick={addRoleModel} className="w-full border-glass">
                  + Add another role model
                </Button>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button onClick={nextStep} className="bg-gradient-primary text-primary-foreground">
                  Continue <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Style */}
          {step === 'style' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground text-center">How should I communicate with you?</h2>
              <p className="text-muted-foreground text-center">Choose the style that works best for you. You can change this anytime.</p>
              <div className="grid gap-4">
                {[
                  { value: 'direct', label: 'Direct & No-Nonsense', desc: 'Give it to me straight. Skip the fluff.' },
                  { value: 'supportive', label: 'Warm & Supportive', desc: 'Encourage me. Celebrate my wins.' },
                  { value: 'balanced', label: 'Balanced', desc: 'Mix of support and challenge.' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStyle(option.value as typeof style)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      style === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-glass bg-glass hover:border-primary/50'
                    }`}
                  >
                    <div className="font-semibold text-foreground">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={prevStep}>
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button onClick={handleComplete} className="bg-gradient-primary text-primary-foreground">
                  Start My Journey <Sparkles className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
