# Priority Calculator - Project Overview

Deze Forge app voegt een Priority Calculator toe aan Jira issues met een MoSCoW-achtig model.

## Scoremodel
- `Totaal score = Opbrengst + Urgentie + Ambitie`
- MoSCoW-label op basis van thresholds:
  - `Must >= must`
  - `Should >= should`
  - `Could >= could`
  - `Won't < could`

## Belangrijkste onderdelen
- `static/issue-panel/src/main.jsx`
  - UI voor 3 scores, 3 optionele toelichtingen, totaalscore, MoSCoW-label
  - autosave + handmatige save
- `static/admin/src/main.jsx`
  - field mapping (7 velden)
  - scale options (gedeeld voor alle 3 scores)
  - threshold config
  - visibility config
  - calculation log
- `static/issue-log-modal/src/main.jsx`
  - issue-specifieke logweergave
- `src/index.js`
  - Forge resolver endpoints
- `src/setupFields.js`
  - Jira API integratie voor fields, mapping, save/load, logs, config
- `src/utils/constants.js`
  - default velden, schaalopties, thresholds
- `src/utils/priorityCalculator.js`
  - totaalscore- en MoSCoW-logica

## Jira custom fields
Number:
- `Priority Calculator - Opbrengst score`
- `Priority Calculator - Urgentie score`
- `Priority Calculator - Ambitie score`
- `Priority Calculator - Totaal score`

Text:
- `Priority Calculator - Opbrengst toelichting`
- `Priority Calculator - Urgentie toelichting`
- `Priority Calculator - Ambitie toelichting`

## Opslag (app storage)
- `priority-dashboard:field-mapping:v1`
- `priority-dashboard:calculation-logs:v1`
- `priority-dashboard:user-cache:v1`
- `priority-dashboard:scale-config:v1`
- `priority-dashboard:threshold-config:v1`

## Issue type visibility
- Property key: `priority-dashboard`
- Property field: `enabled`
