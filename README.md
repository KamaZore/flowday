# Flowday — Personal Workflow & Task Management PWA

Local-first productivity PWA: Goal → Project → Process → Tasks → Daily actions → Progress.

## Run locally

```bash
bun install
bunx convex dev --once   # creates a Convex deployment; prints a URL (or reuse an existing one)
```

1. Create a `.env` file in the project root (copy the shape below). The platform blocks me from writing `.env` files directly — you create it:

   ```bash
   echo 'VITE_CONVEX_URL=' > .env   # paste your Convex deployment URL after the =
   ```

2. Paste your Convex deployment URL (from `bunx convex dev` output) as the value.
3. Start the dev server:

   ```bash
   bun run dev
   ```

> Inside the Freebuff preview, `VITE_CONVEX_URL` is injected automatically — no `.env` needed there.

### What works without a Convex URL

The data layer is local-first (localStorage). Without `VITE_CONVEX_URL`, the app shows a clear setup screen explaining exactly this (instead of a white screen), since auth requires the backend.

## Useful scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Vite dev server |
| `bun run build` | Production build (typechecks first) |
| `bun run preview` | Serve the production build |
| `bun test src/lib/flowday.test.ts` | 39 unit tests for the data/parse logic |
| `bun tsc -b --noEmit` | Typecheck only |

## Languages

English and Khmer (ភាសាខ្មែរ) — switch via the EN/ខ្មែរ button in the sidebar/mobile header or in Settings.

## Data isolation

Each signed-in account gets its own dataset on the device (its own "table"). Sign out to see the shared guest dataset. Export/import JSON backups in Settings.
