# @chrysty/live-embed

Host-side **Ask Chrysty** embed for sibling Chrysty apps (Learning, Content, Ledger, Practice, …).

Live mic/WebSocket runs inside an iframe on `chrysty.chrysty.dev/embed/live` — this package does **not** reimplement Live.

## Fast start (sibling apps)

**Read this first:** [docs/ask-chrysty-sibling-apps.md](../../docs/ask-chrysty-sibling-apps.md) — checklist, worker slugs, shell + nested context, smoke test, anti-patterns.

Working pilot: Learning (`learn.chrysty.dev`). This Content app follows that pattern with `worker="content"`.

Astra source of truth: `docs/embed/ask-chrysty-sibling-apps.md` in the Chrysty Astra repo.

## Install (same pattern as `@chrysty/platform`)

```json
"@chrysty/live-embed": "file:packages/live-embed"
```

Run `postinstall` / `npm run build --prefix packages/live-embed` so `dist/` exists.

## Golden path (this Content app)

### 1. Root providers — one provider

See `src/components/providers/app-providers.tsx` — `ChrystyLiveEmbedProvider` with `worker="content"`.

### 2. App shell — one FAB + default host context

See `src/components/layout/content-app-shell.tsx` — `ChrystyHostContext` + `#workspace-content` + one `AskChrystyButton`.

### 3. Page upgrade — nested HostContext only

See `src/features/viewer/consumption/content-viewer-shell.tsx` — nested context on creation viewer, no second FAB.

## Behavior (built into the package)

- FAB uses Astra’s cyan **Aura** idle mark (not a chat bubble); click toggles open/close
- Live opens as a **docked panel** (bottom-right), not a full-page overlay
- Iframe `src` is frozen while open; host context/capture updates via postMessage on nav
- Mic/audio stay inside Astra `/embed/live`

## Env

```
NEXT_PUBLIC_ASTRA_EMBED_URL=https://chrysty.chrysty.dev
```

User must be signed in (shared `.chrysty.dev` SSO) for bootstrap + Live memory.

## Anti-patterns

| Don’t | Do |
|-------|-----|
| Nest multiple providers | One provider in root layout |
| Mount FAB on every page | One FAB in the shell |
| Put capture + FAB only on leaf pages | Shell default HostContext + nested upgrades |
| Full-screen host overlay | Use package docked panel |
| Remount iframe on route change | Keep open; send context/capture updates |
| Reimplement mic/Live in the host | Iframe to Astra only |
| Ship `mode: 'direct'` as a mic workaround | Fix `/embed/live` or host overlay |
