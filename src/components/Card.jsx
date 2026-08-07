import "./ui.css";

/* as="button" makes the card keyboard-operable — clickable <div>s were one of
   the accessibility gaps in the pre-React app. */
export default function Card({ as = "div", children, className = "", ...rest }) {
  const Tag = as;
  return <Tag className={`card ${className}`} {...rest}>{children}</Tag>;
}
