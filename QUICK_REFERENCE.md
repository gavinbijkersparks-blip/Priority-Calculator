# Risk Score Quick Reference

## Formule
`Risk Score = Impact x Likelihood`

## Schaal
Schaal komt uit admin (`Scale Options`), niet meer hardcoded.

## Prioriteit
- `HIGH`: `>= 400`
- `MEDIUM`: `100 - 399`
- `LOW`: `< 100`

## Velden
- `Impact`
- `Likelihood`
- `Risk Score` (automatisch)

## Voorbeelden
- `Impact 20 x Likelihood 20 = 400` → `HIGH`
- `Impact 13 x Likelihood 8 = 104` → `MEDIUM`
- `Impact 5 x Likelihood 8 = 40` → `LOW`

## Snelle flow
1. Open issue
2. Vul `Impact` en `Likelihood` in
3. Check live score
4. Auto-save of `Save now`

## Admin quick flow
1. `Field Mapping` instellen
2. `Verify mapping`
3. `Scale Options` beheren en opslaan
4. `Scan legacy values` en indien nodig `Migrate legacy values`

## Troubleshooting
- Panel niet zichtbaar:
  - Controleer issue type in `Risk Score Configuration`
- Opslaan faalt:
  - Controleer of custom fields zijn aangemaakt
  - Controleer app scopes en Jira permissions
- Geen score zichtbaar:
  - Controleer of issue values aanwezig zijn in je actuele `Scale Options`
  - Bij oude waarden zie je `Legacy value (not in config)`
