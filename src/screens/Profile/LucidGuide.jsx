import Card from "../../components/Card.jsx";
import "./profile.css";

const THEMEN = [
  {
    titel: "Reality Checks",
    text: "Frag dich mehrmals am Tag, ob du träumst — und prüfe es wirklich: " +
          "Hände zählen, auf eine Uhr schauen, wegsehen, nochmal hinschauen. " +
          "Im Traum verändert sich das Ergebnis.",
  },
  {
    titel: "MILD",
    text: "Sag dir beim Einschlafen vor: „Heute Nacht merke ich, dass ich träume.“ " +
          "Stell dir dabei einen vergangenen Traum vor und wie du darin bemerkst, " +
          "dass es einer ist.",
  },
  {
    titel: "WBTB",
    text: "Nach etwa fünf Stunden Schlaf kurz aufwachen, 20 bis 30 Minuten wach " +
          "bleiben, dann mit der MILD-Formel wieder einschlafen. Wirkt am " +
          "zuverlässigsten, kostet aber Schlaf.",
  },
  {
    titel: "Aufschreiben",
    text: "Träume direkt nach dem Aufwachen notieren, bevor du aufstehst. Wer " +
          "regelmäßig aufschreibt, erinnert sich an mehr — und erkennt eigene " +
          "wiederkehrende Muster.",
  },
];

export default function LucidGuide() {
  return (
    <div className="p-guide">
      {THEMEN.map((t) => (
        <Card key={t.titel}>
          <details>
            <summary className="p-guide-titel">{t.titel}</summary>
            <p className="p-guide-text">{t.text}</p>
          </details>
        </Card>
      ))}
    </div>
  );
}
