import { zodiacGlyph } from "../../lib/zodiac.js";
import { t } from "../../i18n/index.js";
import "./profile.css";

/* What the welcome survey collected, shown back.
 *
 * Until 10.08.2026 the survey asked six questions and then everything
 * vanished into `state.profile`, where nothing read it. That is worse than
 * not asking: someone spends two minutes telling an app how they dream, and
 * the app never mentions it again. This card is the minimum that makes the
 * asking honest — you can see what was understood, and correct it by taking
 * the survey again.
 *
 * Deliberately NOT a horoscope. The star sign is displayed the way a name is
 * displayed — as something they told us — and nothing anywhere predicts from
 * it. The app's standing rule is that it does not interpret dreams; a
 * fortune-telling feature would break that in the one place people are most
 * inclined to believe it.
 */
export default function DreamerCard({ profile, onRetake }) {
  if (!profile) return null;

  const sign = profile.zodiac;
  const themes = (profile.themes || []).filter(Boolean);

  /* Each row only appears if it was actually answered — every question was
     skippable, and a row reading "—" would turn a deliberate skip into a
     gap someone feels they should fill. */
  const facts = [
    profile.recall && [t.dreamer.recall, t.dreamer.recallValues[profile.recall] || profile.recall],
    profile.lucid && [t.dreamer.lucid, t.dreamer.lucidValues[profile.lucid] || profile.lucid],
    profile.goal && [t.dreamer.goal, t.dreamer.goalValues[profile.goal] || profile.goal],
  ].filter(Boolean);

  if (!sign && !themes.length && !facts.length) return null;

  return (
    <section className="p-dreamer">
      <div className="p-dreamer-top">
        <h2 className="p-dreamer-title">{t.dreamer.title}</h2>
        <button className="p-dreamer-redo" onClick={onRetake}>{t.dreamer.retake}</button>
      </div>

      {sign && (
        <div className="p-sign">
          <span className="p-sign-glyph" aria-hidden="true">{zodiacGlyph(sign)}</span>
          <span className="p-sign-name">{t.dreamer.signs[sign] || sign}</span>
        </div>
      )}

      {facts.length > 0 && (
        <dl className="p-facts">
          {facts.map(([label, value]) => (
            <div className="p-fact" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {themes.length > 0 && (
        <>
          <p className="p-themes-label">{t.dreamer.themes}</p>
          <ul className="p-themes">
            {themes.map((theme) => (
              <li className="p-theme" key={theme}>{theme}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
