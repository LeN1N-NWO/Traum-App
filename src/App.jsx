import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppStateProvider, useAppState } from "./state/AppState.jsx";
import TabBar from "./components/TabBar.jsx";
import Splash from "./components/Splash.jsx";
import Toast from "./components/Toast.jsx";
import HomeScreen from "./screens/Home/HomeScreen.jsx";
import JournalScreen from "./screens/Journal/JournalScreen.jsx";
import SleepScreen from "./screens/Sleep/SleepScreen.jsx";
import ProfileScreen from "./screens/Profile/ProfileScreen.jsx";
import WizardShell from "./wizard/WizardShell.jsx";
import SoundDock from "./components/SoundDock.jsx";
import Onboarding from "./screens/Onboarding/Onboarding.jsx";
import StartMenu from "./screens/Onboarding/StartMenu.jsx";
import LanguagePicker from "./screens/Onboarding/LanguagePicker.jsx";

/* HashRouter, not BrowserRouter: Capacitor will load the app over file://,
   where the History API is unreliable. */
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AppStateProvider>
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
      <Gate />
      <ToastBridge />
    </AppStateProvider>
  );
}

/* Asked for explicitly while onboarding is under active work (09.08.2026):
 * gating on state.onboarded meant the flow, once seen, was practically
 * unreachable again — the flag flips once and stays flipped. StartMenu
 * asks every launch instead of a stored flag deciding it, so it can be
 * previewed on demand. Remove StartMenu and go back to gating on
 * state.onboarded once the flow is settled — a returning user should not
 * be asked "onboarding or app?" every time they open the app. */
function Gate() {
  const { state } = useAppState();
  const [phase, setPhase] = useState("menu");   // menu | onboarding | app

  // Before the wordmark, before the slides, before the dev start menu:
  // which language. Permanent, unlike StartMenu below — asked once and
  // never again, the same way a fresh phone asks it during system setup.
  if (!state.language) return <LanguagePicker />;

  if (phase === "menu") {
    return <StartMenu onOnboarding={() => setPhase("onboarding")} onSkip={() => setPhase("app")} />;
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
