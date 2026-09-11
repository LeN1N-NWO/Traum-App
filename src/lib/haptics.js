/* Haptics — the one place the app touches the Taptic Engine (11.09.2026).
 *
 * Apple spends haptics sparingly and on MEANING, not on every tap: a
 * selection changing, an action with weight, an outcome. So the app derives
 * them from the same semantics a screen reader already gets — aria-pressed,
 * role="radio"/"tab", checkboxes — instead of sprinkling calls through the
 * fourteen components that carry them. A control that means "choose one of
 * these" ticks; `data-haptic="tap|press|none"` overrides where the meaning
 * is something else. Outcomes (a film arrived, something failed) are fired
 * by the code that knows about them.
 *
 * Off the device (browser, tests) all of this is a no-op. The plugin's web
 * fallback would call navigator.vibrate — a pager buzz on Android and
 * nothing on desktop, neither of which is the feel this is for. */
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

const isNative = () => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

// A missing or failing plugin must never break the tap that triggered it.
function fire(fn) {
  if (!isNative()) return;
  Promise.resolve().then(fn).catch(() => {});
}

export const haptic = {
  /* ⚠ UISelectionFeedbackGenerator only ticks between start and end —
     selectionChanged() on its own is silent on iOS. */
  select: () => fire(async () => {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  }),
  tap: () => fire(() => Haptics.impact({ style: ImpactStyle.Light })),
  press: () => fire(() => Haptics.impact({ style: ImpactStyle.Medium })),
  success: () => fire(() => Haptics.notification({ type: NotificationType.Success })),
  warning: () => fire(() => Haptics.notification({ type: NotificationType.Warning })),
  error: () => fire(() => Haptics.notification({ type: NotificationType.Error })),
};

export const SELECTION =
  '[aria-pressed], [role="radio"], [role="tab"], [role="switch"], input[type="checkbox"], input[type="radio"]';

/* Which feedback a click on this element deserves, or null. Takes anything
   with closest()/getAttribute(), so it is testable without a DOM. */
export function hapticFor(target) {
  const el = target?.closest?.(`[data-haptic], ${SELECTION}`);
  if (!el) return null;
  if (el.disabled || el.getAttribute?.("aria-disabled") === "true") return null;
  const explicit = el.getAttribute?.("data-haptic");
  if (explicit) return explicit === "none" || !(explicit in haptic) ? null : explicit;
  return "select";
}

/* One listener for the whole app, in the capture phase so a component that
   stops propagation still gets its tick. */
export function installHaptics(doc = globalThis.document) {
  if (!doc || !isNative()) return;
  doc.addEventListener("click", (e) => {
    const kind = hapticFor(e.target);
    if (kind) haptic[kind]();
  }, { capture: true, passive: true });
}
