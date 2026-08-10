import { useCallback, useMemo, useState } from "react";
import { useAppState } from "../state/AppState.jsx";
import TagTextarea from "./TagTextarea.jsx";
import TagCard from "./TagCard.jsx";

/* TagTextarea and TagCard, wired to the cast.
 *
 * The two of them stay ignorant of the app on purpose: a mark reports a name
 * and a rectangle, nothing more. Everything that turns that into an avatar —
 * which names are known, what a tapped one stands for, whether a card is open
 * — lived inside Step1Dream, and would have had to be copied verbatim into
 * every further field. It lives here instead, so a second field cannot drift
 * away from the first.
 *
 * Everything else is passed straight through to the textarea, so a caller
 * swaps <textarea> for <TagField> and keeps its own className, rows and
 * aria-label.
 */
export default function TagField(props) {
  const { state } = useAppState();
  const [card, setCard] = useState(null);   // the tag being looked at, if any

  // Every avatar counts, with or without a photo: since an entry may carry
  // just a description, "has an image" is not what makes it usable.
  const tags = useMemo(() => {
    const list = (state.cast || []).map((p) => p.tag).filter(Boolean);
    if (state.me) list.push("me");
    return list;
  }, [state.cast, state.me]);

  /* Tapping a highlighted name shows who it is. @me is not in the cast — it is
   * its own field, so it needs its own case. Stable identity on both
   * callbacks: TagCard registers window listeners keyed on onClose. */
  const openCard = useCallback((tag, rect) => {
    const avatar = tag === "me"
      ? { ...state.me, tag: "me", category: "person" }
      : (state.cast || []).find((p) => p.tag === tag);
    if (avatar) setCard({ avatar, rect });
  }, [state.cast, state.me]);

  const closeCard = useCallback(() => setCard(null), []);

  return (
    <>
      <TagTextarea tags={tags} onTagClick={openCard} {...props} />
      {card && <TagCard avatar={card.avatar} anchor={card.rect} onClose={closeCard} />}
    </>
  );
}
