import { NavLink, useNavigate } from "react-router-dom";
import "./TabBar.css";

const TABS = [
  { to: "/",         label: "Start",    icon: "🌙" },
  { to: "/tagebuch", label: "Tagebuch", icon: "📖" },
  { to: "/symbole",  label: "Symbole",  icon: "✧" },
  { to: "/profil",   label: "Profil",   icon: "👤" },
];

/* Der zentrale Plus-Knopf ist das etablierte Mobile-Muster: die Kernaktion
   ist von jedem Tab aus einen Tipp entfernt. */
export default function TabBar() {
  const navigate = useNavigate();
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {TABS.slice(0, 2).map((t) => <Tab key={t.to} {...t} />)}
      <button
        className="tabbar-plus"
        onClick={() => navigate("/traum")}
        aria-label="Neuen Traum erfassen"
      >
        <span aria-hidden="true">+</span>
      </button>
      {TABS.slice(2).map((t) => <Tab key={t.to} {...t} />)}
    </nav>
  );
}

function Tab({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => "tab" + (isActive ? " tab-aktiv" : "")}
    >
      <span className="tab-icon" aria-hidden="true">{icon}</span>
      <span className="tab-label">{label}</span>
    </NavLink>
  );
}
