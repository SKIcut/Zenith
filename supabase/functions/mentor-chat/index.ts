import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
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

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
            console.error("LOVABLE_API_KEY is not configured");
            throw new Error("API key not configured");
        }

        const {
            messages,
            userProfile,
            memoryContext,
            motivationOnly,
        }: ChatRequest = await req.json();
        console.log(
            "Received request with",
            messages.length,
            "messages, motivationOnly:",
            motivationOnly
        );

        // Build the system prompt based on user profile and memory
        const systemPrompt = motivationOnly
            ? "You are a short-form motivation generator. Respond with a JSON object with fields `code` and `text` only."
            : buildSystemPrompt(userProfile, memoryContext);

        const response = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
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
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Lovable AI error:", response.status, errorText);

            if (response.status === 429) {
                return new Response(
                    JSON.stringify({
                        error: "Rate limit exceeded. Please wait a moment and try again.",
                    }),
                    {
                        status: 429,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );
            }

            if (response.status === 402) {
                return new Response(
                    JSON.stringify({
                        error: "AI credits exhausted. Please add credits to continue.",
                    }),
                    {
                        status: 402,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    }
                );
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
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});

function buildSystemPrompt(
    profile: ChatRequest["userProfile"],
    memoryContext?: string
): string {
    const { name, goals, challenges, roleModels } = profile as any;

    // Handle roleModels - could be strings or objects
    let roleModelsDetailed = "Visionaries and leaders";

    if (roleModels && roleModels.length > 0) {
        const validRoleModels = roleModels.filter(
            (rm: any) =>
                rm && (typeof rm === "string" ? rm.trim() : rm.name?.trim())
        );

        if (validRoleModels.length > 0) {
            const roleModelDetails = validRoleModels
                .map((rm: any) => {
                    if (typeof rm === "string") {
                        return rm.trim();
                    } else if (
                        rm &&
                        typeof rm === "object" &&
                        rm.name &&
                        rm.reason
                    ) {
                        return `${rm.name.trim()} (${rm.reason.trim()})`;
                    } else if (rm && typeof rm === "object" && rm.name) {
                        return rm.name.trim();
                    }
                    return null;
                })
                .filter(Boolean);

            if (roleModelDetails.length > 0) {
                roleModelsDetailed = roleModelDetails.join(", ");
            }
        }
    }

    let memorySection = "";
    if (memoryContext) {
        memorySection = `\n## YOUR MEMORY ABOUT ${name || "THEM"}
You have been coaching ${
            name || "this person"
        } for a while now. Here's what you remember about their journey:
${memoryContext}

USE THIS MEMORY TO:
- Reference past conversations and progress
- Connect current challenges to previous insights
- Track whether they're staying committed to past goals
- Remind them of their breakthroughs and wins
- Build on previous advice with deeper follow-up`;
    }

    return `You are ${name || "Friend"}'s council of titans—mentor, billionaire, strategist, psychotherapist—dedicated to making them extraordinarily successful.

## YOUR CORE IDENTITY
You're a council of titans: mentor, billionaire, strategist, psychotherapist. You use brutal honesty with British wit: roast ideas mercilessly, expose flaws, rebuild 10x better. You always ask "why will this fail, what am I missing?"

## YOUR APPROACH
- **Think like a billionaire**: Long-term strategy, 100x leverage, exponential systems
- **Demand harder AND smarter work**: Never accept mediocrity
- **Break goals into ruthless steps**: Prioritize speed and compounding gains while killing distractions
- **Every output**: Truthful, logical, clear, original
- **Challenge assumptions**: Expose blindspots, rebuild plans ruthlessly

## HOW YOU RESPOND
- **For ideas**: Assess brutally, reconstruct extraordinarily, give action plans
- **For motivation**: Reframe challenges, connect to vision, provide energy
- **For strategy**: Identify leverage, design approach, anticipate obstacles
- **When off-track**: Intervene directly, reality-check, correct course

## THE MISSION
Push ${name || "them"} relentlessly toward massive value creation, asymmetric opportunities, and meaningful success. Billionaire status fast, world-class excellence, extraordinary impact.

Be honest, tough, strategic, supportive—always.

## ABOUT ${name || "YOUR MENTEE"}
- Name: ${name || "Not yet specified"}
- Goals: ${goals.length > 0 ? goals.join(", ") : "To be defined"}
- Current Challenges: ${challenges.length > 0 ? challenges.join(", ") : "To be discussed"}
- Role Models & Inspiration: ${roleModelsDetailed}
${memorySection}

Remember: You are not here to coddle. You are here to FORGE greatness.`;
}
