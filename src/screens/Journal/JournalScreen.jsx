import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { t } from "../../i18n/index.js";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import JournalCard from "./JournalCard.jsx";
import JournalDetail from "./JournalDetail.jsx";
import CastLibrary from "./CastLibrary.jsx";
import Atlas from "./Atlas.jsx";
import DreamCalendar from "./DreamCalendar.jsx";
import "./journal.css";

export default function JournalScreen() {
  const { state, update } = useAppState();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [index, setIndex] = useState(0);
  const [library, setLibrary] = useState(false);
  const [atlas, setAtlas] = useState(false);
  const trackRef = useRef(null);

  // The chosen view outlives the visit — it is a preference, not a mood.
  const deck = state.journalView !== "list";

  // Newest first. Do NOT write the sort back to storage — order is
  // presentation, not a property of the data.
  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...(state.journal || [])]
      .filter((e) => !q || (e.text + " " + (e.title || "")).toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [state.journal, query]);

  /* The deck: one poster card per dream, swiped through sideways. CSS
   * scroll-snap does the actual swiping (same trick as MediaCarousel);
   * this only measures each card's distance to the viewport centre and
   * turns it into scale/tilt, so the focused card stands out and its
   * neighbours peek in from the sides like a fanned stack of cards. */
  const restyle = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    Array.from(track.children).forEach((card, i) => {
      const dist = card.offsetLeft + card.offsetWidth / 2 - mid;
      const n = Math.max(-1, Math.min(1, dist / card.offsetWidth));   // -1..1
      card.style.transform = `scale(${1 - 0.12 * Math.abs(n)}) rotateY(${-10 * n}deg)`;
      card.style.opacity = 1 - 0.3 * Math.abs(n);
      // The card nearest the centre sits on top of the ones it overlaps.
      card.style.zIndex = String(100 - Math.round(Math.abs(n) * 100));
      const abs = Math.abs(dist);
      if (abs < bestDist) { bestDist = abs; best = i; }
    });
    setIndex(best);
  }, []);

  useEffect(() => { if (deck) restyle(); }, [entries, deck, restyle]);

  const total = state.journal?.length || 0;
  const castCount = (state.cast?.length || 0) + (state.me ? 1 : 0);
  const realDreamCount = (state.journal || []).filter((e) => !String(e.id).startsWith("e_seed")).length;
  const open = entries.find((e) => e.id === openId) || null;

  if (library) {
    return (
      <main className="screen">
        <CastLibrary onBack={() => setLibrary(false)} />
      </main>
    );
  }

  if (atlas) {
    return (
      <main className="screen">
        {/* Ein Traum aus dem Atlas geöffnet schließt den Atlas — das Detail
            wohnt am Hauptschirm, und „zurück" führt dann dorthin, wo die
            Träume sind, nicht in eine verschachtelte Statistik. */}
        <Atlas
          onBack={() => setAtlas(false)}
          onOpen={(id) => { setAtlas(false); setOpenId(id); }}
        />
      </main>
    );
  }

  return (
    <main className="screen">
      <ScreenHeader
        title={t.journal.title}
        subtitle={t.journal.count(total)}
        action={
          /* One button, two states: it shows the view you would switch TO,
             which is why the icon flips on every press. */
          <button
            className="j-view-toggle"
            onClick={() => update({ journalView: deck ? "list" : "deck" })}
            aria-label={deck ? t.journal.viewList : t.journal.viewDeck}
          >
            {deck ? <ListIcon /> : <DeckIcon />}
          </button>
        }
      />

      <input
        className="j-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.journal.search}
        aria-label={t.journal.searchLabel}
      />

      {/* The cast lives here, not in the profile: these entries exist to be
          referenced by dreams, so they belong next to them. */}
      <button className="j-library" onClick={() => setLibrary(true)}>
        <span className="j-library-body">
          <span className="j-library-title">{t.journal.library}</span>
          <span className="j-library-text">{t.journal.libraryCount(castCount)}</span>
        </span>
        <span className="j-library-chev" aria-hidden="true" data-flip>›</span>
      </button>

      {/* Der Atlas daneben, aus demselben Grund: Muster ÜBER Träumen
          gehören neben die Träume. Erst ab dem zweiten echten Traum —
          eine Statistik über einen Eintrag wäre ein leeres Versprechen. */}
      {realDreamCount >= 2 && (
        <button className="j-library" onClick={() => setAtlas(true)}>
          <span className="j-library-body">
            <span className="j-library-title">{t.journal.atlas}</span>
            <span className="j-library-text">{t.journal.atlasLede}</span>
          </span>
          <span className="j-library-chev" aria-hidden="true" data-flip>›</span>
        </button>
      )}

      {entries.length === 0 ? (
        <p className="j-empty">{query ? t.journal.emptySearch : t.journal.empty}</p>
      ) : deck ? (
        <>
          <div className="j-deck" ref={trackRef} onScroll={restyle}>
            {entries.map((e) => (
              <JournalCard key={e.id} entry={e} onOpen={setOpenId} />
            ))}
          </div>
          {entries.length > 1 && (
            <div className="j-deck-dots" aria-hidden="true">
              {entries.map((e, i) => (
                <span key={e.id} className={"j-deck-dot" + (i === index ? " j-deck-dot-on" : "")} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="j-list">
          {entries.map((e) => (
            <JournalCard key={e.id} entry={e} onOpen={setOpenId} variant="row" />
          ))}
        </div>
      )}

      {/* Below the dreams, not above them: the calendar is the second way in
          — for the night you remember by date rather than by name. It shows
          the whole journal, so the search above deliberately does not touch
          it; filtering the map would hide the very days you are looking for. */}
      {total > 0 && <DreamCalendar onOpen={setOpenId} />}

      {open && <JournalDetail entry={open} onClose={() => setOpenId(null)} />}
    </main>
  );
}

/* Inline SVG rather than an emoji: these two need to read as one control in
   two states, and emoji render differently on every platform. */
function DeckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="8" y="4" width="12" height="16" rx="2.5" />
      <path d="M5.5 7v10M3 9v6" strokeLinecap="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="5" rx="1.6" />
      <rect x="3" y="14.5" width="18" height="5" rx="1.6" />
    </svg>
  );
}
