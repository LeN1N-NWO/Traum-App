import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

/* Leaving the wizard REPLACES its history entry (11.09.2026). A finished or
   cancelled flow that stays in the history is one back-gesture away from
   reopening — on Android's back button today, on any swipe-back tomorrow.
   A bare navigate("/journal") or navigate("/") in these files is that bug. */
test("every exit from the wizard replaces its history entry", () => {
  for (const f of ["WizardShell.jsx", "Step2Output.jsx", "Step5Style.jsx", "Step6Result.jsx"]) {
    const src = readFileSync(new URL("./" + f, import.meta.url), "utf8");
    const bare = src.match(/navigate\("\/(journal)?"\)/g) || [];
    expect({ file: f, bare }).toEqual({ file: f, bare: [] });
  }
});
