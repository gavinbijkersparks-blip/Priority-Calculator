# Risk Score Calculator - Plan Samenvatting

## Doel
Een productieklare Jira Forge app die risico's berekent met:
`Impact x Likelihood`

## Opgeleverd
1. Risk Score custom fields
   - `Impact`
   - `Likelihood`
   - `Risk Score`
2. Issue panel calculator
   - Live score
   - Auto-save + handmatige save
3. Admin configuratie
   - Visibility per issue type
   - Setup/validatie van velden
4. Backend resolvers
   - read/write issue state
   - config save/load

## Prioriteitsschaal
- `HIGH >= 400`
- `MEDIUM 100-399`
- `LOW < 100`

## Deployment flow
1. Build (`npm run build`)
2. Deploy (`npm run deploy`)
3. Install (`npm run install`)
4. Configureer issue types en velden in `Risk Score Configuration`
5. Functionele test op representative issue types

## Productie ready criteria
- App functioneert op beoogde projecten
- Veldmapping is stabiel
- Team gebruikt uniforme scoring-definities
- Beheerproces voor wijzigingen is vastgelegd

## Volgende iteraties
- Rapportage/dashboard op Risk Score
- Bulk scoring workflows
- Audit trail voor scorewijzigingen
