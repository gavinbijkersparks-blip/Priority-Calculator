# Risk Score Calculator for Jira

Een Jira Forge app om risico's consistent te beoordelen met een eenvoudige formule:

`Risk Score = Impact x Likelihood`

## Doel
- Eenduidige risicoclassificatie in Jira issues
- Snelle prioritering van mitigaties
- Automatische opslag van score in custom fields

## Functionaliteit
- Issue panel met live berekening
- Configureerbare invoervelden voor `Impact` en `Likelihood` (via admin)
- Automatische save + handmatige save
- Adminpagina voor:
  - issue type zichtbaarheid
  - custom field mapping + validatie
  - schaalopties beheren (`Scale Options`)
  - legacy value scan/migratie

## Score model
- Invoerwaarden: beheerbaar in admin (`Scale Options`)
- Standaardset: `1, 2, 3, 5, 8, 13, 20, 40, 100`
- Formule: `Impact x Likelihood`
- Prioriteiten:
  - `HIGH`: score `>= 400`
  - `MEDIUM`: score `>= 100` en `< 400`
  - `LOW`: score `< 100`

## Custom fields
De app gebruikt en beheert deze Jira custom fields:
- `Impact`
- `Likelihood`
- `Risk Score` (berekend)

## Gebruik
1. Open een issue waar de app actief is.
2. Vul `Impact` en `Likelihood` in.
3. Bekijk live de `Risk Score` en prioriteit.
4. Auto-save slaat wijzigingen op, of klik op `Save now`.

## Installatie (kort)
1. Installeer dependencies:
   - `npm install`
2. Build app:
   - `npm run build`
3. Deploy app:
   - `npm run deploy`
4. Installeer app op Jira site:
   - `npm run forge:install`
5. Open Jira adminpagina `Risk Score Configuration` en voer field setup uit.

## Belangrijk voor productie
- Activeer de app alleen op relevante issue types.
- Zet een vaste scoring-richtlijn voor teams (wat betekent 5/13/40 etc.).
- Neem periodieke review op in governance (bijv. per sprint/maand).
- Monitor field-permissions en screen-configuraties bij projectwijzigingen.

## Projectstructuur
- `static/issue-panel/src/main.jsx`: issue panel UI
- `static/admin/src/main.jsx`: admin configuratie UI
- `static/issue-log-modal/src/main.jsx`: issue-level log modal
- `src/utils/constants.js`: velddefinities en thresholds
- `src/utils/riskCalculator.js`: berekeningslogica
- `src/setupFields.js`: Jira field setup en issue read/write
- `src/index.js`: Forge resolver endpoints

## Licentie
MIT

## Vendor en Support Configuratie
Voor Atlassian Marketplace listing:
- **Vendor**: Stel in via de [Developer Console](https://developer.atlassian.com/console/myapps/) onder je app settings -> Distribution.
- **Support**: Voer hier een URL in naar je support portal (bijv. Jira Service Management) of een e-mailadres (bijv. `support@monrow.com`).
