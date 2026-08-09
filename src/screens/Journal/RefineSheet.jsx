import { useEffect, useRef } from "react";
import { t } from "../../i18n/index.js";
import { IconSpellcheck, IconSparkle, IconBook } from "../../components/icons.jsx";
import "./journal.css";

/* "Rewrite" is three different jobs wearing one word, so it asks which.
 *
 * The three map exactly onto REFINE_MODES in server.js — that is the whole
 * point of this screen: each option is a different SYSTEM PROMPT, not a
 * different button. The rules those prompts carry (nothing invented, no
 * events added, same order, same language, same person) are what make it
 * safe to hand someone's dream to a language model at all, so the wording
 * lives there, in one place, and this sheet only names them.
 *
 * A sheet rather than a menu: each option needs a line of explanation —
 * "fix spelling" and "work out the storytelling" are not obviously
 * different at a glance, and picking the wrong one costs a round trip and
 * a rewritten dream to discover.
 */
export default function RefineSheet({ onPick, onClose }) {
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const options = [
    { mode: "correct",   Icon: IconSpellcheck, title: t.journal.correct,   hint: t.journal.correctHint },
    { mode: "rewrite",   Icon: IconSparkle,    title: t.journal.rewrite,   hint: t.journal.rewriteHint },
    { mode: "elaborate", Icon: IconBook,       title: t.journal.elaborate, hint: t.journal.elaborateHint },
  ];

  return (
    <div className="j-sheet-backdrop" onClick={onClose}>
      <div
        className="j-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t.journal.refinePickTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="j-sheet-title">{t.journal.refinePickTitle}</p>
        <p className="j-sheet-lede">{t.journal.refinePickLede}</p>

        {options.map(({ mode, Icon, title, hint }, i) => (
          <button
            key={mode}
            ref={i === 0 ? firstRef : null}
            className="j-sheet-item"
            onClick={() => onPick(mode)}
          >
            <span className="j-sheet-icon"><Icon /></span>
            <span className="j-sheet-body">
              <span className="j-sheet-name">{title}</span>
              <span className="j-sheet-hint">{hint}</span>
            </span>
            <span className="j-sheet-free">{t.wizard.free}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
