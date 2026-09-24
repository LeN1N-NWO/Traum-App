import Foundation

/// Das Bildmodell der Traum-Skizze: Stable Diffusion 1.5, von Apple für
/// Core ML kompiliert und auf 6 Bit palettiert (split_einsum_v2 — läuft
/// auf der Neural Engine). Liegt NICHT im App-Bündel, sondern wird einmal
/// nachgeladen: 889 MB würden jeden App-Download verdoppeln, und nur
/// Menschen, die die Skizze wirklich wollen, sollen dafür zahlen.
///
/// Absichtlich NICHT geladen: der SafetyChecker (580 MB). ⚠ Vor der
/// App-Store-Einreichung muss die Inhaltsprüfung geklärt sein
/// (Plan 2026-09-24-traum-skizze-on-device.md) — bis dahin schützt nur
/// der Negativ-Prompt.
enum SketchModel {
  static let version = "sd15-palettized-split-einsum-v2"
  static let base = "https://huggingface.co/apple/coreml-stable-diffusion-v1-5-palettized/resolve/main/split_einsum_v2/compiled/"

  /// Pfad relativ zu `base` und Größe in Bytes (Hugging-Face-API, 24.09.2026).
  /// Die Größen dienen dem Fortschrittsbalken UND der Vollständigkeitsprüfung.
  static let files: [(String, Int64)] = [
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
    ("merges.txt", 524657),
    ("vocab.json", 862328),
  ]

  static var totalBytes: Int64 { files.reduce(0) { $0 + $1.1 } }

  /// Application Support statt Documents: Das Modell ist kein Nutzerinhalt.
  static var directory: URL {
    let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    return support.appendingPathComponent("DreamSketch/\(version)", isDirectory: true)
  }

  private static var readyMarker: URL { directory.appendingPathComponent(".ready") }

  static var isReady: Bool { FileManager.default.fileExists(atPath: readyMarker.path) }

  /// Was schon vollständig da ist — für die Wiederaufnahme nach Abbruch.
  static func hasFile(_ path: String, size: Int64) -> Bool {
    let url = directory.appendingPathComponent(path)
    guard let attrs = try? FileManager.default.attributesOfItem(atPath: url.path),
          let n = attrs[.size] as? NSNumber else { return false }
    return n.int64Value == size
  }

  static func markReady() throws {
    try Data().write(to: readyMarker)
    // ⚠ App-Store-Richtlinie 2.23: Nachladbare Inhalte dieser Größe dürfen
    // nicht ins iCloud-Backup. Einmal am Ordner setzen reicht.
    var dir = directory
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try dir.setResourceValues(values)
  }

  static func remove() throws {
    if FileManager.default.fileExists(atPath: directory.path) {
      try FileManager.default.removeItem(at: directory)
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

  func run(onProgress: @escaping Progress) async throws {
    self.onProgress = onProgress
    let fm = FileManager.default
    try fm.createDirectory(at: SketchModel.directory, withIntermediateDirectories: true)
    let total = SketchModel.totalBytes

    for (path, size) in SketchModel.files {
      if cancelled { throw CancellationError() }
      let dest = SketchModel.directory.appendingPathComponent(path)
      if SketchModel.hasFile(path, size: size) {
        finishedBytes += size
        onProgress(finishedBytes, total)
        continue
      }
      try fm.createDirectory(at: dest.deletingLastPathComponent(), withIntermediateDirectories: true)
      guard let url = URL(string: SketchModel.base + path) else { throw URLError(.badURL) }
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
    try SketchModel.markReady()
  }

  // MARK: URLSessionDownloadDelegate

  func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask,
                  didWriteData bytesWritten: Int64, totalBytesWritten: Int64,
                  totalBytesExpectedToWrite: Int64) {
    onProgress(finishedBytes + totalBytesWritten, SketchModel.totalBytes)
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
