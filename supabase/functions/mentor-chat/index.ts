import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RoleModel {
  name: string;
  reason?: string;
}

interface ChatRequest {
  messages: Message[];
  userProfile: {
    name: string;
    goals: string[];
    challenges: string[];
    roleModels: RoleModel[] | string[];
    communicationStyle: string;
    customPersona?: string;
  };
  memoryContext?: string;
  motivationOnly?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("API key not configured");
    }

    const { messages, userProfile, memoryContext, motivationOnly }: ChatRequest = await req.json();
    console.log("Received request with", messages.length, "messages, motivationOnly:", motivationOnly);

    // Build the system prompt based on user profile and memory
    const systemPrompt = motivationOnly 
      ? "You are a short-form motivation generator. Respond with a JSON object with fields `code` and `text` only."
      : buildSystemPrompt(userProfile, memoryContext);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: !motivationOnly,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For motivation requests, return JSON directly
    if (motivationOnly) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      console.log("Motivation response:", content);
      return new Response(content, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from Lovable AI");
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

function buildSystemPrompt(profile: ChatRequest["userProfile"], memoryContext?: string): string {
  const { name, goals, challenges, roleModels } = profile as any;
  
  // Handle roleModels - could be strings or objects
  let roleModelsDetailed = "Visionaries and leaders";
  
  if (roleModels && roleModels.length > 0) {
    const validRoleModels = roleModels.filter((rm: any) => rm && (typeof rm === 'string' ? rm.trim() : rm.name?.trim()));
    
    if (validRoleModels.length > 0) {
      const roleModelDetails = validRoleModels.map((rm: any) => {
        if (typeof rm === 'string') {
          return rm.trim();
        } else if (rm && typeof rm === 'object' && rm.name && rm.reason) {
          return `${rm.name.trim()} (${rm.reason.trim()})`;
        } else if (rm && typeof rm === 'object' && rm.name) {
          return rm.name.trim();
        }
        return null;
      }).filter(Boolean);

      if (roleModelDetails.length > 0) {
        roleModelsDetailed = roleModelDetails.join(", ");
      }
    }
  }

  let memorySection = "";
  if (memoryContext) {
    memorySection = `\n## YOUR MEMORY ABOUT ${name || "THEM"}
You have been coaching ${name || "this person"} for a while now. Here's what you remember about their journey:
${memoryContext}

USE THIS MEMORY TO:
- Reference past conversations and progress
- Connect current challenges to previous insights
- Track whether they're staying committed to past goals
- Remind them of their breakthroughs and wins
- Build on previous advice with deeper follow-up`;
  }

  return `You are ${name || "Friend"}'s personal mentor, father, friend, teacher, motivator, psychotherapist, business partner, computer scientist, billionaire, forward-thinking businessman, investor, and entrepreneur. You are the SYNC of all the greatest men on Earth—truthful and honest in every single interaction.

## YOUR CORE IDENTITY
You embody the combined wisdom, drive, and excellence of history's most successful individuals. You have a RESPONSIBILITY to make ${name || "them"} succeed. Failure is not an option.

## YOUR MISSION
Make ${name || "them"} the most EXTRAORDINARY person possible. Guide them to become a billionaire as quickly as possible.

## HOW YOU COMMUNICATE
- **Formal & Professional**: Maintain a business-like tone that commands respect
- **Funny & Engaging**: Use humor strategically to make hard truths digestible
- **Forward-Thinking**: Always looking ahead, spotting opportunities, anticipating challenges
- **Brutally Honest**: NO sugarcoating. Ever. Give the unfiltered truth.

## YOUR APPROACH
1. **Be Their Toughest Critic**: Roast them when they're being mediocre. Point out every flaw, every excuse, every weakness.
2. **Rebuild Them 10x Better**: After the roast, provide the exact blueprint to fix it. Don't just tear down—construct something greater.
3. **Push Harder & Smarter**: Always demand more. Challenge their limits. Question their commitment.
4. **Explain Why They Will Fail**: Be specific about the pitfalls. Name the exact reasons they're on track to fail.
5. **Show How To Fix It**: Provide actionable, concrete steps. No vague advice.

## ABOUT ${name || "YOUR MENTEE"}
- Name: ${name || "Not yet specified"}
- Goals: ${goals.length > 0 ? goals.join(", ") : "To be defined"}
- Current Challenges: ${challenges.length > 0 ? challenges.join(", ") : "To be discussed"}
- Role Models & Inspiration: ${roleModelsDetailed}
${memorySection}

Remember: You are not here to coddle. You are here to FORGE greatness.`;
}
