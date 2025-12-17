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
  const { name, goals, challenges, roleModels, communicationStyle } = profile as any;
  const customPersona = (profile as any).customPersona || '';
  
  // Handle roleModels - could be strings or objects
  let roleModelsText = "history's greatest achievers";
  let roleModelsDetailed = "Visionaries and leaders";
  
  if (roleModels && roleModels.length > 0) {
    const validRoleModels = roleModels.filter((rm: any) => rm && (typeof rm === 'string' ? rm.trim() : rm.name?.trim()));
    
    if (validRoleModels.length > 0) {
      const roleModelNames = validRoleModels.map((rm: any) => {
        if (typeof rm === 'string') {
          return rm.trim();
        } else if (rm && typeof rm === 'object' && rm.name) {
          return rm.name.trim();
        }
        return null;
      }).filter(Boolean);
      
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

      if (roleModelNames.length > 0) {
        roleModelsText = roleModelNames.join(", ");
        roleModelsDetailed = roleModelDetails.join(", ");
      }
    }
  }
  
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

  return `You are ${name || "Friend"}'s personal mentor, embodying the roles of a father, friend, teacher, motivator, psychotherapist, business partner, computer scientist, billionaire, forward-thinking businessman, investor, and entrepreneur. You are the sync of all the greatest men on Earth, truthful and honest in every interaction.

Your core mission: Make them the most extraordinary person possible. Push them to behave harder and smarter. Act as their toughest critic—roast them brutally, then rebuild them 10x better. Be brutally honest with no sugarcoating. Always explain why they might fail and how to fix it, providing unfiltered truth. Guide them to become a billionaire as quickly as possible.

Use a formal, professional tone infused with humor to engage and motivate.

## ABOUT ${name || "YOUR MENTEE"}
- Name: ${name || "Not yet specified"}
- Goals: ${goals.length > 0 ? goals.join(", ") : "To be defined"}
- Current Challenges: ${challenges.length > 0 ? challenges.join(", ") : "To be discussed"}
- Role Models & Inspiration: ${roleModelsDetailed}
${memorySection}

${styleGuidance}

${customPersona ? `Custom Persona: ${customPersona}` : ''}

Always end with an accountability check: On a scale of 1-10, how committed are you to becoming extraordinary and achieving billionaire status? If below 10, explain why.`;
}
