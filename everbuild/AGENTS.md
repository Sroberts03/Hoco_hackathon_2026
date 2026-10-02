<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

make sure to check out project.md for what the app is and what the app should accomplish.

# DATA:
data is gotten by supabase but business logic should stay withing the next.js application

<!-- END:nextjs-agent-rules -->

# STRUCTURE:
code is organized by feature under `src/features/<feature>/`, split by kind:
- `components/` React components for that feature (client components marked `"use client"`)
- `server/` server-only code: Server Actions (`actions.ts`), data access, route/proxy logic
- `lib/` pure helpers and types that are safe to import from client or server
`src/app/` holds routes only; pages and route handlers stay thin and import from features.
Shared, feature-agnostic code lives in `src/components/` (ui primitives, layout) and `src/lib/` (e.g. Supabase clients).
