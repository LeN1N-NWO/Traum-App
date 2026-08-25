import { useEffect, useRef } from "react";

/* Ein Video MIT Transparenz — auf iOS und Android aus EINER Datei.
 *
 * ── Warum es dieses Bauteil überhaupt gibt ───────────────────────────────
 * Antons Frage (24.08.2026): „Ich habe eine Videoanimation, die nur über
 * Video gut animierbar ist … ich brauche eine Lösung, wie ich diese
 * Videofiles in die App integrieren kann, sodass Transparenzen mitkommen."
 *
 * ⚠ Das Problem ist NICHT, ein Alpha-Videoformat zu finden. Es ist, dass
 * die beiden Zielplattformen kein gemeinsames haben. Gemessen am 24.08.:
 *
 *   HEVC + Alpha (.mov, hvc1)   iOS/WKWebView ✓   Android ✗
 *   VP9 + Alpha (.webm)         iOS ✗             Android ✓
 *
 * Zwei Dateien auszuliefern ginge (`<video>` mit zwei `<source>`), hat aber
 * zwei Haken: Die App trägt BEIDE im Bündel, und wenn eine WebView den
 * falschen Typ doch annimmt, rendert sie ihn ohne Alpha — ein schwarzer
 * Kasten über der Oberfläche, und zwar nur auf fremden Geräten.
 *
 * ── Was wir stattdessen tun ──────────────────────────────────────────────
 * Die Alpha-Packung: EIN gewöhnliches H.264, doppelt so hoch wie das Motiv.
 * Oben die Farbe, unten dieselbe Maske als Graustufe. Ein Shader setzt
 * beides zusammen — sechs Zeilen, auf der GPU, kein Pixel wandert durch
 * JavaScript.
 *
 * Gemessen (720×1280, 3 s, 30 fps):
 *   Alpha-Packung H.264   141 KB   beide Plattformen
 *   HEVC + Alpha          277 KB   nur iOS
 *   VP9 + Alpha            36 KB   nur Android
 *   PNG-Sequenz          3404 KB   ⚠ und 316 MB im Arbeitsspeicher
 *
 * H.264 wird auf JEDEM Telefon in Hardware dekodiert — das ist der Grund,
 * warum die Packung auch beim Stromverbrauch gewinnt.
 *
 * Dateien macht `bun scripts/alpha-packen.mjs <quelle> <ziel.mp4>`.
 *
 * ⚠ Grenze: Die gepackte Höhe muss unter 4096 bleiben, sonst lehnen
 * Telefon-Dekoder sie ab. 1080×1920 wird zu 1080×3840 — das geht gerade
 * noch. Alles darüber muss vorher kleiner gerechnet werden.
 */

/* Farbe aus der oberen Hälfte, Alpha aus der unteren.
   Ausgegeben wird VORMULTIPLIZIERT (rgb * a): So bleibt der Rand sauber,
   auch wenn die Farbhälfte in ganz durchsichtigen Bereichen
   Kompressionsrauschen enthält — es wird mit Null multipliziert. */
const FRAGMENT = `precision mediump float;
uniform sampler2D tex; varying vec2 uv;
void main(){
  vec3 rgb = texture2D(tex, vec2(uv.x, uv.y * 0.5)).rgb;
  float a  = texture2D(tex, vec2(uv.x, uv.y * 0.5 + 0.5)).r;
  gl_FragColor = vec4(rgb * a, a);
}`;

/* ⚠ uv.y läuft NACH UNTEN, weil Videotexturen das tun: p.y = +1 ist oben im
   Bild (uv.y = 0). Ein Vorzeichenfehler hier kostet keine Fehlermeldung —
   die Kachel sitzt einfach halb außerhalb, und das sieht aus wie ein
   kaputtes Video. */
const VERTEX = `attribute vec2 p; varying vec2 uv;
void main(){ uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
             gl_Position = vec4(p, 0.0, 1.0); }`;

export default function AlphaVideo({ src, className = "", style = null, loop = true, onEnded = null }) {
  const canvasRef = useRef(null);

  /* ⚠ Der Rückruf hängt in einem ref, NICHT in der Abhängigkeitsliste des
     Effekts. Sonst reißt jeder Aufrufer, der seine Funktion inline schreibt
     (also jeder), bei jedem Rendern den ganzen WebGL-Aufbau ab und neu auf —
     das Video finge von vorn an, und zwar nur manchmal. */
  const endeRef = useRef(onEnded);
  endeRef.current = onEnded;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;

    /* Wer Bewegung abgeschaltet hat, bekommt keine — dieselbe Regel wie beim
       Maskottchen (Mascot.jsx) und beim wandernden Licht (orbit.css). Das
       Video wird dann gar nicht erst geladen: Es abzuspielen und zu
       verstecken wäre Datenverbrauch für etwas, das niemand sehen will. */
    const stillHalten = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const video = document.createElement("video");
    video.src = src;
    video.loop = loop;
    video.muted = true;
    /* ⚠ Beide Zeilen sind auf iOS Pflicht, nicht Geschmack: Ohne
       `playsInline` reißt Safari das Video in den Vollbildmodus, sobald es
       startet — mitten in der App. Ohne `muted` verweigert jede mobile
       WebView das automatische Abspielen. */
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.preload = "auto";
    video.crossOrigin = "anonymous";

    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
    /* Kein WebGL — dann bleibt das Standbild stehen, statt dass ein leeres
       Rechteck erscheint. Ein Effekt ist Schmuck; er darf nie der Grund
       sein, dass ein Bildschirm kaputt aussieht. */
    if (!gl) return;

    const shader = (typ, quelle) => {
      const s = gl.createShader(typ);
      gl.shaderSource(s, quelle);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const attr = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    /* CLAMP_TO_EDGE ist Pflicht, nicht Feinschliff: Ohne es wiederholt sich
       die Textur, und dann blutet die Maske von unten in die Farbe oben. */
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let laeuft = true;
    let handle = 0;

    const zeichnen = () => {
      if (!laeuft) return;
      if (video.readyState >= 2 && video.videoWidth) {
        const w = video.videoWidth;
        const h = video.videoHeight / 2;          // die Farbhälfte ist das Bild
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      handle = requestAnimationFrame(zeichnen);
    };

    if (stillHalten) {
      /* Ein einziges Bild: laden, an eine Stelle springen, EINMAL zeichnen. */
      video.addEventListener("loadeddata", () => {
        video.currentTime = video.duration ? video.duration / 2 : 0;
      }, { once: true });
      video.addEventListener("seeked", () => {
        if (laeuft) { zeichnen(); cancelAnimationFrame(handle); }
      }, { once: true });
    } else {
      /* ⚠ `play()` gibt ein Promise zurück, das die WebView ablehnen DARF
         (Stromsparmodus, Hintergrundtab). Unbehandelt wäre das eine rote
         Konsolenzeile bei jedem Start — und ein nicht abgespieltes Video
         ist hier kein Fehler, sondern ein Standbild. */
      video.play().catch(() => {});
      handle = requestAnimationFrame(zeichnen);
    }

    /* Nur für einmalige Einspieler interessant (loop = false). Wer darauf
       eine Bildschirmfolge aufbaut, darf sich NICHT allein darauf verlassen:
       Ohne WebGL kehrt der Effekt oben vorzeitig zurück, ohne je zu starten,
       und dann kommt dieses Ereignis nie. Der Aufrufer braucht eine
       Zeitbremse — ButtonTapOverlay.jsx hat eine. */
    const fertig = () => endeRef.current?.();
    video.addEventListener("ended", fertig);

    return () => {
      laeuft = false;
      cancelAnimationFrame(handle);
      video.removeEventListener("ended", fertig);
      video.pause();
      /* ⚠ Quelle leeren UND neu laden: Sonst hält iOS den Dekoder fest, und
         nach ein paar Bildschirmwechseln startet gar kein Video mehr — die
         Zahl gleichzeitiger Hardware-Dekoder ist auf dem Telefon klein. */
      video.removeAttribute("src");
      video.load();
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [src, loop]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      /* ⚠ `pointerEvents: none` steht VOR dem hereingereichten style, damit
         ein Aufrufer es überschreiben kann — aber niemand daran denken MUSS.
         Ein Effekt liegt über der Oberfläche; fängt er Berührungen ab, ist
         der Knopf darunter tot, und das merkt man erst auf dem Telefon. */
      style={{ pointerEvents: "none", ...(style || {}) }}
      aria-hidden="true"
    />
  );
}
