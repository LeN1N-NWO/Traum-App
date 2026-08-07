import "./ui.css";

/* Variants: "primary" (main action), "quiet" (secondary), "ghost" (barely
   there, e.g. Cancel). */
export default function Button({ variant = "primary", children, ...rest }) {
  return <button className={`btn btn-${variant}`} {...rest}>{children}</button>;
}
