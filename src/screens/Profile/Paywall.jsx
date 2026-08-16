import { useState } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { SUBSCRIPTIONS, PACKS, dreamsFor } from "../../lib/plans.js";
import { t } from "../../i18n/index.js";
import Button from "../../components/Button.jsx";
import "./paywall.css";

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
  const got = dreamsFor(plan.credits);

  function pick(id) {
    setChosen(id);
  }

  return (
    <div className="pw" role="dialog" aria-modal="true" aria-label={t.paywall.title}>
      <div className="pw-hero" aria-hidden="true" />

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
                    : t.paywall.creditsOnce(p.credits)}
                </span>
              </span>
              <span className="pw-plan-price">
                <b>{p.price}</b>
                <small>{p.period ? t.paywall.per[p.period] : t.paywall.oneTime}</small>
              </span>
            </button>
          ))}
        </div>

        {/* The concrete promise: what the selected plan actually buys. */}
        <p className="pw-yield">{t.paywall.yield(plan.credits, got.fiveImages, got.threeImages)}</p>

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
          <p className="pw-small">{t.paywall.balance(state.credits ?? 0)}</p>
        </div>
      </div>
    </div>
  );
}
