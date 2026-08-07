import { useState, useMemo } from "react";
import { useAppState } from "../../state/AppState.jsx";
import { t } from "../../i18n/index.js";
import ScreenHeader from "../../components/ScreenHeader.jsx";
import JournalCard from "./JournalCard.jsx";
import JournalDetail from "./JournalDetail.jsx";
import "./journal.css";

export default function JournalScreen() {
  const { state } = useAppState();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  // Newest first. Do NOT write the sort back to storage — order is
  // presentation, not a property of the data.
  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...(state.journal || [])]
      .filter((e) => !q || (e.text + " " + (e.title || "")).toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [state.journal, query]);

  const total = state.journal?.length || 0;
  const open = entries.find((e) => e.id === openId) || null;

  return (
    <main className="screen">
      <ScreenHeader title={t.journal.title} subtitle={t.journal.count(total)} />

      <input
        className="j-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.journal.search}
        aria-label={t.journal.searchLabel}
      />

      {entries.length === 0 ? (
        <p className="j-empty">{query ? t.journal.emptySearch : t.journal.empty}</p>
      ) : (
        <div className="j-list">
          {entries.map((e) => (
            <JournalCard key={e.id} entry={e} onOpen={setOpenId} />
          ))}
        </div>
      )}

      {open && <JournalDetail entry={open} onClose={() => setOpenId(null)} />}
    </main>
  );
}
