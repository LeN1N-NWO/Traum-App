import { useState } from "react";
import { t } from "../../i18n/index.js";
import "./profile.css";

/* The lucid dreaming guide — rebuilt 10.08.2026 from the evidence rather
 * than from folklore.
 *
 * Everything here traces to the International Lucid Dream Induction Study
 * (Aspy 2020, n=355, one week of practice) because it is the only large
 * head-to-head comparison of the popular techniques that exists. That has
 * consequences for what this screen says, and two of them are unusual:
 *
 *   1. The LEVERS come before the methods. In that study the choice of
 *      technique mattered less than falling asleep again within ten
 *      minutes (18.3 % vs 11.1 %) — so putting MILD at the top would
 *      have someone optimise the smaller variable first.
 *
 *   2. Reality checks are listed with their real result: adding them to
 *      MILD did NOT improve it. They are the single most recommended
 *      technique on the internet, so leaving that out would be the
 *      comfortable choice; a guide that tells you what actually failed
 *      is the only kind worth having at 3am.
 *
 * The screen is deliberately NOT a checklist — nothing here is ticked off,
 * and pretending it is would promise a result the evidence does not.
 */
export default function LucidGuide() {
  const [open, setOpen] = useState(null);
  /* ⚠ PRÜFSTAND (25.08., zweite Runde): zwei Gestalten für die Hebel —
     "a" Hauptbuch (die Zahl als goldene Spalte links), "b" Podest (die
     Zahl groß über dem Titel, plakatig). Umschalter nur im Dev-Modus;
     nach Antons Wahl einfrieren und ausmisten. */
  const [gestalt, setGestalt] = useState(() => {
    const v = import.meta.env.DEV ? sessionStorage.getItem("sl-luzid-gestalt") : null;
    return v === "b" ? "b" : "a";
  });

  return (
    <div className="p-lucid">
      <p className="sl-lede">{t.lucid.lede}</p>

      {/* The three things the data says matter most, as figures — a number
          that beat a technique is more persuasive than any adjective. */}
      <h2 className="p-lucid-head">{t.lucid.leversTitle}</h2>
      <div className={`p-levers p-lv-${gestalt}`}>
        {t.lucid.levers.map((l) => (
          <div className="p-lever" key={l.title}>
            <span className="p-lever-stat">{l.stat}</span>
            <span className="p-lever-body">
              <span className="p-lever-title">{l.title}</span>
              <span className="p-lever-text">{l.text}</span>
            </span>
          </div>
        ))}
      </div>

      {import.meta.env.DEV && (
        <div className="sl-dev-varianten" aria-hidden="true">
          {["a", "b"].map((v) => (
            <button
              key={v}
              className={"sl-dev-v" + (v === gestalt ? " sl-dev-v-on" : "")}
              onClick={() => { sessionStorage.setItem("sl-luzid-gestalt", v); setGestalt(v); }}
            >{v.toUpperCase()}</button>
          ))}
        </div>
      )}

      <h2 className="p-lucid-head">{t.lucid.methodsTitle}</h2>
      <div className="p-methods">
        {t.lucid.methods.map((m) => {
          const isOpen = open === m.id;
          return (
            <div className={"p-method" + (isOpen ? " p-method-open" : "")} key={m.id}>
              <button className="p-method-top"
                      onClick={() => setOpen(isOpen ? null : m.id)}
                      aria-expanded={isOpen}>
                <span className="p-method-head">
                  <span className="p-method-name">{m.name}</span>
                  {/* The success rate sits ON the closed card: the whole
                      point of this rewrite is that you can compare the
                      methods without opening any of them. */}
                  {m.rate && <span className="p-method-rate">{m.rate}</span>}
                </span>
                <span className="p-method-sum">{m.summary}</span>
                <span className="p-method-chev" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>

              {isOpen && (
                <div className="p-method-open-body">
                  <ol className="p-steps">
                    {m.steps.map((s, i) => (
                      <li className="p-step" key={i}>
                        <span className="p-step-n" aria-hidden="true">{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="p-method-note">{m.note}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="p-lucid-source">{t.lucid.sourceNote}</p>
    </div>
  );
}
