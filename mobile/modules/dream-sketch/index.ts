import { requireOptionalNativeModule } from "expo";

/* Die Traum-Skizze: Keyframes und Film komplett auf dem iPhone, ohne
   Credits (Plan docs/plans/2026-09-24-traum-skizze-on-device.md).

   `requireOptionalNativeModule`: Ein Bau ohne das native Modul (Android,
   Web, ein älteres Binary über ein OTA-Update) bekommt `null` statt eines
   Absturzes — die Skizze erscheint dann einfach nicht in der Modellwahl. */
type Subscription = { remove(): void };
type NativeSketch = {
  isSupported(): boolean;
  modelReady(): boolean;
  modelBytes(): number;
  missingBytes(): number;
  sketchesDir(): string;
  downloadModel(): Promise<boolean>;
  cancelDownload(): void;
  cancelGeneration(): void;
  generateImage(prompt: string, negative: string, seed: number, steps: number, name: string): Promise<string>;
  renderSketch(frames: string[], name: string): Promise<string>;
  unload(): void;
  removeModel(): void;
  addListener(event: "onDownloadProgress", cb: (e: { done: number; total: number }) => void): Subscription;
  addListener(event: "onGenerateProgress", cb: (e: { phase: "loading" | "step"; step?: number; steps?: number }) => void): Subscription;
};

const Native = requireOptionalNativeModule<NativeSketch>("DreamSketch");

export const DreamSketch = Native;

/** Gibt es die Skizze auf DIESEM Gerät? (Modul vorhanden + genug Arbeitsspeicher) */
export function sketchAvailable(): boolean {
  try { return !!Native?.isSupported(); } catch { return false; }
}

/* `sketch:<datei>` → abspielbare file://-Adresse. Im Journal steht NIE der
   absolute Pfad: Der Container der App wechselt bei jedem Update. */
let dirCache: string | null = null;
export function resolveSketchUrl(u: string | null | undefined): string | null | undefined {
  if (typeof u !== "string" || !u.startsWith("sketch:") || !Native) return u;
  dirCache ??= Native.sketchesDir();
  return dirCache + u.slice("sketch:".length);
}

/* Der ganze Journal-Schnappschuss auf einmal (journal-data.tsx): EINE
   Stelle statt jeder Bildschirm einzeln — Journal-Karte, Traum-Seite,
   Fassungsleiste und Teilen-Karte bekommen spielbare Adressen, ohne von
   Skizzen zu wissen. Unverändertes wird nicht kopiert. */
export function resolveSketchesDeep<T>(value: T): T {
  if (!Native) return value;
  if (typeof value === "string") return (value.startsWith("sketch:") ? resolveSketchUrl(value) : value) as T;
  if (Array.isArray(value)) {
    let changed = false;
    const out = value.map((v) => { const r = resolveSketchesDeep(v); if (r !== v) changed = true; return r; });
    return (changed ? out : value) as T;
  }
  if (value && typeof value === "object") {
    let changed = false;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const r = resolveSketchesDeep(v);
      if (r !== v) changed = true;
      out[k] = r;
    }
    return (changed ? out : value) as T;
  }
  return value;
}
