import AVFoundation
import CoreML
import ExpoModulesCore
import Speech
import UIKit

/// Die Traum-Skizze (Antons Ansage 24.09.2026): eine Stufe ohne Credits,
/// gerendert mit der Rechenleistung des eigenen iPhones. Plan:
/// docs/plans/2026-09-24-traum-skizze-on-device.md
///
/// Ablauf für die App: `isSupported` → `modelReady` / `downloadModel` →
/// je Szene `generateImage` → `renderSketch`. Ergebnisse liegen in
/// Documents/sketches und werden im Journal als `sketch:<datei>` gespeichert
/// — NIE als absoluter Pfad: Der Container-Pfad der App wechselt bei jedem
/// Update, ein gespeicherter file://-Pfad wäre nach dem nächsten Update tot.
public class DreamSketchModule: Module {
  private let work = DispatchQueue(label: "dreamrushes.sketch", qos: .userInitiated)
  private var pipeline: StableDiffusionPipeline?
  private var downloader: SketchDownloader?
  private var cancelGeneration = false

  public func definition() -> ModuleDefinition {
    Name("DreamSketch")
    Events("onDownloadProgress", "onGenerateProgress")

    /// Seit dem Cloud-Raster (25.09.) rechnet das iPhone nur Tiefe und Film —
    /// das kann jedes Gerät mit dem Modul. Das Malen auf dem Gerät (SD, ab
    /// 8 GB) fragt `canPaint`.
    Function("isSupported") { () -> Bool in true }

    Function("canPaint") { () -> Bool in
      ProcessInfo.processInfo.physicalMemory >= 7_500_000_000
    }

    /// Die Maler zur Wahl (25.09.: Antons Vergleichstest) — je Maler, ob er
    /// geladen ist und was noch fehlt. Die Tiefe teilen sich alle.
    Function("painters") { () -> [[String: Any]] in
      SketchPainter.all.map { p in
        ["id": p.id, "ready": SketchModel.isReady(p),
         "missing": Double(SketchModel.missingBytes(p)), "total": Double(SketchModel.totalBytes(p))]
      }
    }

    Function("painter") { () -> String in SketchModel.painter.id }

    Function("selectPainter") { (id: String) in
      let next = SketchPainter.named(id)
      guard next.id != SketchModel.painter.id else { return }
      SketchModel.painter = next
      // Der geladene Maler passt nicht mehr — beim nächsten Bild neu laden.
      self.work.async {
        self.pipeline?.unloadResources()
        self.pipeline = nil
      }
    }

    Function("modelReady") { () -> Bool in SketchModel.isReady(SketchModel.painter) }

    Function("modelBytes") { () -> Double in Double(SketchModel.totalBytes(SketchModel.painter)) }

    /// Was noch zu laden ist — nach einem Update oft nur ein paar MB
    /// (Tiefe 25.09., Encoder 25.09.) für alle, die den Maler schon haben.
    Function("missingBytes") { () -> Double in Double(SketchModel.missingBytes(SketchModel.painter)) }

    /// Wo die fertigen Skizzen liegen (file://…/Documents/sketches/). Die
    /// App löst `sketch:<name>` zur Anzeige damit auf.
    Function("sketchesDir") { () -> String in Self.sketchesDir().absoluteString }

    AsyncFunction("downloadModel") { (promise: Promise) in
      let painter = SketchModel.painter
      if SketchModel.isReady(painter) { promise.resolve(true); return }
      let d = SketchDownloader()
      self.downloader = d
      Task {
        do {
          try await d.run(painter) { done, total in
            self.sendEvent("onDownloadProgress", ["done": Double(done), "total": Double(total)])
          }
          self.downloader = nil
          promise.resolve(true)
        } catch {
          self.downloader = nil
          promise.reject("E_DOWNLOAD", d.cancelled ? "cancelled" : error.localizedDescription)
        }
      }
    }

    Function("cancelDownload") { self.downloader?.cancel() }

    Function("cancelGeneration") { self.cancelGeneration = true }

    /// Ein Bild, 512×512. Der erste Aufruf lädt die Modelle auf die Neural
    /// Engine — beim allerersten Mal kompiliert iOS sie dafür, das kann
    /// eine Minute dauern (danach zwischengespeichert). Die App zeigt die
    /// Phase über `onGenerateProgress` an.
    ///
    /// `options` (alle optional, 25.09.):
    ///  - morphPrompt + morphWeight: Zwischenbild zweier Szenen (Traum-Morph)
    ///  - startImage (`sketch:`-Name) + strength: Bild-zu-Bild — das eigene
    ///    Foto wird geträumt (0 = Foto bleibt, 1 = nur noch Prompt)
    AsyncFunction("generateImage") { (prompt: String, negative: String, seed: Int, steps: Int, name: String, options: [String: Any]?, promise: Promise) in
      self.cancelGeneration = false
      self.work.async {
        do {
          let pipe = try self.loadedPipeline()
          var config = StableDiffusionPipeline.Configuration(prompt: prompt)
          config.negativePrompt = negative
          config.stepCount = max(8, min(steps, 40))
          config.seed = UInt32(truncatingIfNeeded: seed)
          config.guidanceScale = 7.5
          config.schedulerType = .dpmSolverMultistepScheduler
          config.disableSafety = true
          if let mix = options?["morphPrompt"] as? String, let w = options?["morphWeight"] as? Double {
            config.morphPrompt = mix
            config.morphWeight = Float(w)
          }
          if let start = options?["startImage"] as? String {
            let url = Self.sketchesDir().appendingPathComponent(start.replacingOccurrences(of: "sketch:", with: ""))
            guard let src = UIImage(contentsOfFile: url.path)?.cgImage else {
              throw NSError(domain: "DreamSketch", code: 21, userInfo: [NSLocalizedDescriptionKey: "Startbild fehlt"])
            }
            config.startingImage = src
            config.strength = Float(min(max((options?["strength"] as? Double) ?? 0.6, 0.05), 0.99))
          }
          let images = try pipe.generateImages(configuration: config) { progress in
            self.sendEvent("onGenerateProgress", ["phase": "step", "step": progress.step, "steps": progress.stepCount])
            return !self.cancelGeneration
          }
          guard let cg = images.compactMap({ $0 }).first else {
            promise.reject("E_GENERATE", self.cancelGeneration ? "cancelled" : "Kein Bild erzeugt")
            return
          }
          let url = Self.sketchesDir().appendingPathComponent(name)
          guard let png = UIImage(cgImage: cg).pngData() else { throw NSError(domain: "DreamSketch", code: 20) }
          try png.write(to: url, options: .atomic)
          promise.resolve("sketch:" + name)
        } catch {
          promise.reject("E_GENERATE", error.localizedDescription)
        }
      }
    }

    /// Ein eigenes Foto (Bibliothek/Besetzung: http(s)-, file:- oder
    /// data:-Adresse) als 512²-Startbild ablegen. Der Ausschnitt folgt dem
    /// Gesicht, falls Vision eins findet — ein Porträt soll nicht am Kinn
    /// enden. Gibt `sketch:<name>` zurück.
    AsyncFunction("importReference") { (source: String, name: String, promise: Promise) in
      self.work.async {
        do {
          guard let url = URL(string: source) else { throw URLError(.badURL) }
          let data = try Data(contentsOf: url)
          guard let ui = UIImage(data: data) else {
            throw NSError(domain: "DreamSketch", code: 22, userInfo: [NSLocalizedDescriptionKey: "Foto unlesbar"])
          }
          // Handyfotos tragen ihre Drehung als EXIF — `cgImage` ignoriert sie.
          let format = UIGraphicsImageRendererFormat()
          format.scale = 1
          let upright = ui.imageOrientation == .up ? ui.cgImage
            : UIGraphicsImageRenderer(size: ui.size, format: format).image { _ in ui.draw(at: .zero) }.cgImage
          guard let img = upright else { throw NSError(domain: "DreamSketch", code: 22) }
          let square = try SketchReference.square(img, size: 512)
          guard let png = UIImage(cgImage: square).pngData() else { throw NSError(domain: "DreamSketch", code: 23) }
          try png.write(to: Self.sketchesDir().appendingPathComponent(name), options: .atomic)
          promise.resolve("sketch:" + name)
        } catch {
          promise.reject("E_REFERENCE", error.localizedDescription)
        }
      }
    }

    /// Ein Foto der Besetzung als data:-URI für die Cloud (JPEG, lange Seite
    /// ≤ 1024, EXIF-Drehung beachtet) — egal ob es als data:, file: oder
    /// http(s) vorliegt. Die Reihenfolge der Fotos entscheidet die Brücke.
    AsyncFunction("referenceData") { (source: String, promise: Promise) in
      self.work.async {
        do {
          guard let url = URL(string: source) else { throw URLError(.badURL) }
          guard let ui = UIImage(data: try Data(contentsOf: url)) else {
            throw NSError(domain: "DreamSketch", code: 22, userInfo: [NSLocalizedDescriptionKey: "Foto unlesbar"])
          }
          let scale = min(1, 1024 / max(ui.size.width, ui.size.height))
          let size = CGSize(width: (ui.size.width * scale).rounded(), height: (ui.size.height * scale).rounded())
          let format = UIGraphicsImageRendererFormat()
          format.scale = 1
          let small = UIGraphicsImageRenderer(size: size, format: format).image { _ in ui.draw(in: CGRect(origin: .zero, size: size)) }
          guard let jpg = small.jpegData(compressionQuality: 0.85) else { throw NSError(domain: "DreamSketch", code: 27) }
          promise.resolve("data:image/jpeg;base64," + jpg.base64EncodedString())
        } catch {
          promise.reject("E_REFERENCE", error.localizedDescription)
        }
      }
    }

    /// Das Raster aus der Cloud laden und schneiden. Seit 26.09. ein
    /// Streifen aus VIER Hochkant-Kacheln (1×4, je 576×1024 — genau das
    /// Filmformat, nichts wird mehr weggeschnitten); `cols`/`rows` sagen es.
    /// Trennlinien und ein dünner Rand fallen dabei weg. Gibt die vier
    /// `sketch:`-Namen zurück.
    AsyncFunction("importGrid") { (source: String, prefix: String, cols: Int, rows: Int, promise: Promise) in
      self.work.async {
        do {
          guard let url = URL(string: source) else { throw URLError(.badURL) }
          guard let grid = UIImage(data: try Data(contentsOf: url))?.cgImage else {
            throw NSError(domain: "DreamSketch", code: 28, userInfo: [NSLocalizedDescriptionKey: "Raster unlesbar"])
          }
          var names: [String] = []
          let portrait = rows == 1 && cols >= 3
          let tw = portrait ? 576 : 512, th = portrait ? 1024 : 512
          for (i, tile) in SketchReference.gridTiles(grid, cols: max(1, cols), rows: max(1, rows), tileW: tw, tileH: th).enumerated() {
            let name = prefix + "-\(i).png"
            guard let png = UIImage(cgImage: tile).pngData() else { throw NSError(domain: "DreamSketch", code: 29) }
            try png.write(to: Self.sketchesDir().appendingPathComponent(name), options: .atomic)
            names.append("sketch:" + name)
          }
          promise.resolve(names)
        } catch {
          promise.reject("E_GRID", error.localizedDescription)
        }
      }
    }

    /// Der Film aus dem Drehplan (25.09.): optional die Foto-Eröffnung,
    /// die Szenen, je Übergang die Morph-Zwischenbilder, dazu Partikel und
    /// eine Vertigo-Szene. Gibt `{ film: "sketch:<name>", seconds }` zurück.
    AsyncFunction("renderSketch") { (plan: [String: Any], name: String, promise: Promise) in
      self.work.async {
        /* Glimpse im Hintergrund (26.09.): Verlässt man die App mitten im
           Rendern, gibt iOS mit dieser Frist noch Zeit, den Film fertig zu
           rechnen, statt ihn anzuhalten. */
        var bg = UIBackgroundTaskIdentifier.invalid
        bg = UIApplication.shared.beginBackgroundTask(withName: "glimpse-render") {
          UIApplication.shared.endBackgroundTask(bg); bg = .invalid
        }
        defer { if bg != .invalid { UIApplication.shared.endBackgroundTask(bg) } }
        do {
          let dir = Self.sketchesDir()
          let file = { (s: String) in dir.appendingPathComponent(s.replacingOccurrences(of: "sketch:", with: "")) }
          var p = SketchRenderer.Plan()
          p.opening = ((plan["opening"] as? [String]) ?? []).map(file)
          p.scenes = ((plan["scenes"] as? [String]) ?? []).map(file)
          p.morphs = ((plan["morphs"] as? [[String]]) ?? []).map { $0.map(file) }
          p.particles = SketchParticles.Kind(rawValue: (plan["particles"] as? String) ?? "dust") ?? .dust
          p.vertigo = (plan["vertigo"] as? Int) ?? -1
          p.seed = UInt64(truncatingIfNeeded: (plan["seed"] as? Int) ?? 1)
          p.effects = (plan["effects"] as? Bool) ?? true
          var o = SketchRenderer.Options()
          if let fog = plan["fog"] as? Double { o.fog = max(0, min(fog, 0.6)) }
          // Mehr Szenen → jede kürzer (26.09., src/lib/sketchQuota.js sketchTiming).
          if let hold = plan["hold"] as? Double { o.sceneHold = max(0.8, min(hold, 5)) }
          if let fade = plan["fade"] as? Double { o.plainFade = max(0.4, min(fade, 2.5)) }
          // Tiefe (Parallaxe) wenn möglich; fehlt das Modell, fährt der Film ohne.
          let film = dir.appendingPathComponent(name)
          let seconds = try SketchRenderer.render(p, depthModel: SketchModel.depthModel(), to: film, options: o)
          // Der Ton (26.09.) ist Kür: klappt er nicht, bleibt der Film stumm.
          var sound = false
          if let s = plan["sound"] as? String, let url = URL(string: s) {
            do { try SketchSound.add(film: film, sound: url); sound = true }
            catch { NSLog("[DreamSketch] Ton übersprungen: \(error.localizedDescription)") }
          }
          promise.resolve(["film": "sketch:" + name, "seconds": seconds, "sound": sound])
        } catch {
          promise.reject("E_RENDER", error.localizedDescription)
        }
      }
    }

    /// Den Ton unter einen fertigen Film legen — schreibt die Datei um.
    /// ⚠ Nie auf eine Datei, die schon abgespielt wird (27.09., der Loop
    /// blieb stehen): Für nachgereichten Ton kopiert die GlimpseLayer den
    /// Film erst und ruft addSound auf der Kopie auf.
    AsyncFunction("addSound") { (film: String, sound: String, promise: Promise) in
      self.work.async {
        do {
          guard let url = URL(string: sound) else { throw URLError(.badURL) }
          let file = Self.sketchesDir().appendingPathComponent(film.replacingOccurrences(of: "sketch:", with: ""))
          try SketchSound.add(film: file, sound: url)
          promise.resolve(true)
        } catch {
          promise.reject("E_SOUND", error.localizedDescription)
        }
      }
    }

    /// Gibt die rund 1 GB Arbeitsspeicher der geladenen Modelle frei —
    /// nach der Skizze, damit der Rest der App nicht darunter leidet.
    Function("unload") {
      self.work.async {
        self.pipeline?.unloadResources()
        self.pipeline = nil
      }
    }

    Function("removeModel") {
      self.work.async {
        self.pipeline = nil
        try? SketchModel.remove()
      }
    }

    /// Der Sammelfilm aus den ECHTEN Clips (Antons Wahl 10.10., „Weg A"):
    /// bis dahin bekam jeder Traum nur ein Standbild mit gespielter Tiefe —
    /// „peinlich", auch teure KI-Filme wurden zum animierten Foto. Jetzt:
    /// die Filme selbst, auf den Takt der Musik geschnitten, weich
    /// überblendet, mit Titel und Abspann. Siehe `SketchMontage` unten.
    /// plan: clips ([Adresse]), music (Adresse?), slot/fade/tail (Sekunden),
    /// title, subtitle, endTitle, endSub, font. Adressen: "sketch:…",
    /// "file://…" oder ein Pfad.
    AsyncFunction("renderMontage") { (plan: [String: Any], name: String, promise: Promise) in
      self.work.async {
        var bg = UIBackgroundTaskIdentifier.invalid
        bg = UIApplication.shared.beginBackgroundTask(withName: "ring-montage") {
          UIApplication.shared.endBackgroundTask(bg); bg = .invalid
        }
        defer { if bg != .invalid { UIApplication.shared.endBackgroundTask(bg) } }
        do {
          var p = SketchMontage.Plan()
          p.clips = ((plan["clips"] as? [String]) ?? []).compactMap(Self.fileURL)
          p.music = (plan["music"] as? String).flatMap(Self.fileURL)
          if let v = plan["slot"] as? Double { p.slot = max(1.5, min(v, 8)) }
          if let v = plan["fade"] as? Double { p.fade = max(0.2, min(v, p.slot * 0.4)) }
          if let v = plan["tail"] as? Double { p.tail = max(0.5, min(v, 6)) }
          p.title = (plan["title"] as? String) ?? ""
          p.subtitle = (plan["subtitle"] as? String) ?? ""
          p.endTitle = (plan["endTitle"] as? String) ?? ""
          p.endSub = (plan["endSub"] as? String) ?? ""
          if let f = plan["font"] as? String, !f.isEmpty { p.font = f }
          if let o = plan["overlays"] as? Bool { p.overlays = o }
          let dir = Self.sketchesDir()
          let film = dir.appendingPathComponent(name)
          let posterName = (name as NSString).deletingPathExtension + ".jpg"
          let seconds = try SketchMontage.render(p, to: film, poster: dir.appendingPathComponent(posterName))
          promise.resolve(["film": "sketch:" + name, "poster": "sketch:" + posterName, "seconds": seconds])
        } catch {
          promise.reject("E_MONTAGE", error.localizedDescription)
        }
      }
    }

    /// Sprache → Text AUF dem iPhone (Antons Versuch 10.10.: „ein SDK
    /// direkt von Apple, ohne über die API zu gehen — vielleicht schneller").
    /// iOS 26: SpeechAnalyzer + SpeechTranscriber, dasselbe Modell wie
    /// Diktat, Notizen und Sprachmemos. Kein Upload, kein Server.
    ///
    /// Bewusst in DIESER Datei statt einer eigenen: eine neue Swift-Datei
    /// im Modul bräuchte `pod install` (Hannis Mac).
    ///
    /// `speechPrepare(lang)`: Ist das Sprachpaket da? Fehlt es, lädt iOS es
    /// im Hintergrund — bis dahin schreibt der Server mit.
    /// → "installed" | "downloading" | "unsupported"
    AsyncFunction("speechPrepare") { (lang: String) async -> String in
      guard #available(iOS 26.0, *) else { return "unsupported" }
      return await OnDeviceSpeech.prepare(lang)
    }

    /// Eine fertige Aufnahme (file://…m4a) aufschreiben. Wirft, wenn es auf
    /// diesem Gerät nicht geht — die App fällt dann auf den Server zurück.
    AsyncFunction("transcribeFile") { (uri: String, lang: String) async throws -> [String: Any] in
      guard #available(iOS 26.0, *) else { throw OnDeviceSpeechError("unsupported") }
      guard let url = URL(string: uri), url.isFileURL else { throw OnDeviceSpeechError("badUri") }
      let t0 = Date()
      let text = try await OnDeviceSpeech.transcribe(url: url, lang: lang)
      return ["text": text, "ms": Int(Date().timeIntervalSince(t0) * 1000)]
    }
  }

  private func loadedPipeline() throws -> StableDiffusionPipeline {
    if let p = pipeline { return p }
    let painter = SketchModel.painter
    guard SketchModel.isReady(painter) else {
      throw NSError(domain: "DreamSketch", code: 1, userInfo: [NSLocalizedDescriptionKey: "Modell nicht geladen"])
    }
    sendEvent("onGenerateProgress", ["phase": "loading"])
    let config = MLModelConfiguration()
    config.computeUnits = .cpuAndNeuralEngine
    let p = try StableDiffusionPipeline(
      resourcesAt: SketchModel.directory(painter),
      controlNet: [],
      configuration: config,
      disableSafety: true,
      reduceMemory: false
    )
    try p.loadResources()
    pipeline = p
    return p
  }

  /// "sketch:<datei>", "file://…" oder ein Pfad → Datei-URL.
  static func fileURL(_ s: String) -> URL? {
    if s.hasPrefix("sketch:") { return sketchesDir().appendingPathComponent(String(s.dropFirst("sketch:".count))) }
    if s.hasPrefix("file://") { return URL(string: s) }
    if s.hasPrefix("/") { return URL(fileURLWithPath: s) }
    return nil
  }

  static func sketchesDir() -> URL {
    let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let dir = docs.appendingPathComponent("sketches", isDirectory: true)
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    return dir
  }
}

struct OnDeviceSpeechError: LocalizedError {
  let code: String
  init(_ code: String) { self.code = code }
  var errorDescription: String? { code }
}

/// Apples Spracherkennung auf dem Gerät (iOS 26) — siehe `transcribeFile`.
@available(iOS 26.0, *)
enum OnDeviceSpeech {
  /// Der Transkribierer für eine Sprache ("de", "en", leer = die erste
  /// Sprache des iPhones — in der spricht man; die App-Sprache kann davon
  /// abweichen, und Apples Modell versteht nur die eine Sprache), oder nil.
  static func transcriber(_ lang: String) async -> SpeechTranscriber? {
    guard SpeechTranscriber.isAvailable else { return nil }
    let wanted = lang.isEmpty ? Locale(identifier: Locale.preferredLanguages.first ?? Locale.current.identifier) : Locale(identifier: lang)
    guard let locale = await SpeechTranscriber.supportedLocale(equivalentTo: wanted) else { return nil }
    return SpeechTranscriber(locale: locale, preset: .transcription)
  }

  static func prepare(_ lang: String) async -> String {
    guard let t = await transcriber(lang) else { return "unsupported" }
    switch await AssetInventory.status(forModules: [t]) {
    case .installed: return "installed"
    case .unsupported: return "unsupported"
    default:
      // Laden im Hintergrund; niemand wartet darauf.
      if let request = try? await AssetInventory.assetInstallationRequest(supporting: [t]) {
        Task.detached { try? await request.downloadAndInstall() }
      }
      return "downloading"
    }
  }

  static func transcribe(url: URL, lang: String) async throws -> String {
    guard let t = await transcriber(lang) else { throw OnDeviceSpeechError("unsupported") }
    guard await AssetInventory.status(forModules: [t]) == .installed else {
      _ = await prepare(lang)
      throw OnDeviceSpeechError("notInstalled")
    }
    let file = try AVAudioFile(forReading: url)
    // Die Ergebnisse einsammeln, BEVOR die Analyse läuft (so Apples Beispiel).
    async let collected: [String] = try t.results.reduce(into: [String]()) { acc, r in
      acc.append(String(r.text.characters))
    }
    let analyzer = SpeechAnalyzer(modules: [t])
    if let last = try await analyzer.analyzeSequence(from: file) {
      try await analyzer.finalizeAndFinish(through: last)
    } else {
      await analyzer.cancelAndFinishNow()
    }
    // Abschnitte zusammenfügen, ohne doppelte oder fehlende Leerzeichen.
    var out = ""
    for part in try await collected {
      let piece = part.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !piece.isEmpty else { continue }
      out += out.isEmpty ? piece : " " + piece
    }
    return out
  }
}

/// Der Sammelfilm (renderMontage): echte Clips, auf einem festen Raster
/// geschnitten (`slot` = vier Schläge der Musik), jeder Schnitt eine kurze
/// Überblendung, der letzte Clip läuft für den Abspann länger.
///
/// Aufbau: zwei Videospuren im Wechsel (A, B, A, …) — so überlappen sich
/// Nachbarn genau in der Überblendung. Die Anweisungen der Videokomposition
/// decken die Zeit lückenlos ab: allein, Übergang, allein … Jeder Clip
/// füllt das Hochformat ohne Verzerrung (Seitenverhältnis halten,
/// beschneiden). Ist ein Clip kürzer als sein Platz, wird er gedehnt.
/// Titel und Abspann liegen als Ebenen darüber (Core Animation).
enum SketchMontage {
  struct Plan {
    var clips: [URL] = []
    var music: URL?
    var slot: Double = 4 * 60 / 68.0
    var fade: Double = 0.5
    var tail: Double = 2.4
    var title = "", subtitle = "", endTitle = "", endSub = ""
    var font = "Georgia"
    var overlays = true            // Titel und Abspann (aus nach einem Absturz, siehe makeMoonFilm)
    var size = CGSize(width: 1080, height: 1920)
  }

  static func fail(_ code: Int, _ text: String) -> NSError {
    NSError(domain: "DreamSketch", code: code, userInfo: [NSLocalizedDescriptionKey: text])
  }

  static func render(_ p: Plan, to out: URL, poster: URL) throws -> Double {
    let ts: CMTimeScale = 600
    func t(_ s: Double) -> CMTime { CMTime(value: CMTimeValue((s * Double(ts)).rounded()), timescale: ts) }
    let W = p.size.width, H = p.size.height

    // Nur Clips mit Bild; die Zeitleiste rechnet erst danach.
    let clips: [(asset: AVURLAsset, video: AVAssetTrack)] = p.clips.compactMap { url in
      let a = AVURLAsset(url: url)
      guard let v = a.tracks(withMediaType: .video).first, v.timeRange.duration.seconds > 0.3 else {
        NSLog("[montage] Clip ohne Bild übersprungen: %@", url.lastPathComponent)
        return nil
      }
      return (a, v)
    }
    // Die Musik vorab prüfen — taugt sie nicht, trägt der Ton der Clips.
    let musicAsset = p.music.map { AVURLAsset(url: $0) }
    let musicTrack = musicAsset?.tracks(withMediaType: .audio).first
    let withMusic = musicTrack != nil && (musicTrack?.timeRange.duration.seconds ?? 0) > 2
    if p.music != nil && !withMusic { NSLog("[montage] Musik unbrauchbar: %@", p.music?.lastPathComponent ?? "") }
    let m = clips.count
    guard m >= 2 else { throw fail(51, "Zu wenige Clips für den Sammelfilm") }

    let slotT = t(p.slot), fadeT = t(p.fade), tailT = t(p.tail)
    func startT(_ k: Int) -> CMTime { CMTimeMultiply(slotT, multiplier: Int32(k)) }
    let total = CMTimeAdd(startT(m), tailT)

    let comp = AVMutableComposition()
    guard let va = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid),
          let vb = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid),
          let audio = comp.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
      throw fail(52, "Spuren fehlen")
    }
    let lanes = [va, vb]
    var transforms: [CGAffineTransform] = []

    for (k, c) in clips.enumerated() {
      let lane = lanes[k % 2]
      let want = k == m - 1 ? CMTimeAdd(slotT, tailT) : CMTimeAdd(slotT, fadeT)
      // Die BILDSPUR zählt, nicht die Datei — ihr Ton kann länger sein (10.10.: -12780).
      let src = c.video.timeRange
      let have = src.duration
      let at = startT(k)
      do {
        if CMTimeCompare(have, want) >= 0 {
          // die Mitte des Clips — dort ist meist am meisten zu sehen
          let from = CMTimeAdd(src.start, CMTimeMultiplyByRatio(CMTimeSubtract(have, want), multiplier: 1, divisor: 2))
          try lane.insertTimeRange(CMTimeRange(start: from, duration: want), of: c.video, at: at)
          // Ohne Musik trägt der eigene Ton — nur bis zum nächsten Schnitt, nie doppelt.
          if !withMusic, let a = c.asset.tracks(withMediaType: .audio).first {
            let dur = k == m - 1 ? want : slotT
            let range = CMTimeRangeGetIntersection(CMTimeRange(start: from, duration: dur), otherRange: a.timeRange)
            if range.duration.seconds > 0.1 { try? audio.insertTimeRange(range, of: a, at: at) }
          }
        } else {
          try lane.insertTimeRange(src, of: c.video, at: at)
          lane.scaleTimeRange(CMTimeRange(start: at, duration: have), toDuration: want)
        }
      } catch {
        NSLog("[montage] Clip %d (%@, %.2f s Bild) nicht einsetzbar: %@", k, c.asset.url.lastPathComponent, have.seconds, (error as NSError).description)
        throw error
      }
      // Hochformat füllen, Seitenverhältnis halten (Ausrichtung des Clips beachten).
      let pt = c.video.preferredTransform
      let r = CGRect(origin: .zero, size: c.video.naturalSize).applying(pt)
      let w = abs(r.width), h = abs(r.height)
      let scale = max(W / max(w, 1), H / max(h, 1))
      let tr = pt
        .concatenating(CGAffineTransform(translationX: -r.minX, y: -r.minY))
        .concatenating(CGAffineTransform(scaleX: scale, y: scale))
        .concatenating(CGAffineTransform(translationX: (W - w * scale) / 2, y: (H - h * scale) / 2))
      transforms.append(tr)
    }

    // Die Anweisungen: allein — Übergang — allein …, lückenlos von 0 bis zum Ende.
    var instructions: [AVMutableVideoCompositionInstruction] = []
    func layer(_ k: Int, at: CMTime) -> AVMutableVideoCompositionLayerInstruction {
      let l = AVMutableVideoCompositionLayerInstruction(assetTrack: lanes[k % 2])
      l.setTransform(transforms[k], at: at)
      return l
    }
    for k in 0..<m {
      let soloStart = k == 0 ? CMTime.zero : CMTimeAdd(startT(k), fadeT)
      let soloEnd = k == m - 1 ? total : startT(k + 1)
      if CMTimeCompare(soloEnd, soloStart) > 0 {
        let i = AVMutableVideoCompositionInstruction()
        i.timeRange = CMTimeRange(start: soloStart, end: soloEnd)
        i.layerInstructions = [layer(k, at: soloStart)]
        instructions.append(i)
      }
      if k < m - 1 {
        let range = CMTimeRange(start: startT(k + 1), duration: fadeT)
        let i = AVMutableVideoCompositionInstruction()
        i.timeRange = range
        let from = layer(k, at: range.start)
        from.setOpacityRamp(fromStartOpacity: 1, toEndOpacity: 0, timeRange: range)
        i.layerInstructions = [from, layer(k + 1, at: range.start)]
        instructions.append(i)
      }
    }

    let vc = AVMutableVideoComposition()
    vc.renderSize = p.size
    vc.frameDuration = CMTime(value: 1, timescale: 30)
    vc.instructions = instructions

    // Titel am Anfang, Abspann am Ende — Ebenen über dem Film.
    // ⚠ Nicht im Simulator: Dessen OpenGL-Renderer stürzt mit Ebenen über
    // dem Video ab (10.10., _xpc_shmem_create in CA::OGL). Auf dem iPhone
    // rendert Core Animation über Metal — dort gehören sie dazu.
    let end = total.seconds
    #if !targetEnvironment(simulator)
    if p.overlays {
    let parent = CALayer(), video = CALayer()
    parent.frame = CGRect(origin: .zero, size: p.size)
    video.frame = parent.frame
    parent.isGeometryFlipped = true
    parent.addSublayer(video)
    if !p.title.isEmpty { parent.addSublayer(titleCard(p, end: end)) }
    if !p.endTitle.isEmpty || !p.endSub.isEmpty { parent.addSublayer(endCard(p, end: end)) }
    vc.animationTool = AVVideoCompositionCoreAnimationTool(postProcessingAsVideoLayer: video, in: parent)
    }
    #else
    NSLog("[montage] Simulator: ohne Titel und Abspann")
    #endif

    // Musik: ein-, am Ende ausblenden.
    var mix: AVMutableAudioMix?
    if withMusic, let a = musicTrack {
      let len = CMTimeMinimum(a.timeRange.duration, total)
      do { try audio.insertTimeRange(CMTimeRange(start: a.timeRange.start, duration: len), of: a, at: .zero) }
      catch { NSLog("[montage] Musik nicht einsetzbar: %@", (error as NSError).description) }
      let params = AVMutableAudioMixInputParameters(track: audio)
      params.setVolumeRamp(fromStartVolume: 0, toEndVolume: 1, timeRange: CMTimeRange(start: .zero, duration: t(0.8)))
      let fadeOut = t(min(2.2, len.seconds / 3))
      params.setVolumeRamp(fromStartVolume: 1, toEndVolume: 0, timeRange: CMTimeRange(start: CMTimeSubtract(len, fadeOut), duration: fadeOut))
      let am = AVMutableAudioMix()
      am.inputParameters = [params]
      mix = am
    }

    // Eine leere Tonspur (keine Musik, Clips ohne Ton) lässt den Export scheitern.
    if audio.segments.isEmpty { comp.removeTrack(audio) }
    NSLog("[montage] %d Clips, Musik: %@, Länge %.2f s, %d Anweisungen", m, p.music?.lastPathComponent ?? "—", total.seconds, instructions.count)
    let check = MontageCheck()
    if !vc.isValid(for: comp, timeRange: CMTimeRange(start: .zero, duration: comp.duration), validationDelegate: check) {
      NSLog("[montage] Komposition ungültig: %@", check.notes.joined(separator: " | "))
    }

    try? FileManager.default.removeItem(at: out)
    // HEVC: halb so groß wie H.264 bei gleicher Güte (10.10.: 20 s waren 30 MB).
    let presets = AVAssetExportSession.exportPresets(compatibleWith: comp)
    let preset = presets.contains(AVAssetExportPresetHEVCHighestQuality) ? AVAssetExportPresetHEVCHighestQuality : AVAssetExportPresetHighestQuality
    guard let export = AVAssetExportSession(asset: comp, presetName: preset) else {
      throw fail(53, "Export nicht möglich")
    }
    export.outputURL = out
    export.outputFileType = .mp4
    export.videoComposition = vc
    export.audioMix = mix
    export.shouldOptimizeForNetworkUse = true
    let done = DispatchSemaphore(value: 0)
    export.exportAsynchronously { done.signal() }
    done.wait()
    guard export.status == .completed else {
      let e = export.error as NSError?
      NSLog("[montage] Export: %@ · %@", e?.description ?? "—", (e?.userInfo[NSUnderlyingErrorKey] as? NSError)?.description ?? "—")
      throw fail(54, "Export fehlgeschlagen: \(e?.localizedDescription ?? "?") (\(e?.code ?? 0))")
    }

    // Das Poster: ein Bild mit Titel, kurz nach dem Anfang.
    let gen = AVAssetImageGenerator(asset: AVURLAsset(url: out))
    gen.appliesPreferredTrackTransform = true
    gen.maximumSize = CGSize(width: 720, height: 1280)
    if let cg = try? gen.copyCGImage(at: t(min(1.6, end / 2)), actualTime: nil),
       let jpg = UIImage(cgImage: cg).jpegData(compressionQuality: 0.85) {
      try? jpg.write(to: poster)
    }
    return end
  }

  /// Text als Ebene, mittig, umbrechend. Bewusst ein schlichter String
  /// (Schrift, Größe, Farbe an der Ebene) — bei formatierten Strings setzt
  /// CATextLayer Farbe und Ausrichtung nicht überall gleich um.
  static func text(_ s: String, font: String, size: CGFloat, color: UIColor, frame: CGRect) -> CATextLayer {
    let l = CATextLayer()
    l.frame = frame
    l.alignmentMode = .center
    l.isWrapped = true
    l.contentsScale = 1
    // Familienname („Iowan Old Style") oder genauer Name — beides geht.
    l.font = UIFont(name: font, size: size) ?? UIFont(descriptor: UIFontDescriptor(fontAttributes: [.family: font]), size: size)
    l.fontSize = size
    l.foregroundColor = color.cgColor
    l.string = s
    return l
  }

  /// Deckkraft über die Zeit (Sekunden ab Filmanfang): Stützpunkte (Zeit, Wert).
  static func fade(_ layer: CALayer, _ points: [(Double, Float)], total: Double) {
    let a = CAKeyframeAnimation(keyPath: "opacity")
    a.values = points.map { $0.1 }
    a.keyTimes = points.map { NSNumber(value: $0.0 / total) }
    a.duration = total
    a.beginTime = AVCoreAnimationBeginTimeAtZero
    a.isRemovedOnCompletion = false
    a.fillMode = .both
    layer.add(a, forKey: "fade")
    layer.opacity = points.last?.1 ?? 0
  }

  static func titleCard(_ p: Plan, end: Double) -> CALayer {
    let W = p.size.width, H = p.size.height
    let card = CALayer()
    card.frame = CGRect(x: 0, y: 0, width: W, height: H)
    let shade = CAGradientLayer()
    shade.frame = card.frame
    shade.colors = [UIColor(white: 0, alpha: 0).cgColor, UIColor(red: 0.02, green: 0.04, blue: 0.08, alpha: 0.72).cgColor, UIColor(white: 0, alpha: 0).cgColor]
    shade.locations = [0.35, 0.62, 0.9]
    card.addSublayer(shade)
    card.addSublayer(text(p.title, font: p.font, size: 92, color: .white, frame: CGRect(x: 80, y: H * 0.52, width: W - 160, height: 240)))
    if !p.subtitle.isEmpty {
      card.addSublayer(text(p.subtitle, font: "HelveticaNeue-Medium", size: 34, color: UIColor(red: 0.88, green: 0.79, blue: 0.61, alpha: 1), frame: CGRect(x: 80, y: H * 0.52 + 250, width: W - 160, height: 120)))
    }
    let out = min(3.4, end * 0.25)
    fade(card, [(0, 0), (0.25, 0), (0.9, 1), (out - 0.7, 1), (out, 0), (end, 0)], total: end)
    return card
  }

  static func endCard(_ p: Plan, end: Double) -> CALayer {
    let W = p.size.width, H = p.size.height
    let card = CALayer()
    card.frame = CGRect(x: 0, y: 0, width: W, height: H)
    card.backgroundColor = UIColor(red: 0.02, green: 0.04, blue: 0.08, alpha: 0.86).cgColor
    card.addSublayer(text(p.endTitle, font: p.font, size: 76, color: .white, frame: CGRect(x: 90, y: H * 0.40, width: W - 180, height: 260)))
    card.addSublayer(text(p.endSub, font: "HelveticaNeue-Medium", size: 30, color: UIColor(red: 0.96, green: 0.78, blue: 0.36, alpha: 1), frame: CGRect(x: 90, y: H * 0.40 + 290, width: W - 180, height: 80)))
    let from = max(0, end - p.tail - 0.4)
    fade(card, [(0, 0), (from, 0), (min(end, from + 1.0), 1), (end, 1)], total: end)
    return card
  }
}

/// Sammelt, was die Videokomposition bemängelt (nur fürs Protokoll).
final class MontageCheck: NSObject, AVVideoCompositionValidationHandling {
  var notes: [String] = []
  func videoComposition(_ c: AVVideoComposition, shouldContinueValidatingAfterFindingInvalidValueForKey key: String) -> Bool { notes.append("Wert \(key)"); return true }
  func videoComposition(_ c: AVVideoComposition, shouldContinueValidatingAfterFindingEmptyTimeRange r: CMTimeRange) -> Bool { notes.append("Lücke \(r.start.seconds)–\(r.end.seconds)"); return true }
  func videoComposition(_ c: AVVideoComposition, shouldContinueValidatingAfterFindingInvalidTimeRangeIn i: AVVideoCompositionInstructionProtocol) -> Bool { notes.append("Zeitbereich \(i.timeRange.start.seconds)–\(i.timeRange.end.seconds)"); return true }
  func videoComposition(_ c: AVVideoComposition, shouldContinueValidatingAfterFindingInvalidTrackIDIn i: AVVideoCompositionInstructionProtocol, layerInstruction l: AVVideoCompositionLayerInstruction, asset: AVAsset) -> Bool { notes.append("Spur \(l.trackID) bei \(i.timeRange.start.seconds)"); return true }
}
