import { useMemo, useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { SUBSCRIPTIONS, PACKS, dreamsFor } from "../../lib/plans.js";
import { totalCredits } from "../../lib/credits.js";
import { showcaseFrom } from "../../lib/showcase.js";
import HeroGlow from "../../components/HeroGlow.jsx";
import { t } from "../../i18n/index.js";
import Button from "../../components/Button.jsx";
import ShowcaseTile from "./ShowcaseTile.jsx";
import "./paywall.css";

/* ⚠ PLATZHALTER — Anton ersetzt diese Datei durch einen echten Traumfilm.
 *
 * Sie steht nur in der rechten Kachel, und nur solange der Mensch noch
 * keinen eigenen Film hat: also beim allerersten Öffnen. Sobald einer
 * gerendert ist, greift showcaseFrom() auf dessen Film zu und diese Zeile
 * wird nie wieder ausgeführt.
 *
 * Zum Austauschen genügt es, hier eine andere Datei zu importieren — der
 * Rest hängt an `fallbackFilm`. Was hineingehört: ein kurzer, dunkler,
 * langsamer Ausschnitt, der ohne Ton funktioniert und ohne Anfang und Ende
 * gelesen werden kann; die Kachel ist 132 px hoch und zeigt einen
 * Bildausschnitt, keine Komposition. Bitte als MP4 unter ~700 KB — das
 * Repository trägt seine Medien selbst (siehe WORKLOG 10.08.).
 */
import fallbackFilm from "../../assets/home-faultier.mp4";

/* The shop window. Opened from anywhere via openPaywall(reason) — the credits
 * pill, the wizard when the balance runs out, the avatar dialog, and once
 * after the very first finished dream.
 *
 * `reason` only changes the two lines at the top, and that is the whole point:
 * a sheet somebody opened THEMSELVES may lead with the offer, but one that
 * just jumped into their way has to say why first, or it reads as an ambush.
 * Three cases, in rising order of how much explaining they owe:
 *   browse  — they tapped the balance. Straight to the offer.
 *   spent   — they were about to render and ran out. Name that first.
 *   first   — their first dream just finished and the free credits are gone.
 *             The only moment where the app has already proved itself, so
 *             it may say so.
 *
 * ⚠ Nothing here charges anybody: there is no payment provider, no store
 * account and no server-side balance. The button says so rather than
 * pretending — a paywall that silently does nothing is worse than one that
 * admits it is not open yet.
 */
export default function Paywall({ reason = "browse", onClose }) {
  const { state, toast } = useAppState();
  const [tab, setTab] = useState("sub");        // "sub" | "pack"
  const [chosen, setChosen] = useState(SUBSCRIPTIONS.find((p) => p.featured)?.id);

  const plans = tab === "sub" ? SUBSCRIPTIONS : PACKS;
  const plan = plans.find((p) => p.id === chosen) || plans[0];
  /* Das Jahresabo zeigt in den Ertrags-Kacheln die JAHRESSUMME (540 Bilder,
     77 Filme), nicht die Monatsration — Antons Ansage 21.08.: „hochrechnen,
     damit es nach viel aussieht". Es ist dieselbe ehrliche Rechnung, nur
     über den Zeitraum, für den man tatsächlich bezahlt; die Zeile unter den
     Kacheln (yieldYearNote) hält die monatliche Mechanik daneben fest. */
  const yearly = plan.period === "year";
  const got = dreamsFor(plan.credits * (yearly ? 12 : 1));

  /* Hängt am Tagebuch, nicht am gewählten Tarif: Beim Umschalten zwischen
     Woche und Monat ändern sich die Zahlen, nicht das Material. Ohne das
     Merken würden die Kacheln bei jedem Antippen von vorn anfangen. */
  const show = useMemo(() => showcaseFrom(state.journal, fallbackFilm), [state.journal]);

  function pick(id) {
    setChosen(id);
  }

  return (
    <div className="pw" role="dialog" aria-modal="true" aria-label={t.paywall.title}>
      <HeroGlow className="pw-hero" />

      <button className="pw-close" onClick={onClose} aria-label={t.paywall.close}>×</button>

      <div className="pw-head">
        <span className="pw-brand">
          Dream Rushes <span className="pw-plus">PLUS</span>
        </span>
        <h1 className="pw-title">{t.paywall.headlineFor[reason] || t.paywall.headline}</h1>
        <p className="pw-lede">{t.paywall.ledeFor[reason] || t.paywall.lede}</p>
      </div>

      <div className="pw-body">
        <div className="pw-tabs" role="tablist" aria-label={t.paywall.title}>
          {[["sub", t.paywall.tabSub], ["pack", t.paywall.tabPack]].map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              className={"pw-tab" + (tab === id ? " pw-tab-on" : "")}
              onClick={() => {
                setTab(id);
                const next = id === "sub" ? SUBSCRIPTIONS : PACKS;
                setChosen((next.find((p) => p.featured) || next[1] || next[0]).id);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="pw-plans">
          {plans.map((p) => (
            <button
              key={p.id}
              className={"pw-plan" + (chosen === p.id ? " pw-plan-on" : "")}
              onClick={() => pick(p.id)}
              aria-pressed={chosen === p.id}
            >
              <span className="pw-radio" aria-hidden="true" />
              <span className="pw-plan-body">
                <span className="pw-plan-name">
                  {p.period ? t.paywall.periodName[p.period] : t.paywall.packName(p.credits)}
                  {p.saveHint && <span className="pw-badge">{t.paywall.save(p.saveHint)}</span>}
                </span>
                <span className="pw-plan-sub">
                  {p.period
                    ? t.paywall.creditsPer(p.credits, t.paywall.periodUnit[p.period])
                    : t.paywall.packYield(dreamsFor(p.credits).images, dreamsFor(p.credits).films)}
                </span>
              </span>
              <span className="pw-plan-price">
                <b>{p.price}</b>
                <small>{p.period ? t.paywall.per[p.period] : t.paywall.oneTime}</small>
              </span>
            </button>
          ))}
        </div>

        {/* Warum Pakete teurer sind, einmal gesagt statt dreimal.
            ⚠ UNTER der Liste, nicht darüber (Antons Befund 26.08.: „wenn
            ich zwischen Abonnieren und Credits kaufen switche, verschiebt
            sich gleich diese ganze Spalte"). Eine Zeile, die es nur auf
            EINEM Reiter gibt, schiebt alles unter sich weg, sobald sie
            erscheint — steht sie unter der Liste, bleiben die Tarife beim
            Umschalten stehen, und nur der Fuß rückt nach. */}
        {tab === "pack" && <p className="pw-packnote">{t.paywall.packNote}</p>}

        {/* Was der gewählte Tarif hergibt — als zwei Flächen, auf denen die
            Ware selbst läuft, statt als Piktogramm davon.

            Die Entwicklung dieser Zeilen ist der Punkt: Erst stand hier ein
            Satz („45 Credits — etwa 9 Träume mit 5 Bildern…"), der stimmte,
            aber gelesen und umgerechnet werden musste. Dann zwei Zahlen mit
            Strichsymbol — schneller zu erfassen, aber Strichsymbole sind
            Bedienoberfläche: Sie sagen „hier kannst du tippen", nicht „das
            bekommst du". Jetzt laufen dort echte Bilder und ein echter Film,
            und zwar möglichst SEINE (siehe showcase.js).

            Die Zahlen kommen weiterhin aus dreamsFor(), also aus derselben
            Quelle wie der echte Preis. */}
        <div className="pw-yield">
          <ShowcaseTile
            kind="stills"
            urls={show.stills}
            backup={show.stillsBackup}
            count={got.images}
            label={t.paywall.yieldImages(got.images)}
          />
          {/* Keine Kachel mit einer 0: Das kleinste Paket reicht für keinen
              Film, und eine Null auf einer Kaufseite liest sich als Mangel,
              nicht als Information.

              Das „oder" bleibt, obwohl es im Entwurf der Kacheln zunächst
              wegfiel — und sein Fehlen war ein Sachfehler, kein
              Gestaltungsdetail: Zwei Zahlen nebeneinander lesen sich als
              „und", das Guthaben gibt aber das eine ODER das andere her. */}
          {got.films > 0 && (
            <>
              <span className="pw-yield-or">{t.paywall.yieldOr}</span>
              <ShowcaseTile
                kind="film"
                urls={show.films}
                backup={show.filmsBackup}
                count={got.films}
                label={t.paywall.yieldFilms(got.films)}
                /* ⚠ „bis zu" ist keine Vorsicht, sondern Rechnung: Die Zahl
                   entsteht aus dem KÜRZESTEN Film der günstigsten Stufe
                   (dreamsFor → standard, Voreinstellung). Wer 15 Sekunden
                   Seedance macht, bekommt weniger — ohne das Wort wäre die
                   Zahl ein Versprechen, das die App bricht, sobald jemand
                   den Regler bewegt. Bilder brauchen es nicht: Ein Credit
                   ist ein Bild, per Definition. */
                upTo={t.paywall.upTo}
              />
            </>
          )}
        </div>
        {yearly && <p className="pw-yield-note">{t.paywall.yieldYearNote}</p>}

        <div className="pw-included">
          <h2 className="pw-included-title">{t.paywall.included}</h2>
          <div className="pw-chips">
            {t.paywall.chips.map((c) => (
              <span key={c} className="pw-chip">{c}</span>
            ))}
          </div>
          <p className="pw-free-note">{t.paywall.freeNote}</p>
        </div>

        <div className="pw-foot">
          <Button onClick={() => toast(t.paywall.notYet)}>{t.paywall.cta}</Button>
          <p className="pw-small">{t.paywall.balance(totalCredits(state))}</p>
        </div>
      </div>
    </div>
  );
}
