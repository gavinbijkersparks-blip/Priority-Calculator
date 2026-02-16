# Release Runbook

## Doel
Standaard werkwijze voor een veilige release van de Risk Score Calculator naar productie.

## Preflight
1. Controleer branch en wijzigingen.
2. Zorg dat `npm install` succesvol is.
3. Draai build:
   - `npm run build`
4. Verifieer dat lint/build geen fouten geven.
5. Controleer `manifest.yml` op juiste app-id en modules.

## Deploy
1. Deploy naar Forge:
   - `npm run deploy`
2. Noteer de build tag uit de output.

## Install / Upgrade
1. Upgrade de app op de doelomgeving:
   - `npm run forge:install`
2. Kies de juiste Jira site en omgeving (production).

## Post-Deploy Validatie
1. Open Jira adminpagina:
   - `Apps` -> `Risk Score Configuration`
2. Klik:
   - `Create or validate Risk Score fields`
3. Controleer velden:
   - `Impact`
   - `Likelihood`
   - `Risk Score`
4. Controleer visibility per issue type en sla op.
5. Open een test-issue en valideer:
   - panel zichtbaar
   - score berekent live (`Impact x Likelihood`)
   - auto-save werkt
   - handmatige `Save now` werkt

## Smoke Test Scenario
1. Zet `Impact = 13`
2. Zet `Likelihood = 8`
3. Verwacht:
   - `Risk Score = 104`
   - Priority = `MEDIUM`

## Rollback
1. Herdeploy vorige stabiele versie (vorige build/commit).
2. Run opnieuw:
   - `npm run deploy`
   - `npm run forge:install`
3. Voer Post-Deploy Validatie opnieuw uit.

## Release Evidence (vastleggen)
- Datum/tijd release
- Uitvoerder
- Build tag
- Doelomgeving/site
- Resultaat smoke test
- Eventuele afwijkingen/incidents
