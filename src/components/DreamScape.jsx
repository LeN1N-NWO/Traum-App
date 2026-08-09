import "./DreamScape.css";

/* The moving backdrop behind the voice interview.
 *
 * Four soft blobs drifting at speeds that share no common multiple, so the
 * picture never visibly loops — the moment a background repeats, it stops
 * reading as alive and starts reading as a GIF.
 *
 * CSS rather than canvas on purpose: these are four blurred divs the
 * compositor can hand to the GPU and then forget about. A canvas loop would
 * burn a redraw every frame for something that has no detail to redraw, on a
 * screen people hold in bed at 3am.
 *
 * `level` (0..1) is how loudly the person is speaking. It only ever nudges
 * scale and opacity: the blobs must not lunge at anyone — the whole point of
 * this screen is that it is calm enough to talk into.
 */
export default function DreamScape({ level = 0, speaking = false }) {
  return (
    <div
      className={"ds" + (speaking ? " ds-speaking" : "")}
      style={{ "--level": Math.min(Math.max(level, 0), 1) }}
      aria-hidden="true"
    >
      <span className="ds-blob ds-blob-1" />
      <span className="ds-blob ds-blob-2" />
      <span className="ds-blob ds-blob-3" />
      <span className="ds-blob ds-blob-4" />
      <span className="ds-grain" />
    </div>
  );
}
