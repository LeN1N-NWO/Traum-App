import Card from "../../components/Card.jsx";
import { t } from "../../i18n/index.js";
import "./profile.css";

export default function LucidGuide() {
  return (
    <div className="p-guide">
      {t.guide.map((item) => (
        <Card key={item.title}>
          <details>
            <summary className="p-guide-title">{item.title}</summary>
            <p className="p-guide-text">{item.text}</p>
          </details>
        </Card>
      ))}
    </div>
  );
}
