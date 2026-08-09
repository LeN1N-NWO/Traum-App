import "./onboarding.css";

/* The mascot, placeholder edition: a sleepy dream-wisp — soft blob, nightcap,
 * closed happy eyes. Deliberately simple ("erstmal dumm"): the flow needs a
 * face today, the art direction can replace this file wholesale later. It
 * floats via CSS, not SMIL, so prefers-reduced-motion can switch it off. */
export default function Mascot() {
  return (
    <div className="ob-mascot" aria-hidden="true">
      <svg viewBox="0 0 120 120" width="132" height="132" fill="none">
        {/* the wisp body, slightly pear-shaped, with a wavy ghost hem */}
        <path
          d="M60 16c22 0 34 15 34 36v28c0 6-5 8-9 5-4-3-8-3-11 0-4 4-10 4-14 0-3-3-7-3-11 0-4 3-9 1-9-5V52c0-21 12-36 20-36Z"
          fill="rgb(140 192 255 / .18)" stroke="#8cc0ff" strokeWidth="2.4"
          strokeLinecap="round" strokeLinejoin="round"
        />
        {/* nightcap, flopped to the right, with a bobble */}
        <path
          d="M38 33C42 20 52 12 64 12c10 0 18 4 24 12-8-3-16-2-24 2-9 4-17 7-26 7Z"
          fill="#f2a765" stroke="#f2a765" strokeWidth="2" strokeLinejoin="round"
        />
        <circle cx="90" cy="26" r="5" fill="#f6c65b" />
        {/* closed, content eyes and a small smile */}
        <path d="M46 62c3 3 7 3 10 0M66 62c3 3 7 3 10 0" stroke="#eaf0fb" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M56 74c3 2.6 7 2.6 10 0" stroke="#a3b6d2" strokeWidth="2.2" strokeLinecap="round" />
        {/* one star it is dreaming about */}
        <path d="M22 44l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6Z" fill="#f6c65b" />
      </svg>
    </div>
  );
}
