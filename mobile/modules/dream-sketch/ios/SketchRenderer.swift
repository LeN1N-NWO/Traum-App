import AVFoundation
import CoreImage
import CoreImage.CIFilterBuiltins
import UIKit

/// Aus den Keyframes wird ein Film: je Szene eine langsame Kamerafahrt durch
/// das Bild, weiche Überblendungen dazwischen, ein Hauch Traum (Bloom und
/// Vignette). Nur Core Image und AVFoundation — die „Game-Engine" liefert
/// die Bewegung, das Bildmodell den Inhalt; nichts davon ist eine Vorlage.
///
/// Format: SD 1.5 malt quadratisch (512²), das Journal zeigt 9:16. Statt zu
/// beschneiden, ist das Quadrat die Bühne, über die das Hochformat-Fenster
/// FÄHRT — die Beschneidung wird zur Kamerabewegung.
enum SketchRenderer {
  struct Options {
    var width = 576          // 9:16, doppelte SD-Auflösung — ehrlich weich, keine Scheinschärfe
    var height = 1024
    var fps: Int32 = 24
    var shotSeconds = 3.6
    var crossfadeSeconds = 0.9
  }

  static func render(images: [URL], to output: URL, options o: Options = .init()) throws {
    let context = CIContext(options: [.cacheIntermediates: false])
    let stills: [CIImage] = try images.map { url in
      guard let img = CIImage(contentsOf: url) else {
        throw NSError(domain: "DreamSketch", code: 10, userInfo: [NSLocalizedDescriptionKey: "Bild fehlt: \(url.lastPathComponent)"])
      }
      return img
    }
    guard !stills.isEmpty else { throw NSError(domain: "DreamSketch", code: 11) }

    if FileManager.default.fileExists(atPath: output.path) { try FileManager.default.removeItem(at: output) }
    let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: o.width,
      AVVideoHeightKey: o.height,
      AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 3_500_000],
    ])
    input.expectsMediaDataInRealTime = false
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
      kCVPixelBufferWidthKey as String: o.width,
      kCVPixelBufferHeightKey as String: o.height,
    ])
    writer.add(input)
    guard writer.startWriting() else { throw writer.error ?? NSError(domain: "DreamSketch", code: 12) }
    writer.startSession(atSourceTime: .zero)

    let n = stills.count
    let step = o.shotSeconds - o.crossfadeSeconds
    let total = Double(n) * o.shotSeconds - Double(n - 1) * o.crossfadeSeconds
    let frames = Int((total * Double(o.fps)).rounded())
    let canvas = CGRect(x: 0, y: 0, width: o.width, height: o.height)

    for f in 0..<frames {
      let t = Double(f) / Double(o.fps)
      var frame = CIImage(color: .black).cropped(to: canvas)
      for i in 0..<n {
        let start = Double(i) * step
        guard t >= start, t < start + o.shotSeconds else { continue }
        let p = (t - start) / o.shotSeconds
        var shot = move(stills[i], index: i, progress: p, canvas: canvas)
        // Einblenden über die Vorgängerszene (die erste steht sofort).
        if i > 0, t < start + o.crossfadeSeconds {
          let a = (t - start) / o.crossfadeSeconds
          shot = shot.applyingFilter("CIColorMatrix", parameters: ["inputAVector": CIVector(x: 0, y: 0, z: 0, w: CGFloat(ease(a)))])
        }
        frame = shot.composited(over: frame)
      }
      frame = dream(frame, canvas: canvas)

      while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.005) }
      guard let pool = adaptor.pixelBufferPool else { throw NSError(domain: "DreamSketch", code: 13) }
      var buffer: CVPixelBuffer?
      CVPixelBufferPoolCreatePixelBuffer(nil, pool, &buffer)
      guard let pb = buffer else { throw NSError(domain: "DreamSketch", code: 14) }
      context.render(frame, to: pb)
      adaptor.append(pb, withPresentationTime: CMTime(value: CMTimeValue(f), timescale: o.fps))
    }

    input.markAsFinished()
    let done = DispatchSemaphore(value: 0)
    writer.finishWriting { done.signal() }
    done.wait()
    if writer.status != .completed { throw writer.error ?? NSError(domain: "DreamSketch", code: 15) }
  }

  /// Die Kamerafahrt: Das Quadrat füllt die Höhe; das Hochformat-Fenster
  /// gleitet quer darüber und schiebt sich dabei leicht heran. Die Richtung
  /// wechselt je Szene, damit aus fünf Bildern kein Diavortrag wird.
  private static func move(_ img: CIImage, index: Int, progress p: Double, canvas: CGRect) -> CIImage {
    let e = ease(p)
    let zoom = 1.0 + 0.10 * e
    let s = canvas.height / img.extent.height * zoom
    let scaled = img.transformed(by: CGAffineTransform(scaleX: s, y: s))
    let travel = scaled.extent.width - canvas.width             // wie weit das Fenster fahren kann
    let from = index % 2 == 0 ? 0.15 : 0.85
    let to = index % 2 == 0 ? 0.85 : 0.15
    let x = -travel * (from + (to - from) * e)
    let y = -(scaled.extent.height - canvas.height) / 2
    return scaled.transformed(by: CGAffineTransform(translationX: x - scaled.extent.minX, y: y - scaled.extent.minY))
      .cropped(to: canvas)
  }

  /// Traumschein: Bloom um die Lichter, dunkler Rand. Dezent — die Skizze
  /// soll nach Erinnerung aussehen, nicht nach Filter.
  private static func dream(_ img: CIImage, canvas: CGRect) -> CIImage {
    let bloom = CIFilter.bloom()
    bloom.inputImage = img
    bloom.radius = 10
    bloom.intensity = 0.45
    let vignette = CIFilter.vignette()
    vignette.inputImage = bloom.outputImage?.cropped(to: canvas) ?? img
    vignette.intensity = 0.9
    vignette.radius = 1.6
    return (vignette.outputImage ?? img).cropped(to: canvas)
  }

  private static func ease(_ x: Double) -> Double {
    let c = min(max(x, 0), 1)
    return c * c * (3 - 2 * c)
  }
}
