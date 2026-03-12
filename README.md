# Byggesakstall – steg 1

Intern webapp for trygg opplasting av ukentlige byggesaksuttrekk (CSV/XLSX) til GitHub.

## Hva som er implementert i steg 1

- Next.js App Router med TypeScript og Tailwind.
- Ruter:
  - `/` (redirect til `/upload`)
  - `/upload` (filopplasting)
  - `/dashboard` (placeholder)
- Upload-side med:
  - drag-and-drop/filvelger
  - delt opplastingskode
  - statusvisning (`idle`, `uploading`, `success`, `error`)
- Server-side route handler (`POST /api/upload`) med validering av:
  - opplastingskode (`UPLOAD_SHARED_SECRET`)
  - filtype (`.csv`, `.xlsx`)
  - filstørrelse (maks 20MB)
- Server-side GitHub-integrasjon som oppretter fil under `uploads/incoming/manual/`.

## NPM-pakker i bruk

- `next`
- `react`
- `react-dom`
- `typescript`
- `tailwindcss`
- `postcss`
- `autoprefixer`
- `eslint`
- `eslint-config-next`
- `@types/node`
- `@types/react`
- `@types/react-dom`

## Lokal oppstart

1. Installer avhengigheter:
   ```bash
   npm install
   ```
2. Kopier miljøvariabler:
   ```bash
   cp .env.example .env.local
   ```
3. Fyll inn riktige verdier i `.env.local`.
4. Start utviklingsserver:
   ```bash
   npm run dev
   ```
5. Åpne `http://localhost:3000/upload`.

## Nødvendige environment variables

- `UPLOAD_SHARED_SECRET` – delt kode som må oppgis ved opplasting.
- `GITHUB_TOKEN` – token med tilgang til å opprette filer i repo.
- `GITHUB_OWNER` – GitHub owner (organisasjon/bruker).
- `GITHUB_REPO` – repo-navn.
- `GITHUB_BRANCH` – branch der filer opprettes.

## Merknad for steg 2

TODO-er er lagt inn i kodebasen for:

- GitHub Actions workflow
- validering av kolonner
- normalisering av data
- setting av "Ufordelt" for manglende Avgj.kode
- generering av snapshots
- generering av metrics
- støtte for historisk backfill-import
