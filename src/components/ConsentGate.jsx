import { useState } from "react";
import { useAppState } from "../state/AppState.jsx";
import { consentPatch } from "../lib/consent.js";
import { t } from "../i18n/index.js";
import Button from "./Button.jsx";
import "./ConsentGate.css";

/* Das Einwilligungs-Tor — steht NACH der Sprachwahl (damit es übersetzt
 * ist) und VOR Onboarding und App (denn schon das Stimm-Interview schickt
 * Daten an Google). Warum es das gibt: docs/plans/2026-08-20-recht-
 * einwilligung.md.
 *
 * Drei EIGENE Häkchen, keins vorangekreuzt — eine Sammelzustimmung wäre
 * DSGVO-seitig keine (Art. 7: granular, aktiv, nachweisbar):
 *   1. Nutzungsbedingungen + Datenschutz
 *   2. Datenverarbeitung durch die benannten KI-Anbieter (der Kern:
 *      Fotos und Traumtexte verlassen das Gerät)
 *   3. Volljährigkeit (Antons Entscheidung: 18+, selbst erklärt —
 *      zusammen mit der Store-Alterseinstufung der übliche Standard,
 *      ein Ausweis-Check wäre für diese App-Kategorie unverhältnismäßig)
 *
 * „Wohin gehen meine Daten?" ist aufklappbar und nennt Anbieter UND
 * Trainingslage (recherchiert 20.08.) — die ehrlichen Kurzzeilen an den
 * Handlungsorten (dream.privacy, avatarDialog.privacy) bleiben daneben
 * bestehen. Die Texte hier redigiert vor dem Store-Launch ein Anwalt;
 * ändern sie sich inhaltlich, zählt CONSENT_VERSION hoch und das Tor
 * kommt wieder (consent.js). */
export default function ConsentGate() {
  const { update } = useAppState();
  const [terms, setTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adult, setAdult] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const rows = [
    { key: "terms", checked: terms, set: setTerms, label: t.consent.terms },
    { key: "processing", checked: processing, set: setProcessing, label: t.consent.processing },
    { key: "adult", checked: adult, set: setAdult, label: t.consent.adult },
  ];
  const all = terms && processing && adult;

  return (
    <main className="consent" aria-label={t.consent.title}>
      <div className="consent-card">
        <h1 className="consent-title">{t.consent.title}</h1>
        <p className="consent-intro">{t.consent.intro}</p>

        {rows.map((r) => (
          <label key={r.key} className="consent-row">
            <input
              type="checkbox"
              checked={r.checked}
              onChange={(e) => r.set(e.target.checked)}
            />
            <span>{r.label}</span>
          </label>
        ))}

        <button
          type="button"
          className="consent-more"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((v) => !v)}
        >
          {t.consent.more}
        </button>
        {showDetails && (
          <ul className="consent-details">
            {t.consent.details.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        )}

        <Button onClick={() => update(consentPatch())} disabled={!all}>
          {t.consent.cta}
        </Button>
      </div>
    </main>
  );
}
