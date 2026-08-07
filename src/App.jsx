import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppStateProvider, useAppState } from "./state/AppState.jsx";
import TabBar from "./components/TabBar.jsx";
import Splash from "./components/Splash.jsx";
import Toast from "./components/Toast.jsx";
import HomeScreen from "./screens/Home/HomeScreen.jsx";
import JournalScreen from "./screens/Journal/JournalScreen.jsx";
import SymbolsScreen from "./screens/Symbols/SymbolsScreen.jsx";
import ProfileScreen from "./screens/Profile/ProfileScreen.jsx";
import DreamScreen from "./screens/Dream/DreamScreen.jsx";

/* HashRouter, not BrowserRouter: Capacitor will load the app over file://,
   where the History API is unreliable. */
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AppStateProvider>
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
      <HashRouter>
        <Routes>
          <Route path="/"        element={<HomeScreen />} />
          <Route path="/journal" element={<JournalScreen />} />
          <Route path="/symbols" element={<SymbolsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/dream"   element={<DreamScreen />} />
        </Routes>
        <TabBar />
      </HashRouter>
      <ToastBridge />
    </AppStateProvider>
  );
}

function ToastBridge() {
  const { toastText } = useAppState();
  return <Toast text={toastText} />;
}
