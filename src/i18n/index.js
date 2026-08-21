/* Language selection.
 *
 * `t` is a stable OBJECT, never reassigned — every component does
 * `import { t } from "../i18n/index.js"` and reads `t.xxx.yyy` fresh on
 * every render. setLanguage() mutates t's own keys in place
 * (Object.assign) instead of swapping the export binding, which is what
 * lets one function switch the whole app's language without touching any
 * of the ~40 files that already import `t` — they were never holding a
 * reference to a translation, only to this one object, and object property
 * reads are live.
 *
 * The stored choice is read directly from localStorage at module load —
 * not through AppState, which does not exist yet at this point in the
 * import graph — so `t` is already correct before the first render, no
 * flash of English while state.language catches up.
 */
import en from "./en.js";
import de from "./de.js";
import es from "./es.js";
import fr from "./fr.js";
import zh from "./zh.js";
import hi from "./hi.js";
import ar from "./ar.js";
import { LOCALES, DEFAULT_LOCALE, localeOf } from "../lib/locales.js";

const MODULES = { en, de, es, fr, zh, hi, ar };
const DB_KEY = "dreamrushes_v1";

export const t = { ...en };

/* Fehlende Übersetzungen fallen auf Englisch zurück (Antons Regel vom
 * 21.08.: neue Texte werden bis kurz vor Launch nur in en.js und de.js
 * gepflegt, die übrigen fünf Sprachen bekommen EINE Sammelübersetzung am
 * Ende — „sonst übersetzen wir uns dumm und dämlich"). Ohne diesen Merge
 * wäre ein fehlender Schlüssel ein `undefined` mitten im UI; mit ihm ist
 * er ein englischer Satz in einer spanischen App — nicht schön, aber
 * lesbar, und genau der Zustand, den die Regel bewusst in Kauf nimmt.
 *
 * Funktionen und Arrays werden als GANZES übernommen oder als Ganzes
 * geerbt, nie gemischt — ein halb übersetztes details-Array wäre
 * schlimmer als ein englisches. */
function withFallback(base, over) {
  if (over === undefined) return base;
  const mergeable = (v) => v && typeof v === "object" && !Array.isArray(v);
  if (!mergeable(base) || !mergeable(over)) return over;
  const out = {};
  for (const k of Object.keys(base)) out[k] = withFallback(base[k], over[k]);
  // Schlüssel, die nur die Übersetzung hat, bleiben erhalten (der
  // Shape-Check meldet sie als Tippfehler — aber verlieren wollen wir
  // zur Laufzeit nichts).
  for (const k of Object.keys(over)) if (!(k in out)) out[k] = over[k];
  return out;
}

/** Everything a language switch touches: the copy object, and the two DOM
 *  attributes that tell the browser (and screen readers) which direction
 *  and language the page is actually in. */
export function setLanguage(id) {
  const locale = localeOf(id);
  Object.assign(t, withFallback(en, MODULES[locale.id] || en));
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale.id;
    document.documentElement.dir = locale.rtl ? "rtl" : "ltr";
  }
  return locale;
}

function storedLanguage() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = JSON.parse(localStorage.getItem(DB_KEY));
    return typeof raw?.language === "string" ? raw.language : null;
  } catch {
    return null;
  }
}

// Applied once, at import time — before AppStateProvider or any screen
// has rendered a single node.
setLanguage(storedLanguage() || DEFAULT_LOCALE);

export { LOCALES };
export default t;
