Éditeur UX visuel (façon Figma) pour importer des UI existantes et retravailler design & UX.

## Configuration des imports (clés API)

Les imports avancés et l'assistant Claude utilisent des variables d'environnement.
Copie `.env.example` en `.env.local` et renseigne :

| Variable | Débloque | Requis |
|---|---|---|
| `ANTHROPIC_API_KEY` | Import « Depuis une URL » (analyse Vision) + assistant Claude par bloc | recommandé |
| `BROWSERLESS_TOKEN` | Extraction DOM haute fidélité de l'import URL (sinon Microlink + Vision) | optionnel |

```bash
cp .env.example .env.local   # puis édite .env.local, puis: npm run dev
```

Où mettre la clé selon le contexte :
- **Local** : `.env.local` (ignoré par git).
- **Claude Code (web)** : variables d'environnement de l'environnement — voir https://code.claude.com/docs/en/claude-code-on-the-web
- **Déploiement** (Vercel/Netlify) : variables d'environnement du projet dans le dashboard.

Notes :
- **Sans clé**, l'import URL fonctionne quand même en **mode capture** (le screenshot devient une image éditable).
- L'import URL ne marche que sur des **URL publiques** (jamais `localhost`).
- Pour une app **locale / un projet git non déployé** : `Importer → Depuis ton app (scan)` (aucune clé, 100% local).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
