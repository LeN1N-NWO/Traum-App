import { NavLink, useNavigate } from "react-router-dom";
import { t } from "../i18n/index.js";
import "./TabBar.css";

const TABS = [
  { to: "/",        label: t.tabs.home,    icon: "🌙" },
  { to: "/journal", label: t.tabs.journal, icon: "📖" },
  { to: "/symbols", label: t.tabs.symbols, icon: "✧" },
  { to: "/profile", label: t.tabs.profile, icon: "👤" },
];

/* The centre plus is the established mobile pattern: the core action is one
   tap away from any tab. */
export default function TabBar() {
  const navigate = useNavigate();
  return (
    <nav className="tabbar" aria-label="Main navigation">
      {TABS.slice(0, 2).map((tab) => <Tab key={tab.to} {...tab} />)}
      <button
        className="tabbar-plus"
        onClick={() => navigate("/dream")}
        aria-label={t.tabs.newDream}
      >
        <span aria-hidden="true">+</span>
      </button>
      {TABS.slice(2).map((tab) => <Tab key={tab.to} {...tab} />)}
    </nav>
  );
}

function Tab({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => "tab" + (isActive ? " tab-active" : "")}
    >
      <span className="tab-icon" aria-hidden="true">{icon}</span>
      <span className="tab-label">{label}</span>
    </NavLink>
  );
}
