import { NativeTabs } from "expo-router/unstable-native-tabs";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { ConsentGate } from "@/components/consent-gate";
import { DreamSyncLayer } from "@/components/dream-sync-layer";
import { GlimpseLayer } from "@/components/glimpse-layer";
import { MascotTapLayer } from "@/components/mascot-tap";
import { OnboardingGate } from "@/components/onboarding-gate";
import { PrivacyGate } from "@/components/privacy-gate";
import { Toasts } from "@/components/toasts";
import { useJournalStore } from "@/store/journal-store";

/* Die native Tab-Leiste — auf iOS 26 Liquid Glass vom System, auf Android
   Material 3. Fünf Tabs, der Traum in der Mitte mit gefülltem Plus (Antons
   Festlegung 11.09.: „nicht mehr so oben", dafür echt). Fünf ist genau das
   Android-Maximum. Jeder Tab zeigt heute den passenden Bildschirm der
   alten Oberfläche (LegacyTab); nativ werden sie einer nach dem anderen. */
export default function RootLayout() {
  /* ⚠ Einmal um ALLES: Ohne diese Wurzel erkennt react-native-gesture-handler
     keine Gesten („GestureDetector must be used as a descendant of
     GestureHandlerRootView") — Befund 13.09. beim Deck-Fächer. */
  /* Die Beschriftungen kommen aus der Brücke wie jeder andere Text, damit
     der Sprachwechsel sie erreicht; bis der erste Stand da ist, Englisch. */
  const L = useJournalStore()?.labels;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      {/* Kein Schrumpfen beim Scrollen (Antons Befund 25.09.: „oft kann ich die
          Menü-Buttons nicht anklicken"). Zusammengeschrumpft zeigt iOS 26 nur
          den aktuellen Tab; ein Tipp auf die alte Stelle der anderen klappt
          die Leiste bloß wieder auf, statt zu wechseln. */}
      <NativeTabs tintColor="#8cc0ff" minimizeBehavior="never">
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf={{ default: "moon.stars", selected: "moon.stars.fill" }} md="bedtime" />
          <NativeTabs.Trigger.Label>{L?.tabHome ?? "Home"}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="journal">
          <NativeTabs.Trigger.Icon sf={{ default: "book.closed", selected: "book.closed.fill" }} md="menu_book" />
          <NativeTabs.Trigger.Label>{L?.tabJournal ?? "Journal"}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="dream">
          <NativeTabs.Trigger.Icon sf="plus.circle.fill" md="add_circle" />
          <NativeTabs.Trigger.Label>{L?.tabDream ?? "Dream"}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="sleep">
          <NativeTabs.Trigger.Icon sf={{ default: "bed.double", selected: "bed.double.fill" }} md="bed" />
          <NativeTabs.Trigger.Label>{L?.tabSleep ?? "Sleep"}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md="person" />
          <NativeTabs.Trigger.Label>{L?.tabProfile ?? "Profile"}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      {/* Der Frosch-Tipp über allem (13.09.2026), unter Tor und Toasts. */}
      <MascotTapLayer />
      <ConsentGate />
      {/* Konto-Sicherung der Träume (23.09.), unsichtbar. */}
      <DreamSyncLayer />
      {/* Glimpses entstehen im Hintergrund (26.09.), unsichtbar. */}
      <GlimpseLayer />
      {/* Nur im Entwicklungsbau, bei jedem Start (Antons Wunsch 13.09.). */}
      <OnboardingGate />
      <Toasts />
      {/* Der Face-ID-Schutz, ganz zuletzt: deckt alles darunter ab (22.09.). */}
      <PrivacyGate />
    </GestureHandlerRootView>
  );
}
