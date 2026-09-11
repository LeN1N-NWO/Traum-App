import LegacyApp from "@/legacy/legacy-app";

/* Vollbild, ohne Ränder: Die alte App zeichnet Safe Areas selbst
   (viewport-fit=cover, env(safe-area-inset-*) in base.css). */
export default function Index() {
  return (
    <LegacyApp
      dom={{
        style: { flex: 1, backgroundColor: "#0a0d16" },
        contentInsetAdjustmentBehavior: "never",
        scrollEnabled: true,
      }}
    />
  );
}
