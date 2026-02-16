# Risk Score Deployment Checklist

## Pre-deploy
- [ ] Forge omgeving geselecteerd (staging/production)
- [ ] Build succesvol (`npm run build`)
- [ ] Geen lint errors
- [ ] App versie/metadata gecontroleerd

## Deploy
- [ ] Deploy uitgevoerd (`npm run deploy`)
- [ ] Install/upgrade uitgevoerd (`npm run forge:install`)
- [ ] App zichtbaar in Jira admin

## Configuratie
- [ ] `Risk Score Configuration` geopend
- [ ] `Create or validate Risk Score fields` uitgevoerd
- [ ] Velden bestaan:
  - [ ] `Impact`
  - [ ] `Likelihood`
  - [ ] `Risk Score`
- [ ] Relevante issue types enabled
- [ ] Configuratie opgeslagen
- [ ] `Verify mapping` uitgevoerd en succesvol
- [ ] `Scale Options` gecontroleerd en opgeslagen
- [ ] `Scan legacy values` uitgevoerd
- [ ] Indien nodig: `Migrate legacy values` uitgevoerd

## Functioneel
- [ ] Issue panel zichtbaar op enabled issue type
- [ ] Live score werkt (`Impact x Likelihood`)
- [ ] Quick presets kloppen met actuele schaal (low/mid/high)
- [ ] Auto-save werkt
- [ ] Handmatige save (`Save now`) werkt
- [ ] Reload issue toont opgeslagen waarden

## Datakwaliteit
- [ ] Fibonacci scoring-afspraken vastgelegd
- [ ] Team weet wanneer `HIGH`, `MEDIUM`, `LOW` gebruikt wordt
- [ ] Reviewfrequentie afgesproken (bijv. elke sprint)

## Prioriteitsdrempels
- [ ] `HIGH >= 400`
- [ ] `MEDIUM 100-399`
- [ ] `LOW < 100`

## Productiegereed
- [ ] Owner voor applicatiebeheer toegewezen
- [ ] Incident/probleemroute bekend
- [ ] Wijzigingsproces voor thresholds/velden beschreven
- [ ] Backup/rollback aanpak bekend

## Go/No-Go
- [ ] GO voor productie
- [ ] Stakeholders geïnformeerd
