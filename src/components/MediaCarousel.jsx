import { useRef, useState } from "react";
import "./MediaCarousel.css";

/* Swipeable slideshow for a dream's images. CSS scroll-snap does the actual
   sliding — native momentum and touch behaviour for free, no carousel
   library, works identically in a Capacitor WebView. The dots and counter
   just mirror the scroll position. */
export default function MediaCarousel({ urls = [], type = "image" }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);

  if (urls.length === 0) return null;
  if (type === "video") {
    return (
      <div className="mc">
        <video className="mc-single" src={urls[0]} controls playsInline />
      </div>
    );
  }
  if (urls.length === 1) {
    return (
      <div className="mc">
        <img className="mc-single" src={urls[0]} alt="" />
      </div>
    );
  }

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function goTo(i) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="mc">
      <div className="mc-track" ref={trackRef} onScroll={onScroll}>
        {urls.map((u, i) => (
          <img key={i} src={u} alt="" loading="lazy" />
        ))}
      </div>
      {/* Arrows on the images themselves — the dots alone are easy to miss,
          and on desktop there is no swipe instinct at all. */}
      {index > 0 && (
        <button className="mc-arrow mc-arrow-left" onClick={() => goTo(index - 1)} aria-label="Previous image">
          ‹
        </button>
      )}
      {index < urls.length - 1 && (
        <button className="mc-arrow mc-arrow-right" onClick={() => goTo(index + 1)} aria-label="Next image">
          ›
        </button>
      )}
      <span className="mc-count" aria-live="polite">{index + 1} / {urls.length}</span>
      <div className="mc-dots">
        {urls.map((_, i) => (
          <button
            key={i}
            className={"mc-dot" + (i === index ? " mc-dot-on" : "")}
            onClick={() => goTo(i)}
            aria-label={`${i + 1} / ${urls.length}`}
            aria-current={i === index}
          />
        ))}
      </div>
    </div>
  );
}
