# Risk Score Gebruikershandleiding

## Wat is Risk Score?
Risk Score helpt je risico's te prioriteren met twee inputs:
- `Impact`: hoe groot is het effect als het risico optreedt?
- `Likelihood`: hoe waarschijnlijk is het dat het risico optreedt?

Formule:
`Risk Score = Impact x Likelihood`

## Waardes
Je beheert waardes nu in `Risk Score Configuration`:
- `Scale Options` voor `Impact` en `Likelihood`
- Per optie:
  - `Value` (numeriek, gebruikt voor berekening)
  - `Default label`
  - `English label (optional)`
  - `Dutch label (optional)`

## Prioriteiten
- `HIGH`: score `>= 400`
- `MEDIUM`: score `100-399`
- `LOW`: score `< 100`

## In Jira gebruiken
1. Open een issue met enabled issue type.
2. Ga naar `Risk Score Calculator` in de issue sidebar.
3. Selecteer `Impact` en `Likelihood`.
4. Controleer score en prioriteit.
5. Laat auto-save opslaan of klik `Save now`.

## Presets (automatisch)
Quick presets (`Low`, `Medium`, `High`) worden automatisch afgeleid uit je huidige configuratie:
- `Low` = laagste waarde
- `Medium` = middelste waarde
- `High` = hoogste waarde

Zo blijven presets altijd geldig als je de schaal aanpast.

## Voorbeelden
- `20 x 20 = 400` -> `HIGH`
- `13 x 8 = 104` -> `MEDIUM`
- `5 x 8 = 40` -> `LOW`

## Best practices
- Definieer teambreed wat elke score betekent.
- Herzie scores periodiek (bijv. per sprint).
- Gebruik score samen met context (compliance, deadlines, afhankelijkheden).

## Veelvoorkomende issues
- Panel niet zichtbaar:
  - issue type niet enabled in `Risk Score Configuration`
- Opslaan lukt niet:
  - custom fields ontbreken of permissions onvoldoende
- Onverwachte score:
  - controleer beide inputwaarden en schaalafspraken
- Je ziet `Legacy value (not in config)`:
  - deze issue heeft een oude waarde die niet meer in `Scale Options` staat
  - los op via:
    - waarde opnieuw kiezen en opslaan op issue, of
    - admin `Legacy values cleanup` gebruiken

## Admin kwaliteitsflow
Gebruik in admin deze volgorde:
1. `Field Mapping` invullen.
2. `Verify mapping` uitvoeren.
3. `Scale Options` opslaan.
4. `Legacy values cleanup`:
   - eerst `Scan legacy values`
   - daarna `Migrate legacy values` (indien nodig).
