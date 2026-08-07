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

/* HashRouter, nicht BrowserRouter: Capacitor lädt die App später über
   file://, wo die History-API nicht zuverlässig funktioniert. */
export default function App() {
  const [zeigeSplash, setZeigeSplash] = useState(true);

  return (
    <AppStateProvider>
      {zeigeSplash && <Splash onFertig={() => setZeigeSplash(false)} />}
      <HashRouter>
        <Routes>
          <Route path="/"         element={<HomeScreen />} />
          <Route path="/tagebuch" element={<JournalScreen />} />
          <Route path="/symbole"  element={<SymbolsScreen />} />
          <Route path="/profil"   element={<ProfileScreen />} />
          <Route path="/traum"    element={<DreamScreen />} />
        </Routes>
        <TabBar />
      </HashRouter>
      <ToastAnschluss />
    </AppStateProvider>
  );
}

function ToastAnschluss() {
  const { toastText } = useAppState();
  return <Toast text={toastText} />;
}
