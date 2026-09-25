import CoreML
import ExpoModulesCore
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

    /// Das 2×2-Raster aus der Cloud laden und in vier 512²-Kacheln schneiden
    /// (Lesereihenfolge: oben links, oben rechts, unten links, unten rechts).
    /// Trennlinien und ein dünner Rand fallen dabei weg. Gibt die vier
    /// `sketch:`-Namen zurück.
    AsyncFunction("importGrid") { (source: String, prefix: String, promise: Promise) in
      self.work.async {
        do {
          guard let url = URL(string: source) else { throw URLError(.badURL) }
          guard let grid = UIImage(data: try Data(contentsOf: url))?.cgImage else {
            throw NSError(domain: "DreamSketch", code: 28, userInfo: [NSLocalizedDescriptionKey: "Raster unlesbar"])
          }
          var names: [String] = []
          for (i, tile) in SketchReference.gridTiles(grid, cols: 2, rows: 2, size: 512).enumerated() {
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
          var o = SketchRenderer.Options()
          if let fog = plan["fog"] as? Double { o.fog = max(0, min(fog, 0.6)) }
          // Tiefe (Parallaxe) wenn möglich; fehlt das Modell, fährt der Film ohne.
          let seconds = try SketchRenderer.render(p, depthModel: SketchModel.depthModel(), to: dir.appendingPathComponent(name), options: o)
          promise.resolve(["film": "sketch:" + name, "seconds": seconds])
        } catch {
          promise.reject("E_RENDER", error.localizedDescription)
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

  static func sketchesDir() -> URL {
    let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let dir = docs.appendingPathComponent("sketches", isDirectory: true)
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    return dir
  }
}
