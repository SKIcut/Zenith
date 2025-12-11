/**
 * Intelligent Memory Extraction Service
 * Detects important insights, goals, breakthroughs, and challenges from conversations
 */

export interface ExtractedMemory {
  type: 'goal' | 'challenge' | 'breakthrough' | 'insight' | 'lesson' | 'decision';
  content: string;
  confidence: number; // 0-1
  context?: string;
}

export class MemoryExtractor {
  /**
   * Analyze conversation and extract important memories
   * @param userMessage - What the user said
   * @param assistantResponse - What Zenith said back
   * @returns Array of extracted memories
   */
  static extractMemories(userMessage: string, assistantResponse: string): ExtractedMemory[] {
    const memories: ExtractedMemory[] = [];

    // Check for new goals
    const goalPatterns = [
      /(?:my\s+)?(?:goal|aim|want|want to|objective|target|dream|vision)(?:\s+is|\s+to)?\s+([^.!?]+)/gi,
      /(?:i'm?\s+trying to|i'm?\s+planning to|i'm?\s+going to)\s+([^.!?]+)/gi,
      /(?:i\s+need to|i\s+have to)\s+([^.!?]+)/gi,
    ];

    for (const pattern of goalPatterns) {
      let match;
      while ((match = pattern.exec(userMessage)) !== null) {
        const goal = match[1].trim();
        if (goal.length > 10 && !this.isTrivial(goal)) {
          memories.push({
            type: 'goal',
            content: goal,
            confidence: 0.9,
            context: 'User explicitly stated goal',
          });
        }
      }
    }

    // Check for challenges and problems
    const challengePatterns = [
      /(?:i'm?\s+struggling with|i'm?\s+having trouble with|i'm?\s+facing|problem|challenge|issue)\s+([^.!?]+)/gi,
      /(?:i'm?\s+stuck|blocked|struggling)\s+(?:on|with)\s+([^.!?]+)/gi,
      /(?:can't|cannot|unable to)\s+([^.!?]+)/gi,
    ];

    for (const pattern of challengePatterns) {
      let match;
      while ((match = pattern.exec(userMessage)) !== null) {
        const challenge = match[1].trim();
        if (challenge.length > 10 && !this.isTrivial(challenge)) {
          memories.push({
            type: 'challenge',
            content: challenge,
            confidence: 0.85,
            context: 'User mentioned a challenge',
          });
        }
      }
    }

    // Check for breakthroughs and wins
    const breakthroughPatterns = [
      /(?:i\s+(?:finally\s+)?(?:did|completed|finished|achieved|accomplished))\s+([^.!?]+)/gi,
      /(?:i\s+(?:finally\s+)?(?:figured out|realized|understood))\s+([^.!?]+)/gi,
      /(?:breakthrough|success|won|victory)\s+([^.!?]+)/gi,
    ];

    for (const pattern of breakthroughPatterns) {
      let match;
      while ((match = pattern.exec(userMessage)) !== null) {
        const breakthrough = match[1].trim();
        if (breakthrough.length > 10 && !this.isTrivial(breakthrough)) {
          memories.push({
            type: 'breakthrough',
            content: breakthrough,
            confidence: 0.88,
            context: 'User achieved a win',
          });
        }
      }
    }

    // Check for decisions and commitments
    const decisionPatterns = [
      /(?:i\s+(?:decided|decided to|committed to|will|committed))\s+([^.!?]+)/gi,
      /(?:from now on|starting\s+(?:now|today)|i'm?\s+going to start)\s+([^.!?]+)/gi,
    ];

    for (const pattern of decisionPatterns) {
      let match;
      while ((match = pattern.exec(userMessage)) !== null) {
        const decision = match[1].trim();
        if (decision.length > 10 && !this.isTrivial(decision)) {
          memories.push({
            type: 'decision',
            content: decision,
            confidence: 0.87,
            context: 'User made a commitment',
          });
        }
      }
    }

    // Extract key insights from Zenith's response
    const insightPatterns = [
      /(?:the\s+key\s+is|remember|important|crucial|vital)\s+([^.!?]+)/gi,
      /(?:you\s+need to|you\s+must|you\s+should)\s+focus on\s+([^.!?]+)/gi,
    ];

    for (const pattern of insightPatterns) {
      let match;
      while ((match = pattern.exec(assistantResponse)) !== null) {
        const insight = match[1].trim();
        if (insight.length > 15 && !this.isTrivial(insight)) {
          memories.push({
            type: 'insight',
            content: insight,
            confidence: 0.8,
            context: 'Key insight from mentoring',
          });
        }
      }
    }

    // Filter low confidence and duplicates
    return memories
      .filter(m => m.confidence > 0.75) // Only high confidence
      .filter((m, idx, arr) => arr.findIndex(x => this.isSimilar(x.content, m.content)) === idx); // Remove duplicates
  }

  /**
   * Check if content is trivial/too generic
   */
  private static isTrivial(content: string): boolean {
    const trivia = [
      'this',
      'that',
      'it',
      'something',
      'anything',
      'everything',
      'nothing',
      'ok',
      'sure',
      'yes',
      'no',
      'a lot',
      'more',
      'less',
    ];

    const lower = content.toLowerCase();
    return (
      trivia.some(t => lower === t) ||
      lower.split(' ').length < 2 ||
      content.length < 10
    );
  }

  /**
   * Check if two memories are similar (avoid duplicates)
   */
  private static isSimilar(a: string, b: string): boolean {
    const normalize = (s: string) => s.toLowerCase().trim();
    const aWords = new Set(normalize(a).split(/\s+/));
    const bWords = new Set(normalize(b).split(/\s+/));

    const intersection = new Set([...aWords].filter(x => bWords.has(x)));
    const union = new Set([...aWords, ...bWords]);

    const similarity = intersection.size / union.size;
    return similarity > 0.7; // 70% similar
  }

  /**
   * Check if user is requesting to remember something specific
   * Phrases like "remember that", "remember this", "save this", "remember I said"
   */
  static isMemoryRequest(message: string): boolean {
    const patterns = [
      /remember\s+(?:that|this|when|how)/i,
      /save\s+(?:this|that|my)/i,
      /(?:please\s+)?remember\s+(?:me|what|i)/i,
      /(?:don't|never)\s+forget/i,
      /this\s+is\s+(?:important|critical|vital)/i,
      /make\s+(?:a\s+)?note\s+of/i,
    ];

    return patterns.some(p => p.test(message));
  }

  /**
   * Extract explicit memory request content
   */
  static extractMemoryRequest(message: string): string | null {
    // Try to find what comes after "remember"
    const match = message.match(/(?:remember|save|note)\s+(?:that|this|when|how)?\s*:?\s*(.+?)(?:\.|$|!|\?)/i);
    if (match && match[1]) {
      return match[1].trim();
    }

    // Try to find quoted content
    const quotedMatch = message.match(/["']([^"']+)["']/);
    if (quotedMatch) {
      return quotedMatch[1].trim();
    }

    return null;
  }
}
