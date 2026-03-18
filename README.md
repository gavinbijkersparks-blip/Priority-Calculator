# Priority Calculator for Jira

Een Jira Forge app voor prioritering met een MoSCoW-achtig model.

## Kern
- 3 score-inputs: opbrengst, urgentie, ambitie
- berekende totaalscore (`opbrengst + urgentie + ambitie`)
- MoSCoW-label (`Must`, `Should`, `Could`, `Won't`)
- 3 optionele toelichtingen
- autosave + handmatige save

## Admin
- 7-veld Jira mapping (4 number + 3 text)
- default field setup
- score scale options (gedeeld)
- MoSCoW threshold configuratie
- visibility per issue type
- calculation logs

## Installatie
1. `npm install`
2. `npm run build`
3. `npm run deploy`
4. `npm run forge:install`
5. Configureer de app via `Priority Calculator Configuration` in Jira admin.

## Structuur
- `static/issue-panel/src/main.jsx`
- `static/admin/src/main.jsx`
- `static/issue-log-modal/src/main.jsx`
- `src/index.js`
- `src/setupFields.js`
- `src/utils/constants.js`
- `src/utils/priorityCalculator.js`

## Documentatie
- `INSTALLATION.md`
- `DEPLOYMENT_CHECKLIST.md`
- `QUICK_REFERENCE.md`
- `PRIORITY_DASHBOARD_GUIDE.md`
- `RELEASE.md`
- `PROJECT_OVERVIEW.md`
