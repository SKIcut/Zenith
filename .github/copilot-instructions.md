## Copilot instructions — Zenith (nexusai-companion)

Purpose
- Help AI coding agents become productive quickly in this repository (frontend-first mentor assistant built with Vite/React/TypeScript + Supabase functions).

Quickstart (developer)
- Install deps: `npm install`
- Run dev server: `npm run dev` (Vite)
- Build: `npm run build` and preview: `npm run preview`
- Lint: `npm run lint`

Required env vars (local)
- `VITE_SUPABASE_URL` — URL for the Supabase project used by the client
- `VITE_SUPABASE_PUBLISHABLE_KEY` — public key used by the client
- For the Supabase Deno function `supabase/functions/mentor-chat/index.ts` the deployed function expects a Deno env var `zenithapiapikey` (the Groq API key). Locally that function may require the same key when running via the Supabase CLI.

Big picture & architecture
- Single Page App (Vite + React + TypeScript) in `src/`
  - `src/components` — UI screens and shared components. `src/components/ui` contains shadcn-style primitives used throughout.
  - `src/lib` — domain logic (AI client, memory/task extractors, utils). Key files:
    - `src/lib/mentorApi.ts` — client-side streaming helper. Calls the Supabase function (`/functions/v1/mentor-chat`) and parses SSE stream lines that look like `data: {...}`. If you change the server SSE format, update the parser here.
    - `src/lib/memoryExtractor.ts` — heuristic memory extraction rules (goals, challenges, decisions). Modify here to change what the app auto-saves as memories.
    - `src/lib/taskSync.ts` — heuristic task detection (TODO lists, "remind me to", imperatives).
    - `src/lib/motivation.ts` — local fallback motivations used when the remote generator is unavailable.
  - `src/hooks` — custom hooks: `useMemory`, `useTasks`, `useAuth` etc. `useMemory` persists memory to `localStorage` (key `zenith_memory_bank_<userId>`).
  - `src/integrations/supabase/client.ts` — generated Supabase client; treat as generated (don't edit manually). Uses `VITE_SUPABASE_*` env vars.

- Serverless AI bridge: `supabase/functions/mentor-chat/index.ts` (Deno)
  - This function proxies conversation + userProfile to a Groq/AI API and streams the response back as an SSE `text/event-stream`.
  - It builds a large `system` prompt from the `userProfile` and `memoryContext` (see `buildSystemPrompt`). If you need different prompting behavior, update this file.

Data flows & important interactions
- Chat send flow (client): `src/components/MentorChat.tsx` → calls `streamMentorResponse` from `src/lib/mentorApi.ts` → POST to Supabase function `mentor-chat` → function calls Groq API and streams SSE → client parses `data: {...}` lines and appends `choices[0].delta.content` to the assistant message.
- Memory flow: after a conversation finishes, `MemoryExtractor.extractMemories` is run, high-confidence memories are saved via `useMemory.addMemory` (persisted to `localStorage`). `getMemorySummary()` is used as `memoryContext` when sending requests.
- Task sync: `extractTasksFromText` is used to detect tasks; new tasks are created with the app's `useTasks` hook.

Project conventions & patterns to follow
- Absolute imports via `@/` are configured in `tsconfig.json` (maps to `./src/*`). Use `@/` for cross-file imports.
- UI primitives live under `src/components/ui` and follow shadcn naming and prop patterns — prefer wrapping or composing those primitives when adding new UI.
- Local persistence: `useMemory` uses `localStorage`. There is no central backend persistence for memories by default; treat `useMemory` as the canonical in-browser memory store unless you wire server-side storage.
- Streaming: SSE parsing is brittle — streaming code lives in `src/lib/mentorApi.ts`. When changing the server stream format, update both server `mentor-chat` and client parser.

Editing tips / where to make common changes
- Change system prompt or AI model choices: `supabase/functions/mentor-chat/index.ts` (careful — deployments may require secrets). The server uses `model: "llama-3.3-70b-versatile"` and streams tokens.
- Change message UI / streaming UX: `src/components/MentorChat.tsx` (message list, typing cursor, header behavior).
- Adjust memory heuristics: `src/lib/memoryExtractor.ts`.
- Adjust task detection: `src/lib/taskSync.ts`.
- Modify Supabase client config: `src/integrations/supabase/client.ts` (auto-generated; ensure env vars exist).
- Theme / design tokens: `src/index.css` and `tailwind.config.ts`.

Developer workflows / debugging hints
- To reproduce chat streaming errors: open browser devtools network tab, watch the request to `${VITE_SUPABASE_URL}/functions/v1/mentor-chat`, inspect the `text/event-stream` body and check for `data: ` lines. The client expects JSON objects per `data:` line.
- Rate-limiting: server returns 429; client checks for 429 and surfaces a friendly message.
- Local function dev: use the Supabase CLI to run functions locally (not included here). The function expects Deno env `zenithapiapikey` for the Groq API.
- If the function is unreachable in dev, the UI falls back to `src/lib/motivation.ts` for local motivational snippets.

Files worth reading first (order)
1. `src/components/MentorChat.tsx` — main chat UI and where messages are composed/streamed.
2. `src/lib/mentorApi.ts` — SSE client parsing and network contract with the function.
3. `supabase/functions/mentor-chat/index.ts` — server-side prompt and streaming bridge.
4. `src/lib/memoryExtractor.ts` and `src/lib/taskSync.ts` — business rules for extraction.
5. `src/hooks/useMemory.ts` — persistence conventions (localStorage shape).

Notes & things NOT to change blindly
- `src/integrations/supabase/client.ts` is generated; edit upstream if you regenerate the client.
- `supabase/functions/mentor-chat/index.ts` contains secrets/keys expectations — don't commit real keys to the repo. Use environment variables.

If something is unclear or you need more details
- Tell me which area to expand (prompt engineering, streaming format, memory model, deployment steps for Supabase functions) and I will iterate the instructions.

End.
