# Priority Dashboard Gebruikershandleiding

## Wat doet de app?
De app helpt je prioriteren met drie scores:
- Opbrengst
- Urgentie
- Ambitie

De app berekent automatisch:
- Totaal score
- MoSCoW-label (`Must`, `Should`, `Could`, `Won't`)

## In een issue
1. Open het issue panel `Priority Dashboard`.
2. Kies een score voor opbrengst, urgentie en ambitie.
3. Voeg optioneel toelichtingen toe per score.
4. De app slaat automatisch op (en je kunt ook handmatig opslaan).

## Hoe wordt label bepaald?
Op basis van totaalscore en thresholds in admin.
Standaard:
- Must: 30+
- Should: 20-29
- Could: 10-19
- Won't: 0-9

## Admin configuratie
In `Priority Dashboard Configuration`:
- map 7 Jira velden
- maak default velden aan
- beheer score-schaalopties
- beheer MoSCoW thresholds
- bepaal op welke issue types de app zichtbaar is

## Troubleshooting
- Geen opslag:
  - check field mapping
  - check field contexts/screens in Jira
- Panel niet zichtbaar:
  - check issue type visibility
- Onverwachte label:
  - check threshold config
