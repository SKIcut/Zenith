export interface UserProfile {
  name: string;
  goals: string[];
  challenges: string[];
  roleModels: RoleModel[];
  communicationStyle: 'direct' | 'supportive' | 'balanced';
  onboardingComplete: boolean;
}

export interface RoleModel {
  name: string;
  reason: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
