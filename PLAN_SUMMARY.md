# Priority Dashboard - Plan Samenvatting

## Doel
Een productieklare Jira Forge app voor prioritering met:
- 3 input scores (opbrengst, urgentie, ambitie)
- 1 berekende totaalscore
- MoSCoW-labeling
- 3 optionele toelichtingen

## Gerealiseerd model
- Formule: `opbrengst + urgentie + ambitie`
- Labeling: `Must`, `Should`, `Could`, `Won't`
- Configureerbare drempels in admin

## Adminmogelijkheden
- 7-veld mapping (4 number + 3 text)
- app-managed default field setup
- gedeelde score scale options
- threshold config
- zichtbaarheid per issue type
- calculation log

## Verwacht resultaat
- Consistente prioritering in Jira issues
- Volledige traceerbaarheid via logs
- Beheerbare configuratie zonder codewijzigingen
