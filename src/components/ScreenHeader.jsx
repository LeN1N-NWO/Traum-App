import "./ui.css";

export default function ScreenHeader({ title, subtitle, action }) {
  return (
    <header className="screen-header">
      <div>
        <h1 className="screen-title">{title}</h1>
        {subtitle && <p className="screen-subtitle">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
