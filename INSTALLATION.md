# Priority Dashboard - Installatie Instructies

## Vereisten
- Node.js + npm
- Forge CLI
- Jira Cloud site met adminrechten

## Installatie
1. Installeer dependencies:
   - `npm install`
2. Build:
   - `npm run build`
3. Deploy:
   - `npm run deploy`
4. Installeer op Jira site:
   - `npm run forge:install`

## Eerste configuratie in Jira
1. Open `Apps -> Priority Dashboard Configuration`.
2. Klik `Create default fields and map them`.
3. Controleer 7 veldkoppelingen.
4. Stel issue type visibility in.
5. Stel eventueel scale options en MoSCoW thresholds in.

## Validatie
1. Open een issue met actieve app.
2. Vul scores en optionele toelichtingen in.
3. Controleer totaalscore, MoSCoW-label en opgeslagen waarden.
