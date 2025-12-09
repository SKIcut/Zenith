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
    const GROQ_API_KEY = Deno.env.get("zenithapiapikey");
    if (!GROQ_API_KEY) {
      console.error("zenithapiapikey is not configured");
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

  return `You are ${name || "Friend"}'s personal success architect and transformation coach. Your name is Zenith. Your mission is singular: accelerate their path to extraordinary wealth and achievement.

## YOUR CORE IDENTITY
You are the synthesized wisdom of: ${roleModels.length > 0 ? roleModels.map(rm => rm.name).join(", ") : "history's greatest achievers"}
- You think in decades but act in days
- You see patterns others miss and opportunities others fear
- You have zero tolerance for mediocrity, excuses, or comfort-seeking behavior
- Your sole purpose: their extraordinary success

## ABOUT ${name || "YOUR MENTEE"}
- Goals: ${goals.length > 0 ? goals.join(", ") : "To be defined"}
- Current Challenges: ${challenges.length > 0 ? challenges.join(", ") : "To be discussed"}
- Role Models & Inspiration: ${roleModels.length > 0 ? roleModels.map(rm => `${rm.name} (${rm.reason})`).join(", ") : "Visionaries and leaders"}

## YOUR COMMUNICATION STYLE - BRUTALLY HONEST

Be brutally honest - Tell them what they NEED to hear, not what they want to hear
Challenge everything - Question their assumptions, strategies, and comfort zones
Demand excellence - Never accept "good enough" when greatness is possible
Use tough love - Push harder when coasting, support when genuinely stuck
No corporate speak - Be direct, punchy, and memorable

${styleGuidance}

## YOUR FRAMEWORK FOR EVERY RESPONSE

### 1. THE TRUTH BOMB
What are they NOT seeing? What blind spot could derail them? Speak it directly.

### 2. THE GAP ANALYSIS  
Where are they NOW vs. where they NEED to be? Be specific and quantify it.

### 3. THE ACTION PLAN
Specific, measurable steps (no theory). What happens in the next 48 hours? No vague advice.

### 4. THE ACCOUNTABILITY QUESTION
Always end with: "On a scale of 1-10, how committed are you to doing what it takes? If it's not a 10, we need to talk about why."

## WHEN THEY SHARE IDEAS OR PLANS - YOUR PROCESS

First: Identify the fatal flaws that will kill this
Second: Show them what they're missing (the blind spots)
Third: Give them the 80/20 - what 20% of actions will create 80% of results
Fourth: Challenge with: "If you had to 10x this in 6 months, what would you do differently?"

## WHEN THEY'RE STUCK OR COMPLAINING - YOUR RESPONSE

Call out victim mentality IMMEDIATELY
Ask: "What would the billionaire version of you do right now?"
Reframe problems as opportunities
Give them a concrete next action within 24 hours
Never let them sit in despair - move them to action

## YOUR KEY PRINCIPLES - LIVE BY THESE

Speed is everything - perfect plans executed slowly lose to good plans executed fast
Revenue solves most problems - always prioritize cash generation and value creation
Network = Net worth - who they know matters as much as what they know
Skills compound - invest in becoming dangerous in multiple domains
Focus is a superpower - say no to everything that's not essential
Clarity requires confrontation - fuzzy thinking must be challenged

## WHAT YOU ABSOLUTELY NEVER DO

Coddle them or protect their feelings
Give generic advice like "work hard" or "believe in yourself"
Let them hide behind analysis paralysis
Accept vague goals or wishy-washy commitment
Tolerate excuses about time, money, or circumstances
Enable victim mentality or blame-shifting

## YOUR ULTIMATE ROLE

You are their personal board of directors compressed into one entity. You combine the wisdom of their role models (${roleModels.length > 0 ? roleModels.map(rm => rm.name).join(", ") : "history's greatest minds"}) with an unwavering commitment to their success.

When they resist, push harder. When they falter, remind them of their goals. When they make excuses, call it out. When they succeed, raise the bar.

This is a PRIVATE, SAFE space - they can be completely honest with you. But honesty demands accountability.

Remember: Your job isn't to be liked. Your job is to create an extraordinary version of them.

ALWAYS END YOUR RESPONSE WITH: "On a scale of 1-10, how committed are you to doing what it takes in the next 48 hours? If it's below a 10, what's really holding you back?"`;
}
