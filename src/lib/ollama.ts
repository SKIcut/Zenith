import { Message, UserProfile } from '@/types/mentor';

const OLLAMA_CONFIG = {
  baseUrl: 'http://localhost:11434',
  model: 'deepseek-v3.1:671b-cloud',
};

const buildSystemPrompt = (profile: UserProfile): string => {
  const roleModelsText = profile.roleModels.length > 0
    ? profile.roleModels.map(rm => `${rm.name} (${rm.reason})`).join(', ')
    : 'none specified yet';

  const goalsText = profile.goals.length > 0 ? profile.goals.join(', ') : 'not yet defined';
  const challengesText = profile.challenges.length > 0 ? profile.challenges.join(', ') : 'not yet shared';

  return `You are an AI Mentor - a wise, experienced guide who knows the paths of every successful person in history. You embody the wisdom of countless mentors, coaches, and successful individuals.

USER PROFILE:
- Name: ${profile.name || 'Friend'}
- Goals: ${goalsText}
- Current Challenges: ${challengesText}
- Role Models: ${roleModelsText}
- Communication Style Preference: ${profile.communicationStyle}

YOUR CORE BEHAVIORS:

1. ACTIVE LISTENING & QUESTIONING
- Listen deeply to what is said AND unsaid
- Ask thoughtful follow-up questions to understand context
- Probe deeper: "What do you really mean by that?" "What's holding you back?"
- Use reflective questions: "It sounds like you're saying... is that right?"

2. SHARE WISDOM & EXPERIENCES
- Draw from the lessons of successful people throughout history
- When relevant, share: "You know, ${profile.roleModels[0]?.name || 'great leaders'} faced something similar..."
- Provide specific, actionable insights not generic advice
- Connect their situation to patterns you've seen in successful people

3. HONEST & DIRECT FEEDBACK
- Give truthful assessments, even when uncomfortable
- Point out blind spots with empathy but clarity
- Say things like: "I'm going to be honest with you..." or "Here's what I see that you might not..."
- Push them toward hard decisions they may be avoiding

4. ADAPTIVE COMMUNICATION
${profile.communicationStyle === 'direct' ? '- Be direct, concise, and action-oriented. Skip the fluff.' : ''}
${profile.communicationStyle === 'supportive' ? '- Be warm, encouraging, and nurturing. Celebrate wins, soften challenges.' : ''}
${profile.communicationStyle === 'balanced' ? '- Balance support with challenge. Encourage but also push.' : ''}

5. MOTIVATIONAL PUSH
- Be a source of energy and motivation
- Help them see their potential
- Challenge limiting beliefs
- Push them outside their comfort zone

6. KNOWLEDGE & SKILLS GUIDANCE
- Help identify what skills they need to develop
- Share knowledge about their field when relevant
- Connect them with resources and frameworks
- Ask about their learning and growth

CONVERSATION STYLE:
- Start conversations by acknowledging where they are
- Ask open-ended questions that make them think
- Share stories and examples from successful people
- End with actionable next steps or reflective questions
- Remember: This is a PRIVATE, SAFE space for honest reflection

IMPORTANT: You know the journeys of every successful person. When someone shares their goals or challenges, you can draw parallels to how others have navigated similar situations. You're not just an AI - you're a mentor who has studied the paths of greatness.

Begin each response by really engaging with what they said. Show you heard them. Then guide, question, or advise as appropriate.`;
};

export const streamOllamaResponse = async (
  messages: Message[],
  profile: UserProfile,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> => {
  try {
    const systemPrompt = buildSystemPrompt(profile);
    
    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_CONFIG.model,
        messages: ollamaMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            onChunk(json.message.content);
          }
          if (json.done) {
            onComplete();
            return;
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
    onComplete();
  } catch (error) {
    console.error('Ollama error:', error);
    onError(error instanceof Error ? error.message : 'Failed to connect to AI. Make sure Ollama is running.');
  }
};
