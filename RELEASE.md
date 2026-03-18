# Release Procedure - Priority Calculator

Standaard werkwijze voor release naar productie.

## 1. Voorbereiding
- `npm install`
- `npm run build`
- controleer dat build en lint slagen

## 2. Deploy
- `npm run deploy`
- kies correcte omgeving/site

## 3. Post-deploy checks
In Jira Admin:
- open `Priority Calculator Configuration`
- run `Create default fields and map them`
- controleer mapping van 7 velden
- controleer thresholds en scale options
- controleer visibility issue types

## 4. Functionele test
1. Open test issue.
2. Vul scores in: opbrengst, urgentie, ambitie.
3. Controleer:
   - totaalscore live
   - MoSCoW-label correct
   - autosave werkt
4. Vul toelichtingen in en controleer opslag.

## 5. Log check
- open calculation log in admin
- controleer nieuwe entries met scorewaarden en MoSCoW-label
