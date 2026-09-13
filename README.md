# Jarvis-platform

Et lite startprosjekt for JARVIS på Vercel, med statusside, helsekontroll og automatisk kodekontroll i GitHub Actions.

**Status:** Plattformgrunnlag. Agentmotor, database, butikk og levering er ennå ikke flyttet til dette prosjektet. API-et rapporterer derfor `autonomous: false` og `commerce: false`.

## Lokal kontroll

Node.js 24. Ingen eksterne npm-pakker er nødvendige.

```sh
npm test
```

## Vercel

Koble dette arkivet til det eksisterende Vercel-prosjektet gjennom **Project Settings → Git**. `vercel.json` angir at testene kjøres ved bygging, at `public/` er den offentlige katalogen, og at sidene ikke skal indekseres.

- Statisk side: `public/index.html`
- Helsekontroll: `GET /api/health`
- GitHub-kontroll: `.github/workflows/ci.yml`

En godkjent kodekontroll er ikke bevis på at Vercel er ferdig tilkoblet. Verifiser byggestatus og helsekontrollen etter tilkobling.

[Offisiell GitHub-integrasjon for Vercel](https://vercel.com/docs/git/vercel-for-github)

## Videre arbeid

Agentmotor, vedvarende arbeidskø, database, autentisering, privat filarkiv og betalingshendelser må kobles til og testes før driften aktiveres. Oppbevar hemmeligheter i vertstjenestens beskyttede miljøvariabler.
