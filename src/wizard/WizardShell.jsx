import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWizard } from "./useWizard.js";
import { analyze } from "../lib/api.js";
import { useAppState } from "../state/AppState.jsx";
import { t } from "../i18n/index.js";
import Step1Dream from "./Step1Dream.jsx";
import Step2Output from "./Step2Output.jsx";
import Step3Cast from "./Step3Cast.jsx";
import Step4Places from "./Step4Places.jsx";
import Step5Style from "./Step5Style.jsx";
import Step6Result from "./Step6Result.jsx";
import "./wizard.css";

const STEPS = [Step1Dream, Step2Output, Step3Cast, Step4Places, Step5Style, Step6Result];

/* Full-screen flow over the tab bar: while capturing a dream there is nothing
   to be distracted by, only back, cancel and where you are. */
export default function WizardShell() {
  const navigate = useNavigate();
  const { toast } = useAppState();
  const wizard = useWizard();
  const { w, patch, seedAssignments } = wizard;

  /* Arriving from a dream that already exists — "make pictures of this one".
     The journal hands the whole dream over through the router, so the first
     two steps have nothing left to ask and are skipped. */
  const resume = useLocation().state?.resume || null;
  const [seeding, setSeeding] = useState(!!resume);
  const done = useRef(false);

  useEffect(() => {
    if (!resume || done.current) return;
    done.current = true;
    (async () => {
      /* Dreams written before the analysis was kept on the entry have to be
         read once more. It is the same free call step 1 makes, so continuing
         an old dream costs no more than a new one. */
      let analysis = resume.analysis;
      if (!analysis) {
        try {
          analysis = await analyze(resume.text);
        } catch (err) {
          console.error("[DreamRushes] analyze on resume failed:", err);
          // Not fatal: without it there is simply nobody to cast, and the
          // remaining steps (style, length, render) work as they always did.
          toast(`⚠ ${err.message}`);
        }
      }
      patch({
        entryId: resume.entryId,
        // The dream's own images ride along; the first is the default
        // keyframe until the person picks another in the film step.
        sourceUrls: resume.urls?.length ? resume.urls : null,
        keyframe: resume.urls?.[0] || null,
        text: resume.text,
        originalText: resume.originalText || resume.text,
        title: resume.title || analysis?.title || "",
        tagline: resume.tagline || analysis?.tagline || "",
        analysis: analysis || null,
        mode: resume.mode,
        styleId: analysis?.style || "dreamlike",
        step: 3,
      });
      if (analysis) seedAssignments(analysis);
      setSeeding(false);
    })();
  }, [resume, patch, seedAssignments, toast]);

  const Step = STEPS[w.step - 1];
  // Back out of a resumed dream goes to the journal it came from, not to a
  // step 2 that was never shown.
  const floor = resume ? 3 : 1;
  const back = () => (w.step > floor ? patch({ step: w.step - 1 }) : navigate(-1));

  return (
    <main className="screen wiz">
      <header className="wiz-top">
        <button className="wiz-back" onClick={back} aria-label={t.wizard.back}>←</button>
        <ol className="wiz-dots" aria-label={t.wizard.progress(w.step, STEPS.length)}>
          {STEPS.map((_, i) => (
            <li
              key={i}
              className={"wiz-dot" + (i + 1 === w.step ? " wiz-dot-now" : i + 1 < w.step ? " wiz-dot-done" : "")}
              aria-current={i + 1 === w.step ? "step" : undefined}
            />
          ))}
        </ol>
        <button className="wiz-cancel" onClick={() => navigate("/")}>{t.wizard.cancel}</button>
      </header>

      {seeding ? (
        <section className="wiz-body">
          <div className="wiz-rendering" role="status" aria-live="polite">
            <div className="wiz-spinner" aria-hidden="true" />
            <p className="wiz-busy-text">{t.dream.reading}</p>
          </div>
        </section>
      ) : (
        <Step {...wizard} />
      )}
    </main>
  );
}
