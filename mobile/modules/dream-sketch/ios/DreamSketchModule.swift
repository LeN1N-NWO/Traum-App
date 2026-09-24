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

    /// Ab 8 GB Arbeitsspeicher (iPhone 15 Pro und neuer): Darunter würde
    /// iOS die App beim Laden des UNet beenden.
    Function("isSupported") { () -> Bool in
      ProcessInfo.processInfo.physicalMemory >= 7_500_000_000
    }

    Function("modelReady") { () -> Bool in SketchModel.isReady }

    Function("modelBytes") { () -> Double in Double(SketchModel.totalBytes) }

    /// Wo die fertigen Skizzen liegen (file://…/Documents/sketches/). Die
    /// App löst `sketch:<name>` zur Anzeige damit auf.
    Function("sketchesDir") { () -> String in Self.sketchesDir().absoluteString }

    AsyncFunction("downloadModel") { (promise: Promise) in
      if SketchModel.isReady { promise.resolve(true); return }
      let d = SketchDownloader()
      self.downloader = d
      Task {
        do {
          try await d.run { done, total in
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
    AsyncFunction("generateImage") { (prompt: String, negative: String, seed: Int, steps: Int, name: String, promise: Promise) in
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

    /// Die Keyframes (`sketch:`-Namen) werden zum Film; gibt `sketch:<name>` zurück.
    AsyncFunction("renderSketch") { (frames: [String], name: String, promise: Promise) in
      self.work.async {
        do {
          let dir = Self.sketchesDir()
          let urls = frames.map { dir.appendingPathComponent($0.replacingOccurrences(of: "sketch:", with: "")) }
          try SketchRenderer.render(images: urls, to: dir.appendingPathComponent(name))
          promise.resolve("sketch:" + name)
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
    guard SketchModel.isReady else {
      throw NSError(domain: "DreamSketch", code: 1, userInfo: [NSLocalizedDescriptionKey: "Modell nicht geladen"])
    }
    sendEvent("onGenerateProgress", ["phase": "loading"])
    let config = MLModelConfiguration()
    config.computeUnits = .cpuAndNeuralEngine
    let p = try StableDiffusionPipeline(
      resourcesAt: SketchModel.directory,
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
