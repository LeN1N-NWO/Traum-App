import { test, expect, describe } from "bun:test";
import { hapticFor, haptic, installHaptics } from "./haptics.js";

/* A stand-in for a DOM element: enough of closest() to walk up a chain of
   parents and match the three selector shapes haptics.js asks for. */
function el(attrs = {}, parent = null, props = {}) {
  const node = {
    parent, ...props,
    getAttribute: (k) => (k in attrs ? String(attrs[k]) : null),
    matches(sel) {
      return sel.split(",").map((s) => s.trim()).some((s) => {
        let m;
        if ((m = s.match(/^\[([\w-]+)\]$/))) return m[1] in attrs;
        if ((m = s.match(/^\[([\w-]+)="([^"]+)"\]$/))) return attrs[m[1]] === m[2];
        if ((m = s.match(/^input\[type="(\w+)"\]$/))) return props.tag === "input" && attrs.type === m[1];
        return false;
      });
    },
    closest(sel) {
      for (let n = node; n; n = n.parent) if (n.matches(sel)) return n;
      return null;
    },
  };
  return node;
}

describe("hapticFor — feedback follows meaning, not class names", () => {
  test("a choice ticks: aria-pressed, radio, tab, checkbox", () => {
    expect(hapticFor(el({ "aria-pressed": "false" }))).toBe("select");
    expect(hapticFor(el({ role: "radio" }))).toBe("select");
    expect(hapticFor(el({ role: "tab" }))).toBe("select");
    expect(hapticFor(el({ type: "checkbox" }, null, { tag: "input" }))).toBe("select");
  });

  test("a tap on the icon inside a tile still finds the tile", () => {
    const tile = el({ "aria-pressed": "true" });
    const icon = el({}, el({}, tile));
    expect(hapticFor(icon)).toBe("select");
  });

  test("an ordinary button stays silent — Apple does not buzz every tap", () => {
    expect(hapticFor(el({ class: "btn" }))).toBeNull();
    expect(hapticFor(null)).toBeNull();
  });

  test("data-haptic overrides, and 'none' or a typo mean nothing", () => {
    expect(hapticFor(el({ "data-haptic": "tap" }))).toBe("tap");
    expect(hapticFor(el({ "data-haptic": "none", "aria-pressed": "false" }))).toBeNull();
    expect(hapticFor(el({ "data-haptic": "buzz" }))).toBeNull();
  });

  test("a disabled control gives no feedback", () => {
    expect(hapticFor(el({ "aria-pressed": "false" }, null, { disabled: true }))).toBeNull();
    expect(hapticFor(el({ role: "radio", "aria-disabled": "true" }))).toBeNull();
  });
});

describe("off the device", () => {
  test("every haptic is a silent no-op and the listener is not installed", () => {
    for (const fn of Object.values(haptic)) expect(() => fn()).not.toThrow();
    let added = 0;
    installHaptics({ addEventListener: () => { added++; } });
    expect(added).toBe(0);
  });
});
