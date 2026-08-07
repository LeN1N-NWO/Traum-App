import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppStateProvider, useAppState } from "./state/AppState.jsx";
import TabBar from "./components/TabBar.jsx";
import Splash from "./components/Splash.jsx";
import Toast from "./components/Toast.jsx";
import JournalScreen from "./screens/Journal/JournalScreen.jsx";

/* HashRouter, nicht BrowserRouter: Capacitor lädt die App später über
   file://, wo die History-API nicht zuverlässig funktioniert. */
export default function App() {
  const [zeigeSplash, setZeigeSplash] = useState(true);

  return (
    <AppStateProvider>
      {zeigeSplash && <Splash onFertig={() => setZeigeSplash(false)} />}
      <HashRouter>
        <Routes>
          <Route path="/"         element={<Platzhalter name="Start" />} />
          <Route path="/tagebuch" element={<JournalScreen />} />
          <Route path="/symbole"  element={<Platzhalter name="Symbole" />} />
          <Route path="/profil"   element={<Platzhalter name="Profil" />} />
          <Route path="/traum"    element={<Platzhalter name="Traum erfassen" />} />
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

// Wird in den Aufgaben 8 bis 11 einzeln ersetzt.
function Platzhalter({ name }) {
  return <main className="screen"><h1>{name}</h1></main>;
}
