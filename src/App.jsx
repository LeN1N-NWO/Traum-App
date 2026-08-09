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

/* First run gets the onboarding INSTEAD of the app, not on top of it: no
   tab bar to escape through until it is done, like every native first-run
   flow. Needs app state, hence a child of the provider. */
function Gate() {
  const { state } = useAppState();
  if (!state.onboarded) return <Onboarding />;

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
