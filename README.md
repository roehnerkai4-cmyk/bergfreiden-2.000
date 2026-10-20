# Manuskript Upload

Öffentliche Cloudflare Pages Upload-Seite für Manuskripte.

## Voraussetzungen
- Cloudflare Konto
- Cloudflare R2 Bucket
- Cloudflare Pages Projekt

## 1) R2 Bucket erstellen
- Cloudflare Dashboard → R2 → Bucket erstellen
- Name: `manuscripts`

## 2) Public Access aktivieren
- Bucket öffnen
- Settings → Public access
- Public URL aktivieren

## 3) Cloudflare Pages Projekt erstellen
- GitHub Repository verknüpfen
- Projekt deployen

## 4) R2 Binding im Pages-Projekt setzen
- Cloudflare Pages → Settings → Functions
- R2 binding hinzufügen
- Name: `MANUSCRIPTS_BUCKET`
- Bucket: `manuscripts`

## 5) Umgebungsvariable setzen
- Cloudflare Pages → Settings → Environment variables
- Name: `PUBLIC_R2_URL`
- Wert: z. B. `https://pub-xxxxx.r2.dev`

## 6) Deployment
```bash
npm install
npm run deploy
```

## 7) Lokal testen
```bash
npm install
npm run dev
```

## Unterstützte Dateien
- HTML
- PDF
- TXT
- MD
- ZIP
