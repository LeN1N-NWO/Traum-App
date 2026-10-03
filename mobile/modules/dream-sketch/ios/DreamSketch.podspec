Pod::Spec.new do |s|
  s.name           = 'DreamSketch'
  s.version        = '1.0.0'
  s.summary        = 'Traum-Skizze: Keyframes und Kamerafahrt komplett auf dem iPhone'
  s.description    = 'Stable Diffusion 1.5 (Core ML, Apple ml-stable-diffusion) plus Video-Montage mit Core Image und AVFoundation.'
  s.author         = 'Dream Rushes'
  s.homepage       = 'https://github.com/LeN1N-NWO/Traum-App'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift 5 statt Swift 6: Apples Bibliothek ist nicht für strikte
  # Nebenläufigkeitsprüfung geschrieben (vgl. expo-modules-core-Patch im STAND).
  s.swift_version  = '5.9'
  s.frameworks     = 'CoreML', 'Accelerate', 'NaturalLanguage', 'AVFoundation', 'CoreImage'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,swift}'
end
