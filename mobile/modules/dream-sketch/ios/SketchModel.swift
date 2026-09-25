import CoreML
import Foundation

/// Die Bildmodelle der Traum-Skizze — Stable Diffusion 1.5, für Core ML
/// kompiliert und auf 6 Bit palettiert (split_einsum_v2 — läuft auf der
/// Neural Engine). Liegen NICHT im App-Bündel, sondern werden einmal
/// nachgeladen: ~960 MB würden jeden App-Download verdoppeln, und nur
/// Menschen, die die Skizze wirklich wollen, sollen dafür zahlen.
///
/// Seit 25.09. zwei „Maler" zur Wahl (Antons Test: welches sieht besser
/// aus?): Apples SD 1.5 und DreamShaper 8 (OpenRAIL-M, Umwandlung eines
/// Dritten, auf einen Commit festgenagelt). Beide nutzen dieselbe Pipeline.
///
/// Absichtlich NICHT geladen: der SafetyChecker (580 MB). ⚠ Vor der
/// App-Store-Einreichung muss die Inhaltsprüfung geklärt sein
/// (Plan 2026-09-24-traum-skizze-on-device.md) — bis dahin schützt nur
/// der Negativ-Prompt.
struct SketchPainter {
  let id: String
  let folder: String
  let base: String
  let files: [(String, Int64)]

  /// Apple, Pfade und Größen laut Hugging-Face-API (24./25.09.2026).
  static let sd15 = SketchPainter(
    id: "sd15",
    folder: "sd15-palettized-split-einsum-v2",
    base: "https://huggingface.co/apple/coreml-stable-diffusion-v1-5-palettized/resolve/main/split_einsum_v2/compiled/",
    files: [
      ("TextEncoder.mlmodelc/analytics/coremldata.bin", 207),
      ("TextEncoder.mlmodelc/weights/weight.bin", 139866304),
      ("TextEncoder.mlmodelc/coremldata.bin", 825),
      ("TextEncoder.mlmodelc/metadata.json", 2771),
      ("TextEncoder.mlmodelc/model.mil", 208229),
      ("Unet.mlmodelc/analytics/coremldata.bin", 207),
      ("Unet.mlmodelc/weights/weight.bin", 645167616),
      ("Unet.mlmodelc/coremldata.bin", 1207),
      ("Unet.mlmodelc/metadata.json", 3705),
      ("Unet.mlmodelc/model.mil", 3040467),
      ("VAEDecoder.mlmodelc/analytics/coremldata.bin", 207),
      ("VAEDecoder.mlmodelc/weights/weight.bin", 98993280),
      ("VAEDecoder.mlmodelc/coremldata.bin", 755),
      ("VAEDecoder.mlmodelc/metadata.json", 2472),
      ("VAEDecoder.mlmodelc/model.mil", 181386),
      // Bild-zu-Bild (25.09.: das eigene Foto träumt) — ohne Encoder kann die
      // Pipeline kein Startbild lesen. Wer das Modell schon hat, lädt nur das nach.
      ("VAEEncoder.mlmodelc/analytics/coremldata.bin", 207),
      ("VAEEncoder.mlmodelc/weights/weight.bin", 68338112),
      ("VAEEncoder.mlmodelc/coremldata.bin", 761),
      ("VAEEncoder.mlmodelc/metadata.json", 2460),
      ("VAEEncoder.mlmodelc/model.mil", 139736),
      ("merges.txt", 524657),
      ("vocab.json", 862328),
    ])

  /// DreamShaper 8 (Lykon, OpenRAIL-M; Civitai 4384: Nennung nicht Pflicht).
  /// Umwandlung von darkmaniac7/TokForge — auf Commit 03c659e festgenagelt,
  /// damit niemand uns später andere Dateien unterschiebt.
  static let dreamshaper = SketchPainter(
    id: "dreamshaper8",
    folder: "dreamshaper8-palettized-split-einsum-v2",
    base: "https://huggingface.co/darkmaniac7/TokForge-DreamShaper-8-CoreML-6bit/resolve/03c659e398685e5fb49a6fbc2d0d6f69a240e0a6/Resources/",
    files: [
      ("TextEncoder.mlmodelc/analytics/coremldata.bin", 243),
      ("TextEncoder.mlmodelc/coremldata.bin", 934),
      ("TextEncoder.mlmodelc/metadata.json", 2969),
      ("TextEncoder.mlmodelc/model.mil", 185810),
      ("TextEncoder.mlmodelc/weights/weight.bin", 139910080),
      ("Unet.mlmodelc/analytics/coremldata.bin", 243),
      ("Unet.mlmodelc/coremldata.bin", 1367),
      ("Unet.mlmodelc/metadata.json", 3961),
      ("Unet.mlmodelc/model.mil", 3136991),
      ("Unet.mlmodelc/weights/weight.bin", 645325440),
      ("VAEDecoder.mlmodelc/analytics/coremldata.bin", 243),
      ("VAEDecoder.mlmodelc/coremldata.bin", 861),
      ("VAEDecoder.mlmodelc/metadata.json", 2666),
      ("VAEDecoder.mlmodelc/model.mil", 194901),
      ("VAEDecoder.mlmodelc/weights/weight.bin", 98993280),
      ("VAEEncoder.mlmodelc/analytics/coremldata.bin", 243),
      ("VAEEncoder.mlmodelc/coremldata.bin", 865),
      ("VAEEncoder.mlmodelc/metadata.json", 2650),
      ("VAEEncoder.mlmodelc/model.mil", 149286),
      ("VAEEncoder.mlmodelc/weights/weight.bin", 68338112),
      ("merges.txt", 524657),
      ("vocab.json", 862328),
    ])

  static let all = [sd15, dreamshaper]
  static func named(_ id: String?) -> SketchPainter { all.first { $0.id == id } ?? sd15 }
}

enum SketchModel {
  /// Das Tiefenmodell (25.09.: Parallaxe statt Diashow) — ein .mlpackage,
  /// das auf dem Gerät EINMAL kompiliert wird (SketchModel.depthModel).
  /// Gehört keinem Maler, liegt deshalb neben ihnen.
  static let depthBase = "https://huggingface.co/apple/coreml-depth-anything-v2-small/resolve/main/"
  static let depthPackage = "DepthAnythingV2SmallF16.mlpackage"
  static let depthFiles: [(String, Int64)] = [
    ("\(depthPackage)/Manifest.json", 617),
    ("\(depthPackage)/Data/com.apple.CoreML/model.mlmodel", 399433),
    ("\(depthPackage)/Data/com.apple.CoreML/weights/weight.bin", 49419072),
  ]

  /// Welcher Maler gewählt ist — merkt sich das Gerät (UserDefaults).
  static var painter: SketchPainter {
    get { SketchPainter.named(UserDefaults.standard.string(forKey: "dreamSketch.painter")) }
    set { UserDefaults.standard.set(newValue.id, forKey: "dreamSketch.painter") }
  }

  static var root: URL {
    FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("DreamSketch", isDirectory: true)
  }

  /// Application Support statt Documents: Das Modell ist kein Nutzerinhalt.
  static func directory(_ p: SketchPainter) -> URL { root.appendingPathComponent(p.folder, isDirectory: true) }

  /// Alles, was für einen Maler geladen wird: (Quelle, Zielpfad relativ zu `root`, Bytes).
  static func files(_ p: SketchPainter) -> [(url: String, path: String, size: Int64)] {
    p.files.map { (p.base + $0.0, p.folder + "/" + $0.0, $0.1) }
      + depthFiles.map { (depthBase + $0.0, "Depth/" + $0.0, $0.1) }
  }

  static func totalBytes(_ p: SketchPainter) -> Int64 { files(p).reduce(0) { $0 + $1.size } }

  /// Was noch fehlt — wer das Mal-Modell schon hat, lädt nur Neues nach.
  static func missingBytes(_ p: SketchPainter) -> Int64 {
    migrateDepth()
    return files(p).filter { !hasFile($0.path, size: $0.size) }.reduce(0) { $0 + $1.size }
  }

  private static func readyMarker(_ p: SketchPainter) -> URL { directory(p).appendingPathComponent(".ready") }

  /// Fertig heißt: Marke gesetzt UND jede Datei in voller Größe da — so
  /// bekommen Geräte mit älterem Stand Tiefe und Encoder nachgeliefert.
  static func isReady(_ p: SketchPainter) -> Bool {
    migrateDepth()
    return FileManager.default.fileExists(atPath: readyMarker(p).path) && files(p).allSatisfy { hasFile($0.path, size: $0.size) }
  }

  /// Bis 25.09. lag die Tiefe im Ordner des Apple-Malers — einmal umziehen,
  /// statt 50 MB neu zu laden.
  private static func migrateDepth() {
    let fm = FileManager.default
    let old = directory(.sd15).appendingPathComponent("Depth")
    let new = root.appendingPathComponent("Depth")
    guard fm.fileExists(atPath: old.path), !fm.fileExists(atPath: new.path) else { return }
    try? fm.moveItem(at: old, to: new)
  }

  /// Das Tiefenmodell, beim ersten Gebrauch auf dem Gerät kompiliert und
  /// danach aus dem Cache. nil → der Film fährt ohne Tiefe (Rückfall).
  static func depthModel() -> MLModel? {
    migrateDepth()
    let compiled = root.appendingPathComponent("Depth/DepthAnythingV2SmallF16.mlmodelc")
    let fm = FileManager.default
    do {
      if !fm.fileExists(atPath: compiled.path) {
        let package = root.appendingPathComponent("Depth/" + depthPackage)
        guard fm.fileExists(atPath: package.path) else { return nil }
        let temp = try MLModel.compileModel(at: package)
        try? fm.removeItem(at: compiled)
        try fm.moveItem(at: temp, to: compiled)
      }
      let config = MLModelConfiguration()
      config.computeUnits = .cpuAndNeuralEngine
      return try MLModel(contentsOf: compiled, configuration: config)
    } catch {
      return nil
    }
  }

  /// Was schon vollständig da ist — für die Wiederaufnahme nach Abbruch.
  static func hasFile(_ path: String, size: Int64) -> Bool {
    let url = root.appendingPathComponent(path)
    guard let attrs = try? FileManager.default.attributesOfItem(atPath: url.path),
          let n = attrs[.size] as? NSNumber else { return false }
    return n.int64Value == size
  }

  static func markReady(_ p: SketchPainter) throws {
    try Data().write(to: readyMarker(p))
    // ⚠ App-Store-Richtlinie 2.23: Nachladbare Inhalte dieser Größe dürfen
    // nicht ins iCloud-Backup. Einmal am Wurzelordner setzen reicht.
    var dir = root
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try dir.setResourceValues(values)
  }

  /// Alle Maler und die Tiefe — gibt den ganzen Speicher zurück.
  static func remove() throws {
    if FileManager.default.fileExists(atPath: root.path) {
      try FileManager.default.removeItem(at: root)
    }
  }
}

/// Lädt die Dateien nacheinander. Fertige Dateien werden übersprungen, sodass
/// ein abgebrochener Download beim nächsten Versuch dort weitermacht, wo er
/// stand (grob: dateiweise — der UNet-Brocken mit 645 MB beginnt neu).
final class SketchDownloader: NSObject, URLSessionDownloadDelegate {
  typealias Progress = (_ done: Int64, _ total: Int64) -> Void

  private var session: URLSession!
  private var onProgress: Progress = { _, _ in }
  private var finishedBytes: Int64 = 0
  private var continuation: CheckedContinuation<URL, Error>?
  private var target: URL?
  private(set) var cancelled = false

  override init() {
    super.init()
    let config = URLSessionConfiguration.default
    config.timeoutIntervalForRequest = 60
    config.waitsForConnectivity = true
    session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
  }

  func cancel() {
    cancelled = true
    session.invalidateAndCancel()
  }

  private var total: Int64 = 0

  func run(_ painter: SketchPainter, onProgress: @escaping Progress) async throws {
    self.onProgress = onProgress
    let fm = FileManager.default
    try fm.createDirectory(at: SketchModel.directory(painter), withIntermediateDirectories: true)
    total = SketchModel.totalBytes(painter)

    for (source, path, size) in SketchModel.files(painter) {
      if cancelled { throw CancellationError() }
      let dest = SketchModel.root.appendingPathComponent(path)
      if SketchModel.hasFile(path, size: size) {
        finishedBytes += size
        onProgress(finishedBytes, total)
        continue
      }
      try fm.createDirectory(at: dest.deletingLastPathComponent(), withIntermediateDirectories: true)
      guard let url = URL(string: source) else { throw URLError(.badURL) }
      target = dest
      _ = try await withCheckedThrowingContinuation { (c: CheckedContinuation<URL, Error>) in
        self.continuation = c
        self.session.downloadTask(with: url).resume()
      }
      guard SketchModel.hasFile(path, size: size) else {
        throw NSError(domain: "DreamSketch", code: 2,
                      userInfo: [NSLocalizedDescriptionKey: "Unvollständige Datei: \(path)"])
      }
      finishedBytes += size
      onProgress(finishedBytes, total)
    }
    try SketchModel.markReady(painter)
  }

  // MARK: URLSessionDownloadDelegate

  func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask,
                  didWriteData bytesWritten: Int64, totalBytesWritten: Int64,
                  totalBytesExpectedToWrite: Int64) {
    onProgress(finishedBytes + totalBytesWritten, total)
  }

  func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask,
                  didFinishDownloadingTo location: URL) {
    // Muss HIER passieren: Die temporäre Datei ist nach Rückkehr weg.
    guard let dest = target else { return }
    do {
      if let http = downloadTask.response as? HTTPURLResponse, http.statusCode != 200 {
        throw NSError(domain: "DreamSketch", code: http.statusCode,
                      userInfo: [NSLocalizedDescriptionKey: "HTTP \(http.statusCode)"])
      }
      if FileManager.default.fileExists(atPath: dest.path) {
        try FileManager.default.removeItem(at: dest)
      }
      try FileManager.default.moveItem(at: location, to: dest)
      continuation?.resume(returning: dest)
    } catch {
      continuation?.resume(throwing: error)
    }
    continuation = nil
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    guard let error = error else { return }
    continuation?.resume(throwing: error)
    continuation = nil
  }
}
