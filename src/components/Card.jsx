import "./ui.css";

/* as="button" macht die Karte tastaturbedienbar — anklickbare <div>s waren
   in der alten App eine der offenen Barrierefreiheits-Baustellen. */
export default function Card({ as = "div", children, className = "", ...rest }) {
  const Tag = as;
  return <Tag className={`card ${className}`} {...rest}>{children}</Tag>;
}
