# Priority Calculator Deployment Checklist

## Build en deploy
- [ ] `npm install` uitgevoerd
- [ ] `npm run build` succesvol
- [ ] `npm run deploy` succesvol
- [ ] App geïnstalleerd op juiste Jira site

## Jira admin
- [ ] `Priority Calculator Configuration` geopend
- [ ] `Create default fields and map them` uitgevoerd
- [ ] 7 velden correct gekoppeld
- [ ] visibility issue types ingesteld
- [ ] thresholds gecontroleerd
- [ ] scale options gecontroleerd

## Functioneel
- [ ] Panel zichtbaar op geconfigureerde issue types
- [ ] Live totaalscore werkt
- [ ] MoSCoW-label wijzigt correct
- [ ] Autosave werkt voor scores
- [ ] Autosave werkt voor toelichtingen
- [ ] Handmatige save werkt
- [ ] Reset naar issue-waarden werkt

## Logging
- [ ] Log toont benefit/urgency/ambition/total/moscow
- [ ] Issue log modal werkt
