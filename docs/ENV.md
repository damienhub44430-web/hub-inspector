# Variables d'environnement — état réel

> Relevé le **2026-10-01** en lisant les **noms** via l'API Vercel / Cloudflare et le tableau de bord Doppler (aucune valeur lue).
> **Les variables listées ici sont posées : ne pas les redemander.**
> Type **Secret** (= *sensitive*) : valeur illisible même pour le propriétaire, `vercel env pull` la rend **vide** — ce n'est PAS une absence. Type **Config** (= *encrypted*) : lisible par `vercel env pull`.
> Source de vérité : Vercel.
> Mettre à jour ce fichier à chaque ajout / retrait de variable.

## Vercel — projet `hub-inspector` (2)

| Variable | Prod | Preview | Dev | Type |
|---|:-:|:-:|:-:|---|
| `ANTHROPIC_API_KEY` | ✅ | ✅ | — | Secret |
| `BROWSERLESS_TOKEN` | ✅ | ✅ | — | Secret |
