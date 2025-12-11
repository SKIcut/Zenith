import { supabase } from "@/integrations/supabase/client";
import { Message, UserProfile } from "@/types/mentor";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`;

export async function streamMentorResponse(
  messages: Message[],
  userProfile: UserProfile,
  onDelta: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  memoryContext?: string
): Promise<void> {
  try {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        userProfile: {
          name: userProfile.name,
          goals: userProfile.goals,
          challenges: userProfile.challenges,
          roleModels: userProfile.roleModels,
          communicationStyle: userProfile.communicationStyle,
        },
        memoryContext: memoryContext,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        onError("Rate limit exceeded. Please wait a moment and try again.");
        return;
      }
      onError(errorData.error || "Failed to get response from mentor");
      return;
    }

    if (!response.body) {
      onError("No response body received");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process SSE events line by line
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onDelta(content);
          }
        } catch {
          // Incomplete JSON, put it back and wait for more data
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    // Final flush
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          /* ignore partial leftovers */
        }
      }
    }

    onDone();
  } catch (error) {
    console.error("Stream error:", error);
    onError(error instanceof Error ? error.message : "Connection failed");
  }
}

export async function fetchMotivation(userProfile: UserProfile): Promise<{ code: string; text: string } | null> {
  try {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a short-form motivation generator. Respond with a JSON object with fields `code` and `text` only.' },
          { role: 'user', content: 'Provide a short motivation code and a one-line motivational message.' },
        ],
        userProfile: {
          name: userProfile.name,
        },
        motivationOnly: true,
      }),
    });

    if (!resp.ok) return null;

    const text = await resp.text();

    // Try to extract first JSON object from the response text.
    const match = text.match(/\{[\s\S]*\}/m);
    if (!match) return null;

    try {
      const parsed = JSON.parse(match[0]);
      if (parsed && parsed.code && parsed.text) {
        return { code: String(parsed.code), text: String(parsed.text) };
      }
    } catch (e) {
      // ignore parse errors
    }
    return null;
  } catch (err) {
    console.warn('fetchMotivation failed', err);
    return null;
  }
}
