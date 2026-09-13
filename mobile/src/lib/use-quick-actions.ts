import * as QuickActions from "expo-quick-actions";
import { useQuickActionRouting } from "expo-quick-actions/router";
import { useEffect } from "react";

/* Die Schnellaktionen am App-Symbol (13.09.2026, Gratis-Feature §10):
 * lange drücken → „Traum aufnehmen" öffnet den Traum-Tab, dessen Rekorder
 * beim Fokus sofort aufnimmt. Ein Druck vom Home-Bildschirm bis zur
 * laufenden Aufnahme — der kürzeste Weg nach dem Aufwachen, noch vor dem
 * Widget. Dazu „Atmen" für den Abend.
 *
 * Dynamische Einträge (zur Laufzeit gesetzt), deshalb ohne prebuild; die
 * Texte kommen aus der Brücke, damit sie die Sprache der App sprechen. */
export function useQuickActions(labels: { record?: string; breathe?: string } | null) {
  useQuickActionRouting();
  useEffect(() => {
    if (!labels?.record) return;
    QuickActions.setItems([
      { id: "record", title: labels.record, icon: "symbol:mic.fill", params: { href: "/dream" } },
      ...(labels.breathe ? [{ id: "breathe", title: labels.breathe, icon: "symbol:wind", params: { href: "/sleep/breathe" } }] : []),
    ]).catch(() => {});
  }, [labels?.record, labels?.breathe]);
}
