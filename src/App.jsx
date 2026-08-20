import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppStateProvider, useAppState } from "./state/AppState.jsx";
import TabBar from "./components/TabBar.jsx";
import Splash from "./components/Splash.jsx";
import Toast from "./components/Toast.jsx";
import Paywall from "./screens/Profile/Paywall.jsx";
import HomeScreen from "./screens/Home/HomeScreen.jsx";
import JournalScreen from "./screens/Journal/JournalScreen.jsx";
import SleepScreen from "./screens/Sleep/SleepScreen.jsx";
import ProfileScreen from "./screens/Profile/ProfileScreen.jsx";
import WizardShell from "./wizard/WizardShell.jsx";
import SoundDock from "./components/SoundDock.jsx";
import Onboarding from "./screens/Onboarding/Onboarding.jsx";
import StartMenu from "./screens/Onboarding/StartMenu.jsx";
import LanguagePicker from "./screens/Onboarding/LanguagePicker.jsx";
import ConsentGate from "./components/ConsentGate.jsx";
import { needsConsent } from "./lib/consent.js";

/* HashRouter, not BrowserRouter: Capacitor will load the app over file://,
   where the History API is unreliable. */
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AppStateProvider>
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
      <Gate />
      <ToastBridge />
      <PaywallBridge />
    </AppStateProvider>
  );
}

/* Asked for explicitly while onboarding is under active work (09.08.2026):
 * gating on state.onboarded meant the flow, once seen, was practically
 * unreachable again — the flag flips once and stays flipped. StartMenu
 * asks every launch instead of a stored flag deciding it, so it can be
 * previewed on demand.
 *
 * StartMenu goes FIRST, before the language picker — not after. It has to:
 * it is hardcoded English on purpose (see StartMenu.jsx) precisely because
 * nothing has chosen a language yet at that point, and it needs to ask
 * "onboarding or app?" the moment the app opens, before either flow's
 * language-dependent screens exist to ask it from.
 *
 * The language step ALSO repeats every launch here, on purpose, unlike a
 * finished app: state.language stays SET the moment it is chosen (real
 * apps must remember it), so a permanent "!state.language" gate would only
 * ever fire once per browser and then never let the picker be seen again —
 * exactly the "stuck in whatever I tested last" complaint that made
 * StartMenu exist in the first place. Chosen again every time this phase
 * is reached is what a REPEATABLE preview needs; it still writes
 * state.language for real, so the voice assistant etc. see a real choice.
 *
 * Remove StartMenu AND this repeat-language-every-time behaviour together,
 * and go back to a plain `if (!state.language) return <LanguagePicker />`
 * plus gating on state.onboarded, once the flow is settled — a returning
 * user should be asked neither "onboarding or app?" nor "which language?"
 * on every open. */
function Gate() {
  const { state } = useAppState();
  const [phase, setPhase] = useState("menu");   // menu | language | onboarding | app

  if (phase === "menu") {
    return <StartMenu onOnboarding={() => setPhase("language-onboarding")} onSkip={() => setPhase("language-app")} />;
  }
  if (phase === "language-onboarding" || phase === "language-app") {
    return <LanguagePicker onChosen={() => setPhase(phase === "language-onboarding" ? "onboarding" : "app")} />;
  }
  /* Das Einwilligungs-Tor: NACH der Sprachwahl (übersetzt), VOR Onboarding
     UND App — schon das Stimm-Interview schickt Daten an Google. Kein
     eigener phase-Zustand: sobald die Zustimmung in state.consent liegt,
     fällt diese Bedingung von selbst und die gewählte Phase erscheint.
     Anders als StartMenu/Sprachwahl wiederholt es sich NICHT je Start —
     eine erteilte Einwilligung erneut abzufragen wäre Theater; es kommt
     nur wieder, wenn sich die Texte ändern (CONSENT_VERSION). */
  if (needsConsent(state)) {
    return <ConsentGate />;
  }
  if (phase === "onboarding") {
    return <Onboarding onExit={() => setPhase("app")} />;
  }
  return <AppRouter />;
}

function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"        element={<HomeScreen />} />
        <Route path="/journal" element={<JournalScreen />} />
        {/* Symbols are a section inside /sleep now — see TabBar. */}
        <Route path="/sleep"   element={<SleepScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/dream"   element={<WizardShell />} />
      </Routes>
      <TabBar />
      {/* Outside Routes: the sleep mix follows the person across screens. */}
      <SoundDock />
    </HashRouter>
  );
}

function ToastBridge() {
  const { toastText } = useAppState();
  return <Toast text={toastText} />;
}

/* Das Kaufblatt hängt hier ganz oben, nicht in den einzelnen Bildschirmen:
   es wird aus dem Wizard, aus dem Journal, aus dem Avatar-Dialog und aus dem
   Profil geöffnet. Fünf Einhängungen wären fünf Gelegenheiten, eine zu
   vergessen — und die vergessene wäre wieder eine Sackgasse. */
function PaywallBridge() {
  const { paywall, closePaywall } = useAppState();
  return paywall ? <Paywall reason={paywall} onClose={closePaywall} /> : null;
}
