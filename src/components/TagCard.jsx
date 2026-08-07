import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { t } from "../i18n/index.js";
import "./TagCard.css";

const GAP = 8;    // between the word and the card
const EDGE = 12;  // never closer than this to the edge of the screen

/* What the app knows about a name, shown next to the word in the dream text.
 *
 * Deliberately not a modal: focus stays in the field so writing can continue,
 * and the next keystroke closes it again. Glancing at a face should not cost
 * anyone their place in the sentence.
 */
export default function TagCard({ avatar, anchor, onClose }) {
  const box = useRef(null);
  const [pos, setPos] = useState(null);

  // Measure, then place. The height is only known once the description has
  // wrapped, and until then there is no way to tell whether the card still
  // fits below the word.
  useLayoutEffect(() => {
    const r = box.current.getBoundingClientRect();
    const below = anchor.bottom + GAP;
    const above = anchor.top - GAP - r.height;
    setPos({
      left: Math.max(EDGE, Math.min(anchor.left, window.innerWidth - r.width - EDGE)),
      top: below + r.height <= window.innerHeight - EDGE ? below
         : above >= EDGE ? above
         : Math.max(EDGE, window.innerHeight - r.height - EDGE),
    });
  }, [anchor]);

  // Anything that moves the word out from under the card closes it: a card
  // pointing at nothing is worse than no card. Typing counts — the text
  // changes, so the marks move.
  useEffect(() => {
    const outside = (e) => { if (!box.current?.contains(e.target)) onClose(); };
    window.addEventListener("keydown", onClose);
    window.addEventListener("pointerdown", outside, true);
    window.addEventListener("scroll", onClose, true);   // capture: the field scrolls too
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("keydown", onClose);
      window.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  const category = t.tagCard.categories[avatar.category] || t.tagCard.categories.person;

  return (
    <div
      ref={box}
      className="tc-card"
      role="note"
      aria-label={t.tagCard.label(avatar.tag)}
      style={{
        left: pos ? pos.left : 0,
        top: pos ? pos.top : 0,
        // Hidden for the one frame it takes to measure — otherwise it flashes
        // in the top left corner first.
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {avatar.img
        ? <img className="tc-img" src={avatar.img} alt="" />
        : <div className="tc-img tc-no-image" aria-hidden="true">?</div>}

      <div className="tc-body">
        <p className="tc-tag">@{avatar.tag}</p>
        <p className="tc-cat">{category}</p>
        {avatar.desc
          ? <p className="tc-desc">{avatar.desc}</p>
          : <p className="tc-desc tc-faint">{t.tagCard.photoOnly}</p>}
      </div>

      <button className="tc-close" onClick={onClose} aria-label={t.tagCard.close}>×</button>
    </div>
  );
}
