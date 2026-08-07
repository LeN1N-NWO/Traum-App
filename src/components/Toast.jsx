import "./Toast.css";

export default function Toast({ text }) {
  return (
    <div className={"toast" + (text ? " toast-an" : "")} role="status" aria-live="polite">
      {text}
    </div>
  );
}
