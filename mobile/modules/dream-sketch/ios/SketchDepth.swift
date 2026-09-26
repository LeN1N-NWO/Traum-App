import CoreImage
import CoreML
import Vision

/// Tiefe für die Traum-Skizze (Antons Befund 25.09.: „nur eine Slideshow mit
/// sanfter Überblendung — sollte da nicht noch was mit Tiefe kommen").
///
/// Depth Anything V2 small (Apple, Core ML, F16, ~50 MB) schätzt aus einem
/// Standbild, was nah und was fern ist. `SketchParallax` verschiebt damit
/// jeden Bildpunkt je nach Nähe verschieden weit — der Vordergrund wandert
/// gegen den Hintergrund, die Kamera scheint IN das Bild zu fahren
/// („3D-Foto"). Keine Vorlage: Die Tiefe steckt im gemalten Bild selbst.
enum SketchDepth {
  /// Tiefenkarte in `w`×`h`, 0 = fern … 1 = nah, leicht geglättet
  /// (harte Kanten in der Tiefe reißen beim Verschieben sonst sichtbar auf).
  /// Seit 26.09. auch hochkant (Kacheln 576×1024 statt 512²).
  static func estimate(_ image: CIImage, model: MLModel, w: Int, h: Int, context: CIContext) throws -> [Float] {
    let request = VNCoreMLRequest(model: try VNCoreMLModel(for: model))
    // Das Modell will 518×392; das Bild wird dafür gestaucht —
    // die Tiefe kommt beim Zurückskalieren unverzerrt wieder heraus.
    request.imageCropAndScaleOption = .scaleFill
    try VNImageRequestHandler(ciImage: image, options: [:]).perform([request])
    guard let obs = request.results?.first as? VNPixelBufferObservation else {
      throw NSError(domain: "DreamSketch", code: 30, userInfo: [NSLocalizedDescriptionKey: "Keine Tiefenkarte"])
    }
    let raw = CIImage(cvPixelBuffer: obs.pixelBuffer)
    let sx = CGFloat(w) / raw.extent.width, sy = CGFloat(h) / raw.extent.height
    let m = Double(min(w, h))
    // Erst das Nahe um ein paar Punkte weiten, dann glätten: Bei der
    // stärkeren Fahrt (25.09.) reißt sonst die Kante des Vordergrunds auf —
    // so dehnt sich der Hintergrund statt der Figur.
    let scaled = raw.transformed(by: CGAffineTransform(scaleX: sx, y: sy))
      .clampedToExtent()
      .applyingFilter("CIMorphologyMaximum", parameters: [kCIInputRadiusKey: m / 128])
      .applyingGaussianBlur(sigma: m / 170)
      .cropped(to: CGRect(x: 0, y: 0, width: w, height: h))

    var out = [Float](repeating: 0, count: w * h)
    out.withUnsafeMutableBytes { buf in
      context.render(scaled, toBitmap: buf.baseAddress!, rowBytes: w * 4,
                     bounds: CGRect(x: 0, y: 0, width: w, height: h), format: .Lf, colorSpace: nil)
    }
    // ⚠ Zeilenreihenfolge: Bild (SketchParallax.rgba) und Tiefe werden über
    // DIESELBE Schnittstelle gelesen (render toBitmap) — dann liegen sie
    // garantiert deckungsgleich, egal wie Core Image intern zählt.
    // Relative Tiefe → 0…1 (robust: 2. und 98. Perzentil statt min/max).
    let sorted = out.sorted()
    let lo = sorted[Int(Double(sorted.count) * 0.02)], hi = sorted[Int(Double(sorted.count) * 0.98)]
    let span = max(hi - lo, 1e-4)
    return out.map { min(max(($0 - lo) / span, 0), 1) }
  }
}

/// Die 2.5D-Kamera: pro Bild eine Verschiebung je Tiefe. Rückwärts gerechnet
/// (für jeden Ausgabepunkt: woher im Original?), deshalb ohne Löcher; die
/// Tiefe wird zweimal nachgeschlagen, damit Ränder nicht verschmieren.
enum SketchParallax {
  struct Camera {
    var dx: Float      // seitlicher Versatz in Bildbreiten je Tiefeneinheit (nah minus Fokus)
    var dy: Float
    var zoom: Float    // Dolly: Nahes wächst schneller als Fernes
    var focus: Float   // Tiefe, die stillsteht (0…1)
  }

  /// Ein Bild als RGBA-Bytes, über dieselbe Schnittstelle wie die Tiefe
  /// (render toBitmap) — siehe Warnung in `SketchDepth.estimate`.
  static func rgba(_ image: CIImage, w: Int, h: Int, context: CIContext) -> [UInt8] {
    let sx = CGFloat(w) / image.extent.width, sy = CGFloat(h) / image.extent.height
    let scaled = image.transformed(by: CGAffineTransform(scaleX: sx, y: sy))
    var out = [UInt8](repeating: 0, count: w * h * 4)
    out.withUnsafeMutableBytes { buf in
      context.render(scaled, toBitmap: buf.baseAddress!, rowBytes: w * 4,
                     bounds: CGRect(x: 0, y: 0, width: w, height: h), format: .RGBA8,
                     colorSpace: CGColorSpace(name: CGColorSpace.sRGB))
    }
    return out
  }

  /// Umkehrung von `rgba` — Bytes zurück in ein CIImage für den Film.
  static func image(_ rgba: [UInt8], w: Int, h: Int) -> CIImage {
    CIImage(bitmapData: Data(rgba), bytesPerRow: w * 4,
            size: CGSize(width: w, height: h), format: .RGBA8,
            colorSpace: CGColorSpace(name: CGColorSpace.sRGB))
  }

  /// `rgba`: w×h, 4 Bytes je Punkt. `flow` (Punkte) lässt das Ferne —
  /// Himmel, Wasser, Nebel — sacht wogen, `time` in Sekunden treibt es an:
  /// Das Bild atmet, statt stillzustehen (25.09.).
  static func warp(rgba: [UInt8], depth: [Float], w: Int, h: Int, camera c: Camera, time: Float = 0, flow: Float = 0) -> [UInt8] {
    var out = [UInt8](repeating: 0, count: rgba.count)
    let n = w
    let halfX = Float(w) / 2, halfY = Float(h) / 2
    let fw = Float(w), fh = Float(h)
    rgba.withUnsafeBufferPointer { src in
      depth.withUnsafeBufferPointer { dep in
        out.withUnsafeMutableBufferPointer { dst in
          let s = src.baseAddress!, d = dep.baseAddress!, o = dst.baseAddress!
          func depthAt(_ x: Float, _ y: Float) -> Float {
            let xi = min(max(Int(x), 0), w - 1), yi = min(max(Int(y), 0), h - 1)
            return d[yi * n + xi]
          }
          DispatchQueue.concurrentPerform(iterations: h) { y in
            let fy = Float(y) + 0.5
            for x in 0..<w {
              let fx = Float(x) + 0.5
              var px = fx, py = fy
              for _ in 0..<2 {
                let sh = depthAt(px, py) - c.focus
                let z = 1 + c.zoom * sh
                px = halfX + (fx - halfX) / z - c.dx * sh * fw
                py = halfY + (fy - halfY) / z - c.dy * sh * fw
              }
              if flow > 0 {
                let far = max(0, 0.42 - depthAt(fx, fy)) / 0.42
                if far > 0 {
                  let f = far * far * flow
                  px += f * sinf(fy * 0.041 + time * 1.15) + f * 0.5 * sinf(fy * 0.013 - time * 0.6)
                  py += f * 0.45 * sinf(fx * 0.033 + time * 0.85)
                }
              }
              // bilinear, am Rand geklemmt
              let cx = min(max(px - 0.5, 0), fw - 1.001), cy = min(max(py - 0.5, 0), fh - 1.001)
              let x0 = Int(cx), y0 = Int(cy)
              let ax = cx - Float(x0), ay = cy - Float(y0)
              let i00 = (y0 * n + x0) * 4, i10 = i00 + 4, i01 = i00 + n * 4, i11 = i01 + 4
              let oi = (y * n + x) * 4
              for k in 0..<4 {
                let top = Float(s[i00 + k]) * (1 - ax) + Float(s[i10 + k]) * ax
                let bot = Float(s[i01 + k]) * (1 - ax) + Float(s[i11 + k]) * ax
                o[oi + k] = UInt8(min(max(top * (1 - ay) + bot * ay, 0), 255))
              }
            }
          }
        }
      }
    }
    return out
  }
}
