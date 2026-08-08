import { NavLink, useNavigate } from "react-router-dom";
import { IconMoon, IconBook, IconBed, IconPerson } from "./icons.jsx";
import { t } from "../i18n/index.js";
import "./TabBar.css";

/* Icons only, no labels: the glyphs carry their own meaning, and the label
   lives on in aria-label and the tooltip, so nothing is lost for screen
   readers or on hover.
 *
 * FOUR tabs, deliberately — an EVEN number is what lets the centre button sit
 * on the actual centre line. With five it landed 32px off, because two tabs
 * on the left can never balance three on the right. Symbols moved into the
 * Sleep tab, where the rest of the free dream content lives. */
const TABS = [
  { to: "/",        label: t.tabs.home,    Icon: IconMoon },
  { to: "/journal", label: t.tabs.journal, Icon: IconBook },
  { to: "/sleep",   label: t.tabs.sleep,   Icon: IconBed },
  { to: "/profile", label: t.tabs.profile, Icon: IconPerson },
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

function Tab({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      title={label}
      aria-label={label}
      className={({ isActive }) => "tab" + (isActive ? " tab-active" : "")}
    >
      <Icon />
    </NavLink>
  );
}
