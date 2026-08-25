/* Strich-Icons für die Traumsymbole — dieselbe Bildsprache wie icons.jsx:
 * 24×24, currentColor, Strichstärke 1.6, runde Kappen, nichts gefüllt.
 *
 * Ersatz für die Emoji aus symbols.js (Antons Befund 26.08.: „die Icons
 * sind panne") — Emoji malt jede Plattform anders, gefüllt und bunt, und
 * zwanzig davon nebeneinander sind ein Basar statt eines Atlasses.
 *
 * ⚠ symbols.js behält seine emoji-Felder als RÜCKFALL: <SymbolIcon> fällt
 * auf das Emoji zurück, wenn hier kein Icon liegt. Wer ein Symbol in
 * symbols.js ergänzt, zeichnet also HIER nach — sonst steht ein einzelnes
 * Emoji zwischen zwanzig Strichzeichnungen, und das fällt sofort auf. */
import { symbolById } from "../lib/symbols.js";

const base = {
  viewBox: "0 0 24 24", width: 24, height: 24,
  fill: "none", stroke: "currentColor", strokeWidth: 1.6,
  strokeLinecap: "round", strokeLinejoin: "round",
  "aria-hidden": "true",
};

/* — Orte — */
const Water = () => (
  <svg {...base}>
    <path d="M3 9.5c2.2-2.4 4.3-2.4 6.5 0s4.3 2.4 6.5 0 3.5-2 5 0" />
    <path d="M3 15c2.2-2.4 4.3-2.4 6.5 0s4.3 2.4 6.5 0 3.5-2 5 0" />
  </svg>
);
const Home = () => (
  <svg {...base}>
    <path d="M4.5 10.5 12 4l7.5 6.5" />
    <path d="M6.5 9.5V19h11V9.5" />
    <path d="M10.2 19v-4.6h3.6V19" />
  </svg>
);
const City = () => (
  <svg {...base}>
    <path d="M4 19V9h6v10" />
    <path d="M13 19V5h7v14" />
    <path d="M3 19h18" />
    <path d="M6.5 12h1M6.5 15h1M15.7 8.5h1.6M15.7 11.5h1.6M15.7 14.5h1.6" />
  </svg>
);
const Forest = () => (
  <svg {...base}>
    <path d="m8 3.5 4.5 6.5H10l4 5.5H4l4-5.5H5.5Z" transform="translate(1 0)" />
    <path d="M9 15.5V20" />
    <path d="m17.5 8 3 4.5h-1.6L21.5 16h-6l2.6-3.5h-1.6Z" />
    <path d="M18.5 16v3.5" />
  </svg>
);
const Sky = () => (
  <svg {...base}>
    <circle cx="11.5" cy="12" r="4.2" />
    <path d="M4.2 15.3c-1.2-.9-1.8-1.8-1.6-2.6.4-1.5 3.6-2.2 7.6-1.8m5.7.8c3.4.6 5.8 1.7 5.5 3-.2.9-1.7 1.5-3.9 1.7" />
    <path d="M18.5 4.5v2.4M17.3 5.7h2.4" />
  </svg>
);

/* — Szenarien — */
const Falling = () => (
  <svg {...base}>
    <path d="M12 4v13" />
    <path d="m7.5 12.5 4.5 4.5 4.5-4.5" />
    <path d="M5 6.5 6.8 8M19 6.5 17.2 8" />
  </svg>
);
const Flying = () => (
  <svg {...base}>
    <path d="M3.5 9.5c2.5-2 4.6-2 6.5.3 1-2.9 2.8-3.9 5.5-3" />
    <path d="M8.5 16c2.1-1.7 3.9-1.7 5.5.2.8-2.4 2.3-3.2 4.5-2.5" />
  </svg>
);
const Chase = () => (
  <svg {...base}>
    <circle cx="15.6" cy="5.4" r="1.9" />
    <path d="M15 8.5 11.6 12l2.7 2.2-1 5" />
    <path d="m11.6 12-1.4 3.4-3 1.2" />
    <path d="M15.4 9.4 18.6 11l2 2.6" />
    <path d="M3 7.5h3.4M2.5 11h2.9" />
  </svg>
);
const Missing = () => (
  <svg {...base}>
    <path d="M3.5 8.5v-2h17v2a2 2 0 0 0 0 7v2h-17v-2a2 2 0 0 0 0-7Z" />
    <path d="M14.5 7.5v1.6m0 2.4v1.6m0 2.4v1.5" />
  </svg>
);
const Lost = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="8" />
    <path d="m15.2 8.8-1.8 4.6-4.6 1.8 1.8-4.6Z" />
  </svg>
);
const Exposed = () => (
  <svg {...base}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);
const Teeth = () => (
  <svg {...base}>
    <path d="M7.4 5.6c1.4-1.4 2.9-1.4 4.6-.4 1.7-1 3.2-1 4.6.4 1.8 1.8 1.1 4.9-.2 7.3-.8 1.5-.9 5.1-2.3 5.1-1.2 0-.9-3.2-2.1-3.2s-.9 3.2-2.1 3.2c-1.4 0-1.5-3.6-2.3-5.1-1.3-2.4-2-5.5-.2-7.3Z" />
  </svg>
);

/* — Wesen — */
const Animal = () => (
  <svg {...base}>
    <path d="M12 11.2c2.6 0 4.8 1.8 4.8 4.2 0 1.6-1.1 2.6-2.4 2.6-1 0-1.6-.5-2.4-.5s-1.4.5-2.4.5c-1.3 0-2.4-1-2.4-2.6 0-2.4 2.2-4.2 4.8-4.2Z" />
    <circle cx="7.2" cy="9" r="1.5" />
    <circle cx="12" cy="7.2" r="1.5" />
    <circle cx="16.8" cy="9" r="1.5" />
  </svg>
);
const Monster = () => (
  <svg {...base}>
    <path d="M7.5 7C6 5.8 5.2 4.4 5.5 3c1.6.3 2.9 1 3.7 2.2M16.5 7c1.5-1.2 2.3-2.6 2-4-1.6.3-2.9 1-3.7 2.2" />
    <path d="M12 4.8c3.9 0 6.5 2.8 6.5 6.6 0 3.4-2.2 6.8-6.5 6.8s-6.5-3.4-6.5-6.8c0-3.8 2.6-6.6 6.5-6.6Z" />
    <path d="m8.5 14.5 1.4 1 1.4-1 1.4 1 1.4-1 1.4 1" />
    <path d="M9.3 10.2h.01M14.7 10.2h.01" strokeWidth="2.4" />
  </svg>
);

/* — Menschen — */
const Family = () => (
  <svg {...base}>
    <circle cx="7.5" cy="7.6" r="2.4" />
    <path d="M2.8 19a4.7 4.7 0 0 1 9.4 0" />
    <circle cx="16.5" cy="7.6" r="2.4" />
    <path d="M14.2 12.6a4.7 4.7 0 0 1 7 4" />
    <circle cx="12.5" cy="13.6" r="1.7" />
    <path d="M9.4 19a3.2 3.2 0 0 1 6.2 0" />
  </svg>
);
const Stranger = () => (
  <svg {...base}>
    <circle cx="12" cy="8.2" r="3.6" strokeDasharray="2.6 2.6" />
    <path d="M5 20a7 7 0 0 1 14 0" strokeDasharray="2.6 2.6" />
  </svg>
);
const Partner = () => (
  <svg {...base}>
    <path d="M12 19.5C7 15.5 3.5 12.6 3.5 9.2 3.5 6.8 5.3 5 7.6 5c1.7 0 3.3 1 4.4 2.7C13.1 6 14.7 5 16.4 5c2.3 0 4.1 1.8 4.1 4.2 0 3.4-3.5 6.3-8.5 10.3Z" />
  </svg>
);

/* — Gefühle — */
const Fear = () => (
  <svg {...base}>
    <path d="M13.5 3.5 6 13h4.5L10 20.5 18 10.5h-4.5Z" />
  </svg>
);
const Joy = () => (
  <svg {...base}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9Z" />
    <path d="M18.5 15.8v2.6M17.2 17.1h2.6" />
  </svg>
);
const Grief = () => (
  <svg {...base}>
    <path d="M7 13.5a4 4 0 0 1-.6-8A5 5 0 0 1 16 4.4a4.4 4.4 0 0 1 1.5 8.6" />
    <path d="m9 16.5-1 3M13 16.5l-1 3M17 16.5l-1 3" />
  </svg>
);

const ICONS = {
  water: Water, home: Home, city: City, forest: Forest, sky: Sky,
  falling: Falling, flying: Flying, chase: Chase, missing: Missing,
  lost: Lost, exposed: Exposed, teeth: Teeth,
  animal: Animal, monster: Monster,
  family: Family, stranger: Stranger, partner: Partner,
  fear: Fear, joy: Joy, grief: Grief,
};

/** Das Icon eines Traumsymbols — Strichzeichnung, Emoji nur als Rückfall
 *  für Symbole, die hier (noch) nicht gezeichnet sind. */
export default function SymbolIcon({ id, className = "" }) {
  const Icon = ICONS[id];
  if (Icon) return <span className={className}><Icon /></span>;
  const emoji = symbolById(id)?.emoji;
  return emoji ? <span className={className}>{emoji}</span> : null;
}
