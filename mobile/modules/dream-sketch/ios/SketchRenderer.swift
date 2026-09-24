import AVFoundation
import CoreImage
import CoreImage.CIFilterBuiltins
import CoreML

/// Aus den Keyframes wird ein Film: je Szene eine Kamerafahrt IN das Bild
/// (2.5D-Parallaxe aus der Tiefenkarte, SketchDepth.swift), weiche
/// Überblendungen dazwischen, ein Hauch Traum (Bloom und Vignette). Nur
/// Core ML, Core Image und AVFoundation — die „Game-Engine" liefert die
/// Bewegung, das Bildmodell den Inhalt; nichts davon ist eine Vorlage.
///
/// Format: SD 1.5 malt quadratisch (512²), das Journal zeigt 9:16. Das
/// Quadrat ist die Bühne, über die das Hochformat-Fenster ruhig gleitet;
/// die eigentliche Bewegung kommt seit 25.09. aus der Tiefe (Antons Befund:
/// „nur eine Slideshow mit sanfter Überblendung").
enum SketchRenderer {
  struct Options {
    var width = 576          // 9:16, doppelte SD-Auflösung — ehrlich weich, keine Scheinschärfe
    var height = 1024
    var fps: Int32 = 24
    var shotSeconds = 3.6
    var crossfadeSeconds = 0.9
    var source = 512         // Rechenraster der Parallaxe (= SD-Auflösung)
  }

  /// `depthModel` nil → Fahrt ohne Tiefe (Rückfall, falls das Tiefenmodell fehlt).
  static func render(images: [URL], depthModel: MLModel?, to output: URL, options o: Options = .init()) throws {
    let context = CIContext(options: [.cacheIntermediates: false])
    let stills: [CIImage] = try images.map { url in
      guard let img = CIImage(contentsOf: url) else {
        throw NSError(domain: "DreamSketch", code: 10, userInfo: [NSLocalizedDescriptionKey: "Bild fehlt: \(url.lastPathComponent)"])
      }
      return img
    }
    guard !stills.isEmpty else { throw NSError(domain: "DreamSketch", code: 11) }

    // Einmal je Szene: Bytes und Tiefe. Die Tiefe ist das Teure (~0,1 s je
    // Bild auf der Neural Engine), die Verschiebung je Bild ist billig.
    let n0 = o.source
    let pixels = stills.map { SketchParallax.rgba($0, size: n0, context: context) }
    let depths: [[Float]?] = stills.map { still in
      guard let m = depthModel else { return nil }
      return try? SketchDepth.estimate(still, model: m, size: n0, context: context)
    }

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
        let still: CIImage
        if let d = depths[i] {
          let warped = SketchParallax.warp(rgba: pixels[i], depth: d, size: n0, camera: camera(index: i, progress: p))
          still = SketchParallax.image(warped, size: n0)
        } else {
          still = stills[i]
        }
        var shot = move(still, index: i, progress: p, canvas: canvas, withDepth: depths[i] != nil)
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

  /// Die 2.5D-Kamera je Szene: seitlicher Schwenk (Richtung wechselt je
  /// Szene) plus ein Dolly nach vorn. Der Fokus liegt im Mittelgrund — das
  /// Nahe zieht an der Kamera vorbei, das Ferne bleibt fast stehen.
  static func camera(index: Int, progress p: Double) -> SketchParallax.Camera {
    let e = Float(ease(p))
    let dir: Float = index % 2 == 0 ? 1 : -1
    // Stärke am Leuchtturm-Test (25.09.) eingestellt: 0,045/0,10 war am
    // Handy zu zaghaft; darüber reißen die Kanten (Turm vor Himmel) auf.
    return .init(dx: dir * 0.065 * (e - 0.5) * 2, dy: -0.015 * e, zoom: 0.15 * e, focus: 0.35)
  }

  /// Das Hochformat-Fenster über dem Quadrat. Mit Tiefe gleitet es nur
  /// ruhig (die Bewegung macht die Parallaxe); ohne Tiefe fährt es weit
  /// wie bisher, damit wenigstens die Fahrt bleibt.
  private static func move(_ img: CIImage, index: Int, progress p: Double, canvas: CGRect, withDepth: Bool) -> CIImage {
    let e = ease(p)
    let zoom = 1.04 + (withDepth ? 0.04 : 0.10) * e
    let s = canvas.height / img.extent.height * zoom
    let scaled = img.transformed(by: CGAffineTransform(scaleX: s, y: s))
    let travel = scaled.extent.width - canvas.width
    let span = withDepth ? 0.18 : 0.35
    let from = index % 2 == 0 ? 0.5 - span : 0.5 + span
    let to = index % 2 == 0 ? 0.5 + span : 0.5 - span
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

  static func ease(_ x: Double) -> Double {
    let c = min(max(x, 0), 1)
    return c * c * (3 - 2 * c)
  }
}
