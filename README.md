# SFDataHub Control Panel

Dieses Repository enthält das Admin/Moderator-Control-Panel für SFDataHub. Das Projekt basiert auf **Vite + React + TypeScript** und verfügt über ein einfaches Dark-Theme-Layout mit Topbar, Sidebar und ContentShell.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Der Dev-Server startet auf `http://localhost:5173` (Standard).

## Produktion / GitHub Pages

```bash
npm run build
npm run build:docs
```

1. `npm run build` kompiliert die App und legt das Ergebnis im Ordner `dist/` ab.
2. `npm run build:docs` führt den Build erneut aus und kopiert den Inhalt von `dist/` nach `docs/`.
3. `docs/` kann dann als GitHub-Pages-Quelle (`/control-panel/`) dienen.
