# Risk Score Calculator - Project Overview

## Samenvatting
Deze Forge app voegt een Risk Score calculator toe aan Jira issues.

Formule:
`Risk Score = Impact x Likelihood`

Doel:
- Sneller risico's prioriteren
- Uniforme scoring in teams
- Betrouwbare opslag in Jira custom fields

## Scope
- Issue context panel met live score
- Adminpagina voor zichtbaarheid per issue type
- Setup/validatie van custom fields + mapping check
- Beheer van schaalopties (impact/likelihood labels + values)
- Legacy value scan/migratie
- Opslaan en ophalen van scoredata op issue niveau

## Belangrijkste componenten
- `static/issue-panel/src/main.jsx`
  - UI voor `Impact`, `Likelihood`, score, status
- `static/admin/src/main.jsx`
  - issue type selectie
  - field mapping + verify
  - scale options
  - legacy cleanup
- `static/issue-log-modal/src/main.jsx`
  - issue-specifieke historiek/log modal
- `src/utils/riskCalculator.js`
  - berekening en prioriteitslabel
- `src/utils/constants.js`
  - velddefinities en thresholds
- `src/setupFields.js`
  - Jira API calls voor field setup + issue read/write
- `src/index.js`
  - Forge resolvers

## Data model
Custom fields:
- `Impact` (number)
- `Likelihood` (number)
- `Risk Score` (number, calculated)

Issue type visibility property:
- Property key: `risk-score-calculator`
- Flag: `enabled`

## Prioriteitslogica
- `HIGH`: score `>= 400`
- `MEDIUM`: score `>= 100` en `< 400`
- `LOW`: score `< 100`

## Operationeel
- Auto-save in issue panel
- Handmatige retry/save bij fouten
- Setup in admin voor nieuwe Jira omgevingen

## Productie aandachtspunten
- Governance op scoring-richtlijnen
- Periodieke review van thresholds
- Impact van workflow/screen wijzigingen op fieldbeschikbaarheid
- Releaseproces met staging-validatie voor elke wijziging
