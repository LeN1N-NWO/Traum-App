import AVFoundation
import CoreImage
import CoreImage.CIFilterBuiltins
import CoreML

/// Aus dem Drehplan wird ein Film. Nur Core ML, Core Image und AVFoundation:
/// Das Bildmodell liefert den Inhalt, die „Game-Engine" die Bewegung —
/// nichts davon ist eine Vorlage.
///
/// Seit 25.09. (Antons Befund: „nur eine Slideshow mit sanfter Überblendung",
/// dann: „Parallax verstärken, Übergänge morphen"):
///  - EINE durchgehende Kamera über den ganzen Film (schwebt, statt je Szene
///    neu anzusetzen), stärkere Parallaxe, auf Wunsch eine Vertigo-Szene
///  - Übergänge als Morph: Zwischenbilder desselben Seeds mit gemischtem
///    Prompt, dicht hintereinander überblendet — Szene A verwandelt sich in B
///  - optional die Foto-Eröffnung: das eigene Foto, das zu träumen beginnt
///  - Nebel, der im Fernen treibt, und Teilchen in der Tiefe (SketchParticles)
///
/// Format: SD 1.5 malt quadratisch (512²), das Journal zeigt 9:16. Das
/// Quadrat ist die Bühne, über die das Hochformat-Fenster gleitet.
enum SketchRenderer {
  struct Options {
    var width = 576          // 9:16, doppelte SD-Auflösung — ehrlich weich, keine Scheinschärfe
    var height = 1024
    var fps: Int32 = 24
    var sceneHold = 3.0      // Szene steht (und fährt) so lange voll im Bild
    var openingHold = 2.4    // das Foto, bevor es zu träumen beginnt
    var morphFade = 0.45     // je Zwischenbild
    var plainFade = 0.9      // Übergang ohne Zwischenbilder
    var landingFade = 0.8    // letztes Foto-Traumbild → erste Szene
    var source = 512         // Rechenraster der Parallaxe (= SD-Auflösung)
    var flow: Float = 2.4    // Wogen des Fernen, in Punkten
  }

  struct Plan {
    var opening: [URL] = []  // [Foto, Zwischenbilder …] — leer = keine Foto-Eröffnung
    var scenes: [URL] = []
    var morphs: [[URL]] = [] // je Übergang (scenes.count - 1) die Zwischenbilder
    var particles: SketchParticles.Kind = .dust
    var vertigo = -1         // Szenen-Index mit Dolly-Zoom, -1 = keine
    var seed: UInt64 = 1
  }

  private struct Item {
    let url: URL
    let hold: Double
    let fade: Double
    let scene: Int           // Szenen-Index, -1 = Eröffnung/Zwischenbild
    var start = 0.0, full = 0.0, end = 0.0
  }

  /// Gibt die Filmlänge in Sekunden zurück.
  @discardableResult
  static func render(_ plan: Plan, depthModel: MLModel?, to output: URL, options o: Options = .init()) throws -> Double {
    // ── Drehplan → Zeitleiste ────────────────────────────────────────────
    var items: [Item] = []
    for (k, url) in plan.opening.enumerated() {
      items.append(Item(url: url, hold: k == 0 ? o.openingHold : 0, fade: k == 0 ? 0 : o.morphFade, scene: -1))
    }
    for (i, url) in plan.scenes.enumerated() {
      let between = i > 0 && i - 1 < plan.morphs.count ? plan.morphs[i - 1] : []
      for m in between { items.append(Item(url: m, hold: 0, fade: o.morphFade, scene: -1)) }
      let fade = items.isEmpty ? 0 : (i == 0 ? o.landingFade : (between.isEmpty ? o.plainFade : o.morphFade))
      items.append(Item(url: url, hold: o.sceneHold, fade: fade, scene: i))
    }
    guard !items.isEmpty else { throw NSError(domain: "DreamSketch", code: 11) }
    for k in items.indices {
      if k > 0 {
        items[k].start = items[k - 1].full + items[k - 1].hold
        items[k].full = items[k].start + items[k].fade
        items[k - 1].end = items[k].full
      }
    }
    items[items.count - 1].end = items[items.count - 1].full + items[items.count - 1].hold
    let total = items[items.count - 1].end

    // ── Bilder, Tiefe, Nebelmaske — einmal je Bild ───────────────────────
    let context = CIContext(options: [.cacheIntermediates: false])
    let n0 = o.source
    let stills: [CIImage] = try items.map { item in
      guard let img = CIImage(contentsOf: item.url) else {
        throw NSError(domain: "DreamSketch", code: 10, userInfo: [NSLocalizedDescriptionKey: "Bild fehlt: \(item.url.lastPathComponent)"])
      }
      return img
    }
    let pixels = stills.map { SketchParallax.rgba($0, size: n0, context: context) }
    let depths: [[Float]?] = stills.map { still in
      guard let m = depthModel else { return nil }
      return try? SketchDepth.estimate(still, model: m, size: n0, context: context)
    }
    let farMasks: [CIImage?] = depths.map { d in d.map { farMask($0, size: n0) } }
    let fogBase = fogNoise()

    // ── Kamera: fester Zufall je Traum ───────────────────────────────────
    var rng = SplitMix(seed: plan.seed)
    let ph = (0..<6).map { _ in rng.next() * .pi * 2 }
    let vertigoItem = items.firstIndex { $0.scene == plan.vertigo && plan.vertigo >= 0 }

    func vertigo(_ t: Double) -> Double {
      guard let k = vertigoItem else { return 0 }
      let a = items[k].full, b = items[k].full + items[k].hold
      return ease((t - a) / max(0.1, b - a)) * (1 - ease((t - b) / 0.9))
    }

    func camera(_ t: Double) -> SketchParallax.Camera {
      let tau = 2 * Double.pi
      var dx = 0.085 * sin(tau * t / 9 + ph[0])
      let dy = 0.022 * sin(tau * t / 13 + ph[1])
      var zoom = 0.12 + 0.08 * sin(tau * t / 11 + ph[2])
      var focus = 0.35
      let w = vertigo(t)
      if w > 0 {
        // Dolly-Zoom: Das Nahe bleibt, der Hintergrund schwillt an.
        zoom = zoom * (1 - w) - 0.38 * w
        focus = 0.35 * (1 - w) + 0.72 * w
        dx *= 1 - 0.7 * w
      }
      return .init(dx: Float(dx), dy: Float(dy), zoom: Float(zoom), focus: Float(focus))
    }

    /// Das 9:16-Fenster über dem Quadrat: Maßstab und Versatz, stetig über den ganzen Film.
    func window(_ t: Double) -> (s: Double, x: Double, y: Double) {
      let tau = 2 * Double.pi
      // Oben und unten ist wenig Rand (das Quadrat ist nur 12 % höher als
      // das Fenster) — dort gleitet es sparsam, sonst sieht man die geklemmten
      // Kanten der Parallaxe. Beim Dolly-Zoom etwas enger.
      let s = Double(o.height) / Double(n0) * (1.12 + 0.05 * sin(tau * t / 12 + ph[3]) + 0.08 * vertigo(t))
      let side = Double(n0) * s
      let fx = 0.5 + 0.28 * sin(tau * t / 10 + ph[4])
      let fy = 0.5 + 0.2 * sin(tau * t / 14 + ph[5])
      return (s, -(side - Double(o.width)) * fx, -(side - Double(o.height)) * fy)
    }

    let particles = SketchParticles.make(plan.particles, seed: plan.seed)

    // ── Schreiben ────────────────────────────────────────────────────────
    if FileManager.default.fileExists(atPath: output.path) { try FileManager.default.removeItem(at: output) }
    let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: o.width,
      AVVideoHeightKey: o.height,
      AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 4_500_000],
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

    let frames = Int((total * Double(o.fps)).rounded())
    let canvas = CGRect(x: 0, y: 0, width: o.width, height: o.height)

    for f in 0..<frames {
      let t = Double(f) / Double(o.fps)
      let cam = camera(t)
      let win = window(t)
      let place = CGAffineTransform(scaleX: win.s, y: win.s).concatenating(CGAffineTransform(translationX: win.x, y: win.y))

      // Sichtbare Bilder; alles unter dem obersten VOLL sichtbaren fällt weg.
      let active = items.indices.filter { t >= items[$0].start && t < items[$0].end }
      let alphaOf = { (k: Int) -> Double in items[k].fade <= 0 ? 1 : ease((t - items[k].start) / items[k].fade) }
      let firstOpaque = active.last { alphaOf($0) >= 1 } ?? active.first
      let visible = active.filter { $0 >= (firstOpaque ?? 0) }

      var frame = CIImage(color: .black).cropped(to: canvas)
      var dominant: Int? = nil
      for k in visible {
        var shot: CIImage
        if let d = depths[k] {
          let warped = SketchParallax.warp(rgba: pixels[k], depth: d, size: n0, camera: cam, time: Float(t), flow: o.flow)
          shot = SketchParallax.image(warped, size: n0)
          if let mask = farMasks[k] { shot = fog(fogBase, time: t, mask: mask, size: n0).composited(over: shot) }
        } else {
          shot = stills[k].transformed(by: CGAffineTransform(scaleX: Double(n0) / stills[k].extent.width, y: Double(n0) / stills[k].extent.height))
        }
        shot = shot.transformed(by: place).cropped(to: canvas)
        let a = alphaOf(k)
        if a < 1 {
          shot = shot.applyingFilter("CIColorMatrix", parameters: ["inputAVector": CIVector(x: 0, y: 0, z: 0, w: CGFloat(a))])
        }
        frame = shot.composited(over: frame)
        if a >= 0.5 || dominant == nil { dominant = k }
      }

      // Teilchen: gleiche Kamera, verdeckt von der Szene, die gerade vorherrscht.
      if let layer = SketchParticles.layer(particles, kind: plan.particles, time: t, width: o.width, height: o.height,
        shift: { z in
          let sh = z - Double(cam.focus)
          return CGPoint(x: Double(cam.dx) * sh * Double(n0) * win.s, y: -Double(cam.dy) * sh * Double(n0) * win.s)
        },
        surface: { u, v in
          guard let k = dominant, let d = depths[k] else { return nil }
          let sx = (u * Double(o.width) - win.x) / win.s, sy = (v * Double(o.height) - win.y) / win.s
          let col = Int(sx), row = n0 - 1 - Int(sy)
          guard col >= 0, col < n0, row >= 0, row < n0 else { return nil }
          return d[row * n0 + col]
        }) {
        frame = layer.applyingFilter("CIAdditionCompositing", parameters: [kCIInputBackgroundImageKey: frame]).cropped(to: canvas)
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
    return total
  }

  /// Wo Nebel liegen darf: das Ferne (Tiefe → 0), weich auslaufend.
  private static func farMask(_ depth: [Float], size: Int) -> CIImage {
    let bytes = depth.map { UInt8(min(max(powf(1 - $0, 1.6) * 255, 0), 255)) }
    return CIImage(bitmapData: Data(bytes), bytesPerRow: size, size: CGSize(width: size, height: size),
                   format: .L8, colorSpace: nil)
  }

  /// Wolkiges Rauschen als Nebelvorlage — einmal gebaut, je Bild nur verschoben.
  private static func fogNoise() -> CIImage {
    let random = CIFilter.randomGenerator().outputImage ?? CIImage(color: .gray)
    return random
      .transformed(by: CGAffineTransform(scaleX: 40, y: 40))
      .applyingGaussianBlur(sigma: 26)
  }

  private static func fog(_ noise: CIImage, time t: Double, mask: CIImage, size: Int) -> CIImage {
    let square = CGRect(x: 0, y: 0, width: size, height: size)
    // Alles in Graustufen (deckend) rechnen, erst am Ende färben — so gibt
    // es keine Fragen nach vormultipliziertem Alpha.
    let clouds = noise
      .transformed(by: CGAffineTransform(translationX: -t * 14, y: t * 3))
      .applyingFilter("CIColorMatrix", parameters: [
        "inputRVector": CIVector(x: 1.3, y: 0, z: 0, w: 0),
        "inputGVector": CIVector(x: 1.3, y: 0, z: 0, w: 0),
        "inputBVector": CIVector(x: 1.3, y: 0, z: 0, w: 0),
        "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 0),
        "inputBiasVector": CIVector(x: -0.52, y: -0.52, z: -0.52, w: 1),
      ])
      .applyingFilter("CIColorClamp")
      .cropped(to: square)
    // Wolken × Ferne × 40 % = wie dicht der Nebel an jeder Stelle liegt.
    let density = clouds
      .applyingFilter("CIMultiplyCompositing", parameters: [kCIInputBackgroundImageKey: mask])
      .applyingFilter("CIColorMatrix", parameters: [
        "inputRVector": CIVector(x: 0.4, y: 0, z: 0, w: 0),
        "inputGVector": CIVector(x: 0, y: 0.4, z: 0, w: 0),
        "inputBVector": CIVector(x: 0, y: 0, z: 0.4, w: 0),
      ])
      .cropped(to: square)
    let tint = CIImage(color: CIColor(red: 0.84, green: 0.88, blue: 1.0)).cropped(to: square)
    return tint.applyingFilter("CIBlendWithMask", parameters: [
      kCIInputBackgroundImageKey: CIImage(color: .clear).cropped(to: square),
      kCIInputMaskImageKey: density,
    ]).cropped(to: square)
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
