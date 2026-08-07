import "./ui.css";

/* Varianten: "primär" (Hauptaktion), "still" (Nebenaktion), "geist" (kaum
   sichtbar, z. B. Abbrechen). */
export default function Button({ variant = "primär", children, ...rest }) {
  return <button className={`btn btn-${variant}`} {...rest}>{children}</button>;
}
