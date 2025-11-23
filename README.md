# SFDataHub Control Panel

Dieses Repository enthält das Admin/Moderator-Control-Panel für SFDataHub. Das Projekt basiert auf **Vite + React + TypeScript** und verfügt über ein einfaches Dark-Theme-Layout mit Topbar, Sidebar und ContentShell.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Der Dev-Server startet auf `http://localhost:5173` (Standard).

### Umgebungsvariablen

Lege eine `.env.local` an (oder kopiere `.env.example`) mit:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_APP_ID=...
# Optional
VITE_AUTH_BASE_URL=https://auth.example.com
```

⚠️ Keine echten Keys committen. Hinterlege sie nur lokal bzw. in CI/CD, damit sie nicht im Repository oder in gebuildeten Artefakten landen.

## Produktion / GitHub Pages

```bash
npm run build
npm run build:docs
```

1. `npm run build` kompiliert die App und legt das Ergebnis im Ordner `dist/` ab.
2. `npm run build:docs` führt den Build erneut aus und kopiert den Inhalt von `dist/` nach `docs/`.
3. `docs/` kann dann als GitHub-Pages-Quelle (`/control-panel/`) dienen.
