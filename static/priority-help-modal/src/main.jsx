import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { view } from '@forge/bridge';
import Button from '@atlaskit/button/new';
import '@atlaskit/css-reset';
import './styles.css';

const CONTENT = {
  en: {
    title: 'Scoring guide',
    close: 'Close',
    sections: [
      {
        key: 'benefit',
        title: 'Expected benefit',
        criteria: ['Impact', 'Savings versus current situation'],
        cards: [
          {
            title: '1 point: Very low',
            className: 'card-low',
            bullets: ['No substantive impact', 'No financial impact']
          },
          {
            title: '2 points: Low',
            className: 'card-low',
            bullets: ['Limited impact (positive)', 'Financial: EUR 0 - EUR 50,000']
          },
          {
            title: '3 points: Medium',
            className: 'card-medium',
            bullets: ['Moderate impact (positive)', 'Financial: EUR 50,000 - EUR 100,000']
          },
          {
            title: '4 points: High',
            className: 'card-high',
            bullets: ['High impact (positive)', 'Financial: > EUR 100,000']
          }
        ]
      },
      {
        key: 'urgency',
        title: 'Urgency',
        criteria: ['(Supplementary) subsidy conditions', 'Laws and regulations', 'Necessary replacement', 'Business continuity'],
        cards: [
          {
            title: '1 point: Not urgent',
            className: 'card-low',
            bullets: [
              'Not included in supplementary subsidy conditions',
              'No obligations from laws and regulations',
              'Replacement is not necessary',
              'Continuity is not at risk'
            ]
          },
          {
            title: '2 points: Slightly urgent (over 3 years)',
            className: 'card-low',
            bullets: [
              'Likely included in supplementary subsidy conditions',
              'Likely obligations from laws and regulations',
              'Replacement likely needed',
              'Continuity might be at risk'
            ]
          },
          {
            title: '3 points: Moderately urgent (within 2-3 years)',
            className: 'card-medium',
            bullets: [
              'Included in supplementary subsidy conditions',
              'Obligations from laws and regulations',
              'Replacement is necessary',
              'Continuity is at risk'
            ]
          },
          {
            title: '4 points: Urgent (within 1-2 years)',
            className: 'card-high',
            bullets: [
              'Included in supplementary subsidy conditions',
              'Obligations from laws and regulations',
              'Replacement is necessary',
              'Continuity is at risk'
            ]
          }
        ]
      },
      {
        key: 'ambition',
        title: 'Ambitions and tasks',
        criteria: ['One contribution per organisation', 'We support all stakeholders', 'The client thinks with us', 'Pride in the organisation'],
        cards: [
          {
            title: '1 point',
            className: 'card-low',
            bullets: ['Delivers no contribution to strategic ambitions']
          },
          {
            title: '2 points',
            className: 'card-low',
            bullets: ['Delivers a low contribution to strategic ambitions']
          },
          {
            title: '3 points',
            className: 'card-medium',
            bullets: ['Delivers a moderate direct or indirect contribution to strategic ambitions']
          },
          {
            title: '4 points',
            className: 'card-high',
            bullets: ['Delivers a high contribution to strategic ambitions']
          }
        ]
      }
    ]
  },
  nl: {
    title: 'Scoringsuitleg',
    close: 'Sluiten',
    sections: [
      {
        key: 'benefit',
        title: 'Verwachte opbrengst',
        criteria: ['Impact', 'Besparing ten opzichte van de huidige situatie'],
        cards: [
          {
            title: '1 punt indien: Zeer laag',
            className: 'card-low',
            bullets: ['Inhoudelijk geen impact', 'Financieel geen impact']
          },
          {
            title: '2 punten indien: Laag',
            className: 'card-low',
            bullets: ['Inhoudelijk klein (positieve) impact', 'Financieel EUR 0 - EUR 50.000']
          },
          {
            title: '3 punten indien: Midden',
            className: 'card-medium',
            bullets: ['Inhoudelijk gemiddeld (positieve) impact', 'Financieel EUR 50.000 - EUR 100.000']
          },
          {
            title: '4 punten indien: Hoog',
            className: 'card-high',
            bullets: ['Inhoudelijk hoog (positieve) impact', 'Financieel > EUR 100.000']
          }
        ]
      },
      {
        key: 'urgency',
        title: 'Urgentie',
        criteria: ['(Aanvullende) subsidievoorwaarden', 'Wet- en regelgeving', 'Noodzakelijke vervanging', 'Continuiteit waarborgen'],
        cards: [
          {
            title: '1 punt indien: Niet urgent',
            className: 'card-low',
            bullets: [
              'Niet opgenomen in de (aanvullende) subsidievoorwaarden',
              'Geen verplichting vanuit de wet- en regelgeving',
              'Vervanging is niet noodzakelijk',
              'Continuiteit is niet in het geding'
            ]
          },
          {
            title: '2 punten indien: Weinig urgent (over meer dan 3 jaar)',
            className: 'card-low',
            bullets: [
              'Wordt waarschijnlijk in de (aanvullende) subsidievoorwaarden opgenomen',
              'Wordt waarschijnlijk een verplichting vanuit de wet- en regelgeving',
              'Vervanging is waarschijnlijk noodzakelijk',
              'Continuiteit komt mogelijk in het geding'
            ]
          },
          {
            title: '3 punten indien: Gemiddeld urgent (binnen 2 - 3 jaar)',
            className: 'card-medium',
            bullets: [
              'Wordt in de (aanvullende) subsidievoorwaarden opgenomen',
              'Wordt een verplichting vanuit de wet- en regelgeving',
              'Vervanging is noodzakelijk',
              'Continuiteit komt in het geding'
            ]
          },
          {
            title: '4 punten indien: Urgent (binnen 1 - 2 jaar)',
            className: 'card-high',
            bullets: [
              'Wordt in de (aanvullende) subsidievoorwaarden opgenomen',
              'Wordt een verplichting vanuit de wet- en regelgeving',
              'Vervanging is noodzakelijk',
              'Continuiteit komt in het geding'
            ]
          }
        ]
      },
      {
        key: 'ambition',
        title: 'Ambities en opgaven',
        criteria: ['Een werkbare organisatie', 'We pakken onze rol als uitvoerder', 'De client denkt met ons mee', 'BVO NL is een organisatie om trots op te zijn'],
        cards: [
          {
            title: '1 punt indien',
            className: 'card-low',
            bullets: ['Levert geen bijdrage aan de strategische ambities']
          },
          {
            title: '2 punten indien',
            className: 'card-low',
            bullets: ['Levert een lage bijdrage aan de strategische ambities']
          },
          {
            title: '3 punten indien',
            className: 'card-medium',
            bullets: ['Levert een gemiddelde of indirecte bijdrage aan de strategische ambities']
          },
          {
            title: '4 punten indien',
            className: 'card-high',
            bullets: ['Levert een hoge bijdrage aan de strategische ambities']
          }
        ]
      }
    ]
  }
};

const getLanguageFromLocale = (locale) =>
  String(locale || '').toLowerCase().startsWith('nl') ? 'nl' : 'en';

function App() {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    (async () => {
      try {
        const context = await view.getContext();
        const locale =
          context?.locale ||
          context?.user?.locale ||
          context?.platformContext?.locale ||
          '';
        setLanguage(getLanguageFromLocale(locale));
      } catch (_error) {
        setLanguage('en');
      }
    })();
  }, []);

  const strings = useMemo(() => CONTENT[language] || CONTENT.en, [language]);

  return (
    <div className="modal-page">
      <div className="modal-header">
        <h2>{strings.title}</h2>
        <Button appearance="subtle" onClick={() => view.close()}>
          {strings.close}
        </Button>
      </div>

      {strings.sections.map((section) => (
        <section className={`section section-${section.key}`} key={section.key}>
          <div className="section-head">
            <h3>{section.title}</h3>
            <ul>
              {section.criteria.map((criterion) => (
                <li key={criterion}>{criterion}</li>
              ))}
            </ul>
          </div>
          <div className="cards">
            {section.cards.map((card) => (
              <article className={`card ${card.className}`} key={card.title}>
                <h4>{card.title}</h4>
                <ul>
                  {card.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
