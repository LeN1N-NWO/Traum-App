import { useNavigate } from "react-router-dom";
import { useWizard } from "./useWizard.js";
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
  const wizard = useWizard();
  const { w, patch } = wizard;

  const Step = STEPS[w.step - 1];
  const back = () => (w.step > 1 ? patch({ step: w.step - 1 }) : navigate(-1));

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

      <Step {...wizard} />
    </main>
  );
}
