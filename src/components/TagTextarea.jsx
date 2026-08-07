import { useRef } from "react";
import { findTagSpans } from "../lib/tags.js";
import "./TagTextarea.css";

/* A textarea that shows which words name someone from the profile.
 *
 * A <textarea> cannot hold styled elements, so an identical layer sits behind
 * it carrying the same text with the names marked; the textarea itself is
 * transparent and keeps the caret, selection, voice input and resizing.
 *
 * Both boxes MUST share font, size, line height, padding and border — that is
 * why the same className goes to both. Any difference and the marks drift off
 * their words.
 *
 * The marks are React elements, not innerHTML: nothing to escape, because
 * nothing is ever parsed as markup.
 */
export default function TagTextarea({ value = "", tags = [], className = "", onScroll, ...rest }) {
  const mirror = useRef(null);
  const spans = findTagSpans(value, tags);

  const parts = [];
  let pos = 0;
  spans.forEach((s, i) => {
    if (s.start > pos) parts.push(value.slice(pos, s.start));
    parts.push(<mark key={`${s.start}-${i}`}>{value.slice(s.start, s.end)}</mark>);
    pos = s.end;
  });
  // Trailing newline: without it the mirror clips a final empty line and the
  // last row of marks sits one line too high.
  parts.push(value.slice(pos) + "\n");

  return (
    <div className="tt-wrap">
      <div className={`tt-mirror ${className}`} aria-hidden="true" ref={mirror}>
        {parts}
      </div>
      <textarea
        className={`tt-input ${className}`}
        value={value}
        onScroll={(e) => {
          if (mirror.current) mirror.current.scrollTop = e.target.scrollTop;
          onScroll?.(e);
        }}
        {...rest}
      />
    </div>
  );
}
