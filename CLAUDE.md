# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ChatPersonajes** — A full-stack app to chat with iconic fictional characters (Frodo, John Wick, Walter White, Darth Vader, Tony Stark, Sherlock Holmes, Jack Sparrow, Gandalf) using AI streaming responses.

Two independent subprojects — always `cd` into the correct folder before running commands.

---

## Commands

### Backend (`/backend`)
```bash
cd backend
npm run dev      # Node with --watch (auto-restarts on file changes)
npm run start    # Production
```

### Frontend (`/frontend`)
```bash
cd frontend
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
```
s
Both servers must run simultaneously for the app to work: backend on `:3001`, frontend on `:5173`.

---

## Architecture

### Backend (`backend/src/`)
- **`server.js`** — Express entry point. CORS locked to `http://localhost:5173`. Mounts `/api` router.
- **`routes/chat.js`** — `POST /api/chat` — receives `{ characterId, messages[] }`, looks up the character's system prompt, calls Groq (`llama-3.3-70b-versatile`) and streams the response back as **SSE** (`text/event-stream`). Also exposes `GET /api/characters`.
- **`data/characters.js`** — System prompts keyed by `characterId`. All characters are instructed to respond in Spanish. This is the only place to edit character personalities or language behavior.

Backend uses **ES Modules** (`"type": "module"`) — use `import/export`, not `require`.

### Frontend (`frontend/src/`)
- **Framework:** React 19 + Vite, React Router DOM 7
- **No CSS framework** — plain CSS3 with custom properties. Each component has its own `.css` file alongside it.
- **Routing:** `App.jsx` — two routes: `/` (HomePage) and `/chat/:characterId` (ChatPage).
- **Data:** `src/data/characters.js` — frontend character list with `id`, `name`, `universe`, `emoji`, `themeColor`, `themeColorDim`, `gradient`, `image`. The `themeColor` drives the entire chat UI accent (button color, glow, bubble color, header bar).
- **Images:** Stored in `frontend/public/images/`. Referenced as `/images/filename.ext`. Each character has its own file with an arbitrary name — the exact filename is set in `src/data/characters.js`.
- **Chat history:** Persisted in `localStorage` with key `chat-{characterId}`. Max 50 messages stored per character.

### Key data flow
1. User selects character → navigates to `/chat/:characterId`
2. ChatPage reads `localStorage` to restore history
3. On send: `POST /api/chat` with full message history → backend streams SSE chunks → frontend builds the response token by token
4. On first token: typing indicator (`isTyping`) is replaced by the actual message bubble

### Design system
CSS custom properties defined in `App.css`. Character-specific colors are injected via inline `style` prop on the chat page root element as `--char-color`, `--char-dim`, `--char-gradient`. Components consume these variables directly — no prop drilling needed for theming.

### Adding a new character
1. **Backend** `backend/src/data/characters.js` — add an entry with `id` and `systemPrompt`. Include the Spanish language instruction.
2. **Frontend** `frontend/src/data/characters.js` — add the matching entry with `id`, display fields, `themeColor`, `themeColorDim`, `gradient`, and `image` path.
3. Drop the image in `frontend/public/images/`.

---

## Environment

```
# backend/.env
GROQ_API_KEY=...
ELEVENLABS_API_KEY=...   # currently unused in routes, installed but not wired
PORT=3001
```

---

## Working Rules

- Always `cd` into `backend` or `frontend` before running commands.
- Never assume commands run from the repository root unless explicitly stated.
- Do not modify both subprojects unless the task requires cross-stack changes.
- Prefer minimal, localized changes over broad rewrites.
- Preserve existing user-facing behavior unless a task explicitly requires changing it.
- When editing backend, keep ES Modules syntax (`import/export`).
- When editing frontend, preserve the existing plain CSS structure and colocated component CSS files.

## Refactoring Guidelines

- Prefer conservative refactors with minimal diff size.
- Do not change public API contracts unless explicitly requested.
- Avoid mixing refactors with feature work.
- Preserve SSE streaming behavior and the current localStorage persistence model.
- Keep theming based on `--char-color`, `--char-dim`, and `--char-gradient`.

## Validation Expectations

- After frontend changes, run `npm run lint` in `/frontend`.
- After frontend UI changes, manually verify the affected route in the browser.
- After backend changes, validate that `/api/chat` still streams correctly through SSE.
- Do not mark work as complete without stating how it was validated.
- When practical, add focused regression tests for bug fixes and behavior-sensitive refactors.

## Debugging Expectations

- Reproduce the issue before proposing a fix whenever possible.
- Separate symptoms, hypotheses, root cause, fix, and validation in the final explanation.
- Prefer the smallest safe fix that resolves the root cause.
- For chat issues, inspect both backend streaming behavior and frontend incremental rendering/state updates.

## Domain Constraints

- Characters must respond in Spanish.
- Character definitions in frontend and backend must stay aligned by `id`.
- `backend/src/data/characters.js` is the source of truth for character system prompts.
- `frontend/src/data/characters.js` is the source of truth for frontend character metadata and theming.
- Chat history must remain compatible with the `chat-{characterId}` localStorage key format.
- Backend CORS is intentionally restricted to `http://localhost:5173`.