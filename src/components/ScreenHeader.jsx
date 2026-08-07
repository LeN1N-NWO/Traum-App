import "./ui.css";

export default function ScreenHeader({ titel, unterzeile, aktion }) {
  return (
    <header className="screen-header">
      <div>
        <h1 className="screen-titel">{titel}</h1>
        {unterzeile && <p className="screen-unterzeile">{unterzeile}</p>}
      </div>
      {aktion}
    </header>
  );
}
