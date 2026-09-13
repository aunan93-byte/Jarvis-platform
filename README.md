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
- Publiseringskontroll: `.github/workflows/verify-deployment.yml`

Når Vercel melder en vellykket produksjonspublisering til GitHub, kontrollerer
arbeidsflyten den faktiske forsiden, API-svaret og at publisert commit samsvarer
med GitHub. Produksjonsadressen hentes fra Vercels prosjekt- og domene-API.
Prosjekt-ID, team-ID, domeneeierskap og verifikasjon kontrolleres først.
Forhåndsvisninger hoppes over. Koden for kontrollen hentes alltid fra `main`.
HTTP-feil, innloggingsbeskyttelse, feil kodeversjon og manglende Git-identitet
regnes som mislykket verifisering. Kontrollen utføres etter publisering og
stanser ikke selve publiseringen.

### Vercel-tilgang for GitHub Actions

ChatGPTs Vercel-app returnerer fortsatt 403 for teamet. GitHub-integrasjonen
kan likevel bygge og publisere. For at etterkontrollen skal finne riktig
produksjonsadresse, opprett et Vercel Access Token med tilgang til teamet
`aunan93-3711`, og lagre det som repository secret `VERCEL_TOKEN` i GitHub Actions.

- [Opprett token i Vercel](https://vercel.com/account/settings/tokens)
- [Legg til GitHub-hemmeligheten](https://github.com/aunan93-byte/Jarvis-platform/settings/secrets/actions/new)
- [Kjør publiseringskontrollen](https://github.com/aunan93-byte/Jarvis-platform/actions/workflows/verify-deployment.yml)

Velg `Run workflow` på `main`, eller kjør den mislykkede kontrollen på nytt.
Tokenet sendes bare til `api.vercel.com`, i steget som leser prosjekt og domener.
Det sendes ikke til nettsiden og skrives ikke til loggene. Denne kontrollen gjør
ingen endringer i Vercel-innstillinger. Den reparerer heller ikke OAuth-koblingen
i ChatGPT; den gir en separat, støttet tilgang for prosjektets driftskontroll.

13. september 2026: HTTP 302 på byggeadressen ble sporet til
`https://vercel.com/sso-api`. Standardbeskyttelse kan beskytte byggeadresser også
for produksjonsbygg. Bruk en verifisert produksjonsadresse. Ikke gjett domener.

[Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)
[Vercel API-autentisering og teamtilgang](https://vercel.com/docs/rest-api)

API-et eksponerer bare commit-ID og miljø fra Vercels systemmiljøvariabler.
Hvis disse ikke er tilgjengelige, vises identiteten som ukjent. Vercels
**Enable access to System Environment Variables** må være aktivert for at
commit-kontrollen skal kunne bestå.

[Vercels systemmiljøvariabler](https://vercel.com/docs/environment-variables/system-environment-variables)
[GitHubs publiseringshendelser](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#deployment_status)

En godkjent kodekontroll er ikke bevis på at Vercel er ferdig tilkoblet. Verifiser byggestatus og helsekontrollen etter tilkobling.

[Offisiell GitHub-integrasjon for Vercel](https://vercel.com/docs/git/vercel-for-github)

## Videre arbeid

Agentmotor, vedvarende arbeidskø, database, autentisering, privat filarkiv og betalingshendelser må kobles til og testes før driften aktiveres. Oppbevar hemmeligheter i vertstjenestens beskyttede miljøvariabler.
