import CoreGraphics
import CoreImage
import Foundation

/// Schwebeteilchen IN der Tiefe (25.09., Antons Wunsch nach mehr Bewegung):
/// Staub, Schnee, Glühwürmchen, Funken oder Blasen. Jedes Teilchen hat eine
/// eigene Tiefe — es zieht mit der Parallaxe verschieden schnell vorbei,
/// Nahes wird groß und unscharf (Bokeh), und was HINTER einer Figur liegt,
/// verschwindet hinter ihr. Die Art wählt die App aus dem Traum.
enum SketchParticles {
  enum Kind: String { case dust, snow, fireflies, embers, bubbles, none }

  struct Particle {
    var x: Double, y: Double   // 0…1 der Bildfläche, y von unten
    var z: Double              // 0 = fern … 1 = nah
    var size: Double
    var phase: Double
    var speed: Double
  }

  /// Wo ein Teilchen in der Tiefe steht, entscheidet über Verdeckung:
  /// `surface(x, y)` liefert die Szenentiefe an einer Bildstelle (0…1) oder nil.
  typealias Surface = (_ x: Double, _ y: Double) -> Float?

  static func make(_ kind: Kind, seed: UInt64) -> [Particle] {
    guard kind != .none else { return [] }
    var rng = SplitMix(seed: seed ^ 0x9E37_79B9_7F4A_7C15)
    let count: Int = {
      switch kind {
      case .snow: return 110
      case .fireflies: return 34
      case .embers: return 60
      case .bubbles: return 40
      default: return 70
      }
    }()
    return (0..<count).map { _ in
      Particle(x: rng.next(), y: rng.next(), z: 0.15 + 0.85 * rng.next(),
               size: 0.6 + 0.8 * rng.next(), phase: rng.next() * .pi * 2, speed: 0.6 + 0.8 * rng.next())
    }
  }

  /// Eine Ebene in Leinwandgröße, transparent außer den Teilchen.
  /// `shift(z)` = Parallaxe-Versatz in Punkten für eine Tiefe (aus der Kamera).
  static func layer(_ ps: [Particle], kind: Kind, time t: Double, width: Int, height: Int,
                    shift: (Double) -> CGPoint, surface: Surface) -> CIImage? {
    guard !ps.isEmpty, let ctx = CGContext(
      data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4,
      space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
    let (r, g, b) = color(kind)
    let space = CGColorSpace(name: CGColorSpace.sRGB)!
    guard let glow = CGGradient(colorsSpace: space, colors: [
      CGColor(srgbRed: r, green: g, blue: b, alpha: 1),
      CGColor(srgbRed: r, green: g, blue: b, alpha: 0.35),
      CGColor(srgbRed: r, green: g, blue: b, alpha: 0),
    ] as CFArray, locations: [0, 0.35, 1]) else { return nil }
    let W = Double(width), H = Double(height)

    for p in ps {
      // Bahn je Art — alles periodisch, damit nichts aus dem Bild läuft.
      var x = p.x, y = p.y
      var alpha = 0.55
      switch kind {
      case .snow:
        y = wrap(p.y - t * 0.045 * p.speed * (0.5 + p.z))
        x = wrap(p.x + 0.015 * sin(t * 0.9 * p.speed + p.phase))
        alpha = 0.75
      case .embers:
        y = wrap(p.y + t * 0.05 * p.speed * (0.5 + p.z))
        x = wrap(p.x + 0.02 * sin(t * 1.7 * p.speed + p.phase))
        alpha = 0.55 + 0.45 * sin(t * 7 * p.speed + p.phase)
      case .bubbles:
        y = wrap(p.y + t * 0.035 * p.speed)
        x = wrap(p.x + 0.012 * sin(t * 2.1 + p.phase))
        alpha = 0.45
      case .fireflies:
        x = wrap(p.x + 0.05 * sin(t * 0.35 * p.speed + p.phase))
        y = wrap(p.y + 0.04 * sin(t * 0.27 * p.speed + p.phase * 1.7))
        alpha = max(0, sin(t * 1.4 * p.speed + p.phase)) * 0.95
      default: // dust: langsames Schweben, leises Funkeln
        x = wrap(p.x + t * 0.006 * p.speed + 0.01 * sin(t * 0.5 + p.phase))
        y = wrap(p.y + t * 0.004 * p.speed + 0.012 * sin(t * 0.4 + p.phase))
        alpha = 0.35 + 0.25 * sin(t * 1.3 * p.speed + p.phase)
      }
      let s = shift(p.z)
      let px = x * W + Double(s.x), py = y * H + Double(s.y)
      guard px > -40, px < W + 40, py > -40, py < H + 40 else { continue }
      // Verdeckt: Die Szene ist an dieser Stelle näher als das Teilchen.
      if let d = surface(px / W, py / H), Double(d) > p.z + 0.06 { continue }

      // Nahes groß und weich (Bokeh), Fernes klein und klar.
      let near = max(0, p.z - 0.8) / 0.2
      let radius = W * 0.0045 * p.size * (0.5 + 1.6 * p.z) * (1 + 1.0 * near) * (kind == .fireflies ? 1.4 : 1)
      ctx.setAlpha(CGFloat(max(0, min(1, alpha * (1 - 0.7 * near)))))
      let c = CGPoint(x: px, y: py)
      ctx.drawRadialGradient(glow, startCenter: c, startRadius: 0, endCenter: c, endRadius: CGFloat(radius), options: [])
    }
    guard let img = ctx.makeImage() else { return nil }
    return CIImage(cgImage: img)
  }

  private static func color(_ k: Kind) -> (CGFloat, CGFloat, CGFloat) {
    switch k {
    case .snow: return (0.95, 0.97, 1.0)
    case .fireflies: return (0.85, 1.0, 0.55)
    case .embers: return (1.0, 0.55, 0.22)
    case .bubbles: return (0.75, 0.9, 1.0)
    default: return (1.0, 0.9, 0.72)
    }
  }

  private static func wrap(_ v: Double) -> Double { v - floor(v) }
}

/// Kleiner, fester Zufall — derselbe Traum bekommt dieselben Teilchen.
struct SplitMix {
  var state: UInt64
  init(seed: UInt64) { state = seed }
  mutating func next() -> Double {
    state &+= 0x9E37_79B9_7F4A_7C15
    var z = state
    z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
    z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
    z = z ^ (z >> 31)
    return Double(z >> 11) / Double(1 << 53)
  }
}
