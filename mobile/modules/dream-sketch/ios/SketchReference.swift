import CoreGraphics
import Vision

/// Das eigene Foto als Startbild (25.09., Antons Wunsch: „Was passiert, wenn
/// man Referenzen mit einfügt?"). SD 1.5 malt 512², das Foto ist meist
/// hochkant — der Ausschnitt folgt deshalb dem Gesicht, wenn Vision eins
/// findet: Kopf und Schultern statt Stirn oder Bauch.
enum SketchReference {
  static func square(_ image: CGImage, size: Int) throws -> CGImage {
    let w = CGFloat(image.width), h = CGFloat(image.height)
    var side = min(w, h)
    // Ohne Gesicht: Mitte, bei Hochformat etwas nach oben (dort sind Köpfe).
    var cx = w / 2
    var cy = h > w ? h * 0.42 : h / 2   // von oben gezählt

    let request = VNDetectFaceRectanglesRequest()
    try? VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
    if let face = request.results?.max(by: { $0.boundingBox.width < $1.boundingBox.width }) {
      let b = face.boundingBox   // normiert, Ursprung unten links
      cx = b.midX * w
      cy = (1 - b.midY) * h
      // Das Gesicht füllt gut ein Drittel der Höhe — genug Raum für den Traum drumherum.
      side = min(side, max(b.height * h * 2.8, side * 0.45))
      cy += side * 0.08   // Gesicht leicht über der Mitte
    }

    let x = min(max(cx - side / 2, 0), w - side)
    let y = min(max(cy - side / 2, 0), h - side)
    guard let crop = image.cropping(to: CGRect(x: x, y: y, width: side, height: side).integral) else {
      throw NSError(domain: "DreamSketch", code: 24, userInfo: [NSLocalizedDescriptionKey: "Ausschnitt fehlgeschlagen"])
    }
    guard let ctx = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: size * 4,
                              space: CGColorSpace(name: CGColorSpace.sRGB)!,
                              bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else {
      throw NSError(domain: "DreamSketch", code: 25)
    }
    ctx.interpolationQuality = .high
    ctx.draw(crop, in: CGRect(x: 0, y: 0, width: size, height: size))
    guard let out = ctx.makeImage() else { throw NSError(domain: "DreamSketch", code: 26) }
    return out
  }

  /// Ein Raster in gleich große Kacheln schneiden, je Kachel 2 % Rand weg
  /// (Trennlinie und Außenrand des Modells), dann auf `tileW`×`tileH` bringen.
  static func gridTiles(_ grid: CGImage, cols: Int, rows: Int, tileW: Int, tileH: Int) -> [CGImage] {
    let w = CGFloat(grid.width) / CGFloat(cols), h = CGFloat(grid.height) / CGFloat(rows)
    let inset = min(w, h) * 0.02
    var out: [CGImage] = []
    for r in 0..<rows {
      for c in 0..<cols {
        let rect = CGRect(x: CGFloat(c) * w + inset, y: CGFloat(r) * h + inset, width: w - 2 * inset, height: h - 2 * inset).integral
        guard let crop = grid.cropping(to: rect),
              let ctx = CGContext(data: nil, width: tileW, height: tileH, bitsPerComponent: 8, bytesPerRow: tileW * 4,
                                  space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
        else { continue }
        ctx.interpolationQuality = .high
        ctx.draw(crop, in: CGRect(x: 0, y: 0, width: tileW, height: tileH))
        if let img = ctx.makeImage() { out.append(img) }
      }
    }
    return out
  }
}
