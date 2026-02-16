# Risk Score Calculator - Installatie Instructies

## Vereisten
- Node.js 20+
- npm
- Forge CLI
- Jira Cloud site met admin rechten

## 1. Dependencies
```bash
npm install
```

## 2. Build
```bash
npm run build
```

## 3. Deploy
```bash
npm run deploy
```

## 4. Install op Jira
```bash
npm run forge:install
```
Volg de Forge prompts en selecteer de juiste Jira omgeving/site.

## 5. App configureren in Jira
1. Open `Apps` -> `Risk Score Configuration`
2. Klik op `Create or validate Risk Score fields`
3. Controleer dat velden zijn aangemaakt:
   - `Impact`
   - `Likelihood`
   - `Risk Score`
4. Selecteer issue types waarvoor het issue panel zichtbaar moet zijn
5. Klik `Save configuration`

## 6. Functionele test
1. Open een issue van een enabled issue type
2. Controleer dat `Risk Score Calculator` zichtbaar is
3. Zet bijvoorbeeld:
   - `Impact = 13`
   - `Likelihood = 8`
4. Controleer score `104` en prioriteit `MEDIUM`
5. Herlaad issue en controleer dat waarden zijn opgeslagen

## Productie checklist (kort)
- Custom fields op juiste screens zichtbaar
- Permission scheme gecontroleerd
- Issue type mapping gevalideerd
- Team scoring-richtlijn beschikbaar
- Monitoring/support eigenaar vastgesteld

## Handige commands
```bash
npm run tunnel
npm run build
npm run deploy
npm run forge:install
```
