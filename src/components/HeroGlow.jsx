import "./heroGlow.css";

/* Der Nachthimmel-Schein über einem Bildschirmkopf — EIN Bauteil für alle
 * Seiten, seit Antons Ansage vom 26.08.: „Ich finde den Verlauf auf dem
 * Screenshot ziemlich cool. Vielleicht können wir das auch auf die anderen
 * Seiten übertragen … und vielleicht leicht animieren, sodass zwischen
 * diesem Orange und Blau immer so eine kleine Bewegung da ist."
 *
 * Warm links, kühl rechts — das Paar aus dem Kaufblatt, das er meint. Die
 * Seite bestimmt nur DREI Dinge über CSS-Variablen, nie über eigene
 * Verläufe:
 *   --hero-h   wie hoch der Schein reicht
 *   --glow-a   die warme Seite   (Vorgabe: --warm)
 *   --glow-b   die kühle Seite   (Vorgabe: --accent)
 *
 * ⚠ Warum ein Rahmen UM den Verlauf und nicht der Verlauf allein: Vorher
 * war der Schein ein einzelner Kasten fester Höhe, und der Farbverlauf
 * darin lief bis an dessen Unterkante — dort riss das Bild ab, sichtbar
 * als harte waagerechte Kante quer über den Bildschirm (Antons Screenshot
 * der Traumsymbole, 26.08.). Die eingebaute `linear-gradient`-Ausblendung
 * konnte das nicht auffangen: In der CSS-Hintergrundliste liegt der ZUERST
 * genannte Verlauf OBEN, die Ausblendung lag also UNTER den Farben statt
 * über ihnen. Jetzt blendet eine Maske am Rahmen aus — die kann nichts
 * überdecken und nichts verpassen, weil sie die Deckkraft selbst wegnimmt.
 */
export default function HeroGlow({ className = "" }) {
  return (
    <div className={"hero" + (className ? " " + className : "")} aria-hidden="true">
      <span className="hero-glow" />
    </div>
  );
}
