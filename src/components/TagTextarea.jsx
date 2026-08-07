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
 *
 * onTagClick(tag, rect) fires when a mark is clicked. The component stays
 * ignorant of what a tag means — it reports the name and where it sits on
 * screen; the caller decides what to show.
 */
export default function TagTextarea({
  value = "", tags = [], className = "", onScroll, onTagClick, ...rest
}) {
  const mirror = useRef(null);
  const spans = findTagSpans(value, tags);

  const parts = [];
  let pos = 0;
  spans.forEach((s, i) => {
    if (s.start > pos) parts.push(value.slice(pos, s.start));
    parts.push(
      <mark key={`${s.start}-${i}`} data-tag={s.tag}>{value.slice(s.start, s.end)}</mark>
    );
    pos = s.end;
  });
  // Trailing newline: without it the mirror clips a final empty line and the
  // last row of marks sits one line too high.
  parts.push(value.slice(pos) + "\n");

  /* Which mark lies under a point.
   *
   * The textarea is on top and swallows every pointer event, so the marks
   * cannot be clicked directly — we hit-test their geometry instead. That is
   * also the more honest test: it asks about the pill the person actually
   * sees, not about a caret index they cannot see.
   *
   * getClientRects(), not getBoundingClientRect(): a mark that wraps across
   * two lines has one rect per line, and the box bounding both spans the full
   * width of the field — it would answer "yes" far away from the word.
   * Marks scrolled out of view need no special case, their rects lie outside
   * the field and no click inside it can land there.
   */
  function markAt(x, y) {
    for (const m of mirror.current?.querySelectorAll("mark") || []) {
      for (const r of m.getClientRects()) {
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          return { tag: m.dataset.tag, rect: r };
        }
      }
    }
    return null;
  }

  function handleClick(e) {
    // A drag that ends on a mark is a text selection, not a click on the word.
    if (e.target.selectionStart !== e.target.selectionEnd) return;
    const hit = markAt(e.clientX, e.clientY);
    if (hit) onTagClick(hit.tag, hit.rect);
  }

  // Without this nothing says the word can be clicked at all. Written straight
  // to style instead of through state: this runs on every mouse move, and a
  // re-render per pixel would cost more than the highlighting itself.
  function handleMove(e) {
    const want = markAt(e.clientX, e.clientY) ? "pointer" : "";
    if (e.currentTarget.style.cursor !== want) e.currentTarget.style.cursor = want;
  }

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
        onClick={onTagClick ? handleClick : undefined}
        onMouseMove={onTagClick ? handleMove : undefined}
        {...rest}
      />
    </div>
  );
}
