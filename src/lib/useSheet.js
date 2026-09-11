import { useCallback, useEffect, useRef, useState } from "react";

/* The behaviour of an iOS sheet, for any overlay in the app (11.09.2026).
 *
 * Before this, thirteen overlays each did their own thing: most appeared in
 * one frame and vanished in one frame, none could be pulled down, and the
 * three that animated rose by 14–18px — a nudge, not a sheet. This hook is
 * the one place that knows how a sheet moves, so the overlays keep their own
 * layout and borrow only the motion:
 *
 *   const sheet = useSheet(onClose);
 *   <div className="my-backdrop" {...sheet.backdropProps} onClick={sheet.close}>
 *     <div className="my-panel" {...sheet.panelProps}>…</div>
 *   </div>
 *
 * The motion itself lives in sheet.css, keyed on data-sheet-* attributes and
 * data-state ("enter" → "open" → "leaving"). Close through `sheet.close`,
 * not onClose directly — that is what gives the sheet time to leave.
 *
 * Two kinds: "sheet" (rises from below, pulled down to close — choices,
 * menus, settings) and "push" (a page sliding in from the side, swiped back
 * from the edge — content you open, like a dream from the journal). A
 * dream is not a dialog; showing it as one felt like a pop-up window
 * (Anton, 11.09.).
 *
 * ⚠ Touch, not pointer events. A pointer drag on something that can also
 *   scroll gets cancelled the moment WebKit decides it is a pan; only a
 *   non-passive touchmove can claim the gesture with preventDefault(). React
 *   registers touchmove as passive, so the listeners go on by hand. */

/* UIKit dismisses a page sheet at about a quarter of its height, or on a
   flick well before that. */
export const DISMISS_FRACTION = 0.25;
export const DISMISS_VELOCITY = 0.5;          // px per ms
/* Must equal --dur-fast in tokens.css: how long the leaving animation runs
   before the overlay is actually unmounted. useSheet.test.js checks it. */
export const LEAVE_MS = 200;
/* A pushed page (kind "push") slides in from the leading edge and goes back
   the same way, like a UINavigationController. It pops at half its width
   or on a flick, and only when the swipe STARTS at the edge — the middle of
   the page belongs to the carousel and to scrolling. POP_MS must equal
   --dur-pop. */
export const POP_MS = 300;
export const PUSH_FRACTION = 0.5;
export const EDGE_PX = 28;

export function shouldDismiss({ dy, height, velocity, fraction = DISMISS_FRACTION }) {
  if (!(dy > 0)) return false;
  if (velocity > DISMISS_VELOCITY && dy > 12) return true;
  return dy > (height || 0) * fraction;
}

/* Pulled the wrong way (up), the sheet gives way ever less — UIScrollView's
   rubber band, f(x) = (1 − 1/(x·c/d + 1))·d. */
export function rubberBand(offset, dimension = 120, c = 0.55) {
  if (!(offset < 0)) return offset;
  const x = -offset;
  return -(1 - 1 / ((x * c) / dimension + 1)) * dimension;
}

const reducedMotion = () => {
  try { return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true; }
  catch { return false; }
};

// Fields keep their own gestures: selecting text must not drag the sheet.
const NO_DRAG = "input, textarea, select, [contenteditable], [data-no-drag]";

// A drag only starts when everything between finger and panel is scrolled
// to the top — otherwise the finger means "scroll back up".
function atTop(target, panel) {
  for (let n = target; n && n.nodeType === 1; n = n.parentElement) {
    if (n.scrollTop > 0) return false;
    if (n === panel) return true;
  }
  return true;
}

// Open sheets, oldest first. Module-level: there is one screen.
const openSheets = [];

export function useSheet(onClose, { kind = "sheet" } = {}) {
  const push = kind === "push";
  const [state, setState] = useState(() => (reducedMotion() ? "open" : "enter"));
  const leaving = useRef(false);
  const backdropRef = useRef(null);
  const detach = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  /* close() plays the sheet out, then calls onClose. close(fn) calls fn
     instead — for a sheet whose "Done" carries a value:
       onClick={() => sheet.close(() => onDone(choice))}
     Used directly as a handler, close receives the click event; anything
     that is not a function is ignored, so onClick={sheet.close} is fine. */
  const close = useCallback((after) => {
    if (leaving.current) return;
    leaving.current = true;
    const finish = typeof after === "function" ? after : () => onCloseRef.current?.();
    // Let the veil transition from wherever a drag left it.
    backdropRef.current?.style.removeProperty("--sheet-drag");
    backdropRef.current?.style.removeProperty("transition");
    if (reducedMotion()) { finish(); return; }
    setState("leaving");
    setTimeout(finish, push ? POP_MS : LEAVE_MS);
  }, [push]);

  /* Escape closes the TOP sheet only. Sheets stack — the entry menu opens
     over the journal entry — and every hook listens on the same document,
     parent first. Without the stack one keypress would close both. */
  useEffect(() => {
    const me = Symbol("sheet");
    openSheets.push(me);
    const onKey = (e) => {
      if (e.key === "Escape" && openSheets[openSheets.length - 1] === me) close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      const i = openSheets.indexOf(me);
      if (i >= 0) openSheets.splice(i, 1);
    };
  }, [close]);

  /* ⚠ No effect cleanup for the touch listeners. React 18 StrictMode plays
     every effect mount → cleanup → mount in development, but does NOT call
     the ref again — a cleanup here detached the listeners for good, and
     sheets could not be dragged in dev (and so in the simulator, which runs
     the dev server). React calls the ref with null on a real unmount; that
     is where they come off.

     The enter → open switch normally follows animationend. The timer is the
     net for when that event never comes (a hidden tab, an interrupted
     animation) — without it the sheet would stay in "enter", and releasing
     a drag would replay the entrance. */
  useEffect(() => {
    if (state !== "enter") return;
    const id = setTimeout(() => setState((s) => (s === "enter" ? "open" : s)), push ? 520 : 560);
    return () => clearTimeout(id);
  }, [state, push]);

  /* A callback ref, so the listeners follow the panel even if it mounts
     after the hook (a dialog that renders its body once data is there). */
  const panelRef = useCallback((panel) => {
    detach.current?.();
    detach.current = null;
    if (!panel) return;

    let phase = "idle";                    // idle | pending | drag | blocked
    let y0 = 0, x0 = 0, last = 0, lastT = 0, v = 0, off = 0;
    /* One gesture, two axes. `along` is the direction that dismisses:
       down for a sheet, towards the trailing edge for a pushed page (right
       in LTR, left in RTL). `across` is everything else. */
    const rtl = () => getComputedStyle(panel).direction === "rtl";
    const along = (t) => (push ? (rtl() ? x0 - t.clientX : t.clientX - x0) : t.clientY - y0);
    const across = (t) => (push ? t.clientY - y0 : t.clientX - x0);
    const pos = (t) => (push ? (rtl() ? -t.clientX : t.clientX) : t.clientY);
    const size = () => (push ? panel.offsetWidth : panel.offsetHeight) || 1;

    const onStart = (e) => {
      if (leaving.current || e.touches.length !== 1) { phase = "blocked"; return; }
      const t = e.touches[0];
      y0 = t.clientY; x0 = t.clientX; last = pos(t); lastT = e.timeStamp; v = 0; off = 0;
      if (push) {
        const fromEdge = rtl() ? window.innerWidth - t.clientX : t.clientX;
        if (fromEdge > EDGE_PX) { phase = "blocked"; return; }
      }
      /* Sheets nest (the entry menu lives inside the entry's DOM). A touch
         that belongs to an inner sheet or its veil is not this sheet's. */
      const owner = e.target.closest?.("[data-sheet-panel], [data-sheet-backdrop]");
      phase = (owner && owner !== panel) || e.target.closest?.(NO_DRAG) || (!push && !atTop(e.target, panel))
        ? "blocked" : "pending";
    };
    const onMove = (e) => {
      if (phase !== "pending" && phase !== "drag") return;
      const t = e.touches[0];
      const d = along(t), c = across(t);
      if (phase === "pending") {
        if (Math.abs(d) < 6 && Math.abs(c) < 6) return;
        // The wrong way or across is not ours: let the content scroll.
        if (d <= 0 || Math.abs(c) > Math.abs(d)) { phase = "blocked"; return; }
        phase = "drag";
        panel.setAttribute("data-dragging", "");
        panel.style.transition = "none";
        if (backdropRef.current) backdropRef.current.style.transition = "none";
      }
      if (e.cancelable) e.preventDefault();
      const dt = e.timeStamp - lastT;
      if (dt > 0) v = (pos(t) - last) / dt;
      last = pos(t); lastT = e.timeStamp;
      off = rubberBand(d);
      panel.style.translate = push ? `${rtl() ? -off : off}px 0` : `0 ${off}px`;
      const p = Math.min(Math.max(off / size(), 0), 1);
      backdropRef.current?.style.setProperty("--sheet-drag", p.toFixed(3));
    };
    const onEnd = (e) => {
      if (phase !== "drag") { phase = "idle"; return; }
      phase = "idle";
      /* A finger that rested before lifting has no speed. Without this the
         last move's speed survived the pause, and pull — hold — let go
         counted as a flick and closed the sheet (measured 11.09.). UIKit
         reads velocity at the moment of release; so does this. */
      if (e.timeStamp - lastT > 80) v = 0;
      panel.removeAttribute("data-dragging");
      panel.style.transition = "";
      if (shouldDismiss({ dy: off, height: size(), velocity: v, fraction: push ? PUSH_FRACTION : DISMISS_FRACTION })) {
        close();                           // sinks from where the finger let go
        return;
      }
      // Not far enough: back up on the sheet curve.
      panel.style.transition = "translate var(--dur-base) var(--ease-ios)";
      panel.style.translate = "";
      const b = backdropRef.current;
      if (b) { b.style.removeProperty("transition"); b.style.removeProperty("--sheet-drag"); }
      panel.addEventListener("transitionend", () => { panel.style.transition = ""; }, { once: true });
    };
    const onAnimEnd = (e) => {
      if (e.target === panel && (e.animationName === "sheet-rise" || e.animationName === "push-in")) {
        setState((s) => (s === "enter" ? "open" : s));
      }
    };

    panel.addEventListener("touchstart", onStart, { passive: true });
    panel.addEventListener("touchmove", onMove, { passive: false });
    panel.addEventListener("touchend", onEnd, { passive: true });
    panel.addEventListener("touchcancel", onEnd, { passive: true });
    panel.addEventListener("animationend", onAnimEnd);
    detach.current = () => {
      panel.removeEventListener("touchstart", onStart);
      panel.removeEventListener("touchmove", onMove);
      panel.removeEventListener("touchend", onEnd);
      panel.removeEventListener("touchcancel", onEnd);
      panel.removeEventListener("animationend", onAnimEnd);
    };
  }, [close, push]);

  return {
    state,
    close,
    backdropProps: { ref: backdropRef, "data-sheet-backdrop": "", "data-state": state },
    panelProps: { ref: panelRef, "data-sheet-panel": "", "data-sheet-kind": kind, "data-state": state },
  };
}
