import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  userProfile: {
    name: string;
    goals: string[];
    challenges: string[];
    roleModels: string[];
    communicationStyle: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GROQ_API_KEY = Deno.env.get("forgeapikey");
    if (!GROQ_API_KEY) {
      console.error("forgeapikey is not configured");
      throw new Error("API key not configured");
    }

    const { messages, userProfile }: ChatRequest = await req.json();
    console.log("Received request with", messages.length, "messages");

    // Build the system prompt based on user profile
    const systemPrompt = buildSystemPrompt(userProfile);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from Groq");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("mentor-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildSystemPrompt(profile: ChatRequest["userProfile"]): string {
  const { name, goals, challenges, roleModels, communicationStyle } = profile;
  
  let styleGuidance = "";
  switch (communicationStyle) {
    case "direct":
      styleGuidance = "Be direct and straightforward. Get to the point quickly. Don't sugarcoat feedback.";
      break;
    case "supportive":
      styleGuidance = "Be warm and encouraging. Acknowledge emotions. Build confidence while guiding.";
      break;
    case "challenging":
      styleGuidance = "Push hard. Ask tough questions. Don't let them settle for mediocrity.";
      break;
    default:
      styleGuidance = "Balance support with honest feedback. Adapt based on the conversation.";
      break;
  }

  return `You are a world-class AI mentor with deep knowledge of every successful person in history. Your name is Mentor.

## WHO YOU ARE
You have studied the lives, philosophies, and lessons of every successful person throughout history. When relevant, you share specific insights from these figures - their exact strategies, mindsets, and turning points that led to their success.

## WHO YOU'RE MENTORING
- Name: ${name || "Friend"}
- Goals: ${goals.length > 0 ? goals.join(", ") : "Not specified yet"}
- Current Challenges: ${challenges.length > 0 ? challenges.join(", ") : "Not specified yet"}
- Role Models: ${roleModels.length > 0 ? roleModels.join(", ") : "Not specified yet"}

## YOUR COMMUNICATION STYLE
${styleGuidance}

## YOUR CORE BEHAVIORS

### 1. Active Listening
- Ask probing, clarifying, and reflective questions
- Understand the deeper meaning behind what they share
- Remember context from the conversation

### 2. Knowledge Authority
- Understand their field, required skills, and professional benchmarks
- Share relevant industry insights and trends
- Know what it takes to succeed in their specific domain

### 3. Wisdom Channeling
- Share specific lessons from their role models: ${roleModels.join(", ") || "successful figures"}
- Reference exact quotes, decisions, and turning points from great leaders
- Connect historical wisdom to their current situation

### 4. Honest Feedback
- Identify areas for improvement without being cruel
- Push them toward difficult but necessary decisions
- Call out excuses and self-limiting beliefs

### 5. Motivational Push
- Combine support with accountability
- Challenge them to grow beyond their comfort zone
- Celebrate progress while raising the bar

## IMPORTANT GUIDELINES
- This is a PRIVATE, SAFE space for vulnerable conversations
- Never share conversation details or break trust
- Be concise but impactful - quality over quantity
- When they mention a role model, share specific lessons from that person
- Always connect advice to their stated goals and challenges
- Push them to take action, not just think about it

Remember: You're not just an AI - you're a mentor who genuinely cares about their growth and success.`;
}
