// Catalog source; launch descriptions are maintained in ../launch-content.json.
export const products = [
  {
    "name": "Video Mosaic",
    "slug": "video-mosaic",
    "category": "Moving video mosaic maker",
    "disciplines": [
      "visual"
    ],
    "appUrl": "apps/video-mosaic/",
    "shortDescription": "Video Mosaic is a video mosaic maker that turns a photograph into a larger moving composition built from individually animated video clips and tiles.",
    "longDescription": "Video Mosaic is experimental video art software for creating a larger visual composition from individually moving video clips, arranged as animated tiles inside a painted region of a photograph.",
    "image": "assets/products/video-mosaic/interface.png",
    "heroImage": "assets/products/video-mosaic/interface.png",
    "platform": "Windows + Web",
    "standalone": true,
    "vst3": false,
    "status": "BROWSER PREVIEW",
    "homePreview": false,
    "headline": "video mosaic maker",
    "exhibitNotes": "MOVING VIDEO TILES / PAINTED MASK / ANIMATED MOSAIC",
    "toolsUsedIn": [],
    "features": [
      "Paint the part of a photograph that becomes a moving mosaic",
      "Build the mosaic from multiple imported video clips",
      "Match video tiles by target color and luminance",
      "Control tile size, loop length, seed and animated tile-size sweeps",
      "Save projects and export PNG frames, MP4 or WebM recordings",
      "Process imported media locally in the browser"
    ],
    "examples": [],
    "videos": [
      {
        "src": "assets/products/video-mosaic/Somebody_12-15.webm",
        "poster": "assets/products/video-mosaic/somebody-poster.png",
        "label": "Somebody — video mosaic"
      },
      {
        "src": "assets/products/video-mosaic/eye_square.webm",
        "poster": "assets/products/video-mosaic/eye-poster.png",
        "label": "Eye — video mosaic"
      }
    ],
    "softwareGroup": "generative-visual-system"
  },
  {
    "name": "MoiréField",
    "slug": "moirefield",
    "category": "Optical interference drawing instrument",
    "disciplines": [
      "visual"
    ],
    "appUrl": "apps/moirefield/",
    "shortDescription": "MoiréField is an interactive animated moiré pattern generator for creating optical interference, layered geometric patterns and evolving moiré effects directly in the browser.",
    "longDescription": "MoiréField is an interactive animated moiré pattern generator for creating optical interference, layered geometric patterns and evolving moiré effects directly in the browser.",
    "image": "assets/products/moirefield/2026-10-21/interface.png",
    "heroImage": "assets/products/moirefield/2026-10-21/interface.png",
    "platform": "Windows + Web",
    "standalone": true,
    "vst3": false,
    "status": "STUDIO INSTRUMENT",
    "homePreview": true,
    "headline": "moiré pattern generator",
    "exhibitNotes": "LAYERS / OPTICAL INTERFERENCE / LIVE DRAWING",
    "toolsUsedIn": [],
    "features": [
      "Independent mathematical pattern layers",
      "Direct position, rotation, and scale controls",
      "Relationship presets and reproducible mutation",
      "Lab layer warps with on-canvas handles",
      "Save and restore projects in the browser or Windows app",
      "Portrait 9:16 and high-resolution still export",
      "Three independent Auto Movement controls",
      "Live canvas and window recording · browser WebM; Windows WebM / MP4",
      "Five processing engines with selectable modes and live output smoothing",
      "Image/video input and masked output processing"
    ],
    "video": {
      "src": "assets/products/moirefield/live-example.webm",
      "poster": "assets/products/moirefield/video-poster.png",
      "label": "MoiréField — live canvas recording"
    },
    "examples": [
      {
        "src": "assets/products/moirefield/output-example.png",
        "alt": "Artwork output from MoiréField",
        "caption": "Exported artwork study"
      }
    ],
    "softwareGroup": "generative-visual-system",
    "listingDescription": "Layer mathematical patterns, import images or video, and apply five processing engines.",
    "iconGlyph": "≋"
  },
  {
    "name": "TunnelField",
    "slug": "tunnelfield",
    "category": "Generative visual instrument",
    "disciplines": [
      "visual"
    ],
    "shortDescription": "TunnelField is an animated tunnel generator for creating evolving geometric tunnels, optical depth effects, psychedelic motion and experimental generative visuals.",
    "longDescription": "TunnelField is an animated tunnel generator for creating evolving geometric tunnels, optical depth effects, psychedelic motion and experimental generative visuals.",
    "image": "assets/products/tunnelfield/interface.png",
    "heroImage": "assets/products/tunnelfield/interface.png",
    "platform": "Windows + Web",
    "standalone": true,
    "vst3": false,
    "status": "STUDIO INSTRUMENT",
    "homePreview": true,
    "headline": "psychedelic tunnel generator",
    "exhibitNotes": "GEOMETRY / DEPTH / MOTION",
    "toolsUsedIn": [],
    "features": [
      "Source, depth, path, distortion, and color controls",
      "Randomize and mutate the field",
      "Save and restore instrument state",
      "High-resolution still export",
      "Live canvas and window recording"
    ],
    "examples": [
      {
        "src": "assets/products/tunnelfield/line-study.png",
        "alt": "Red and black interwoven tunnel contours on white",
        "caption": "Line / Depth"
      },
      {
        "src": "assets/products/tunnelfield/violet-study.png",
        "alt": "Layered violet shapes receding into a dark tunnel",
        "caption": "Color / Descent"
      },
      {
        "src": "assets/products/tunnelfield/dark-study.png",
        "alt": "Cyan and orange wireframe tunnel on black",
        "caption": "Contour / Motion"
      }
    ],
    "video": {
      "src": "assets/products/tunnelfield/live-example.webm",
      "poster": "assets/products/tunnelfield/interface.png",
      "label": "TunnelField — recorded live window demonstration"
    },
    "appUrl": "apps/tunnelfield/",
    "softwareGroup": "generative-visual-system"
  },
  {
    "name": "TimeField",
    "slug": "timefield",
    "disciplines": [
      "audio"
    ],
    "category": "Temporal instrument",
    "shortDescription": "Record a four-bar field. Reshape it with six playback heads.",
    "longDescription": "TimeField records incoming audio into a four-bar field and reshapes it through six playback heads, a field loop and effects. The PLAY, MODULATION and MIX / FX workspaces organize recording, sequencing, modulation and mixing.",
    "image": "assets/products/timefield/2026-10-12/play.png",
    "heroImage": "assets/products/timefield/2026-10-12/play.png",
    "platform": "Windows · VST3",
    "standalone": false,
    "vst3": true,
    "pricingType": "PREMIUM",
    "publicPrice": null,
    "membershipAvailability": true,
    "status": "0.15.1 · BETA",
    "purchaseUrl": "#purchase-coming-soon",
    "githubUrl": "https://github.com/",
    "patreonUrl": "https://www.patreon.com/",
    "featured": true,
    "headline": "SEQUENCE THE PAST.",
    "homePreview": true,
    "exhibitNotes": "REALTIME RECORDING / SIX HEADS / TEMPORAL PLAYBACK",
    "toolsUsedIn": [],
    "features": [
      "Six heads with Repeat, Ping-pong, Scan and Hold playback",
      "A and B recordings with equal-power blending",
      "Manual recording or bar-aligned takes of 1, 2 or 4 bars",
      "Sequences of 1, 2 or 4 bars at 1/16 or 1/32 resolution",
      "Two LFOs per head across all six heads",
      "Per-head Stutter and Head FX",
      "Master saturation, bitcrush, delay and reverb",
      "Four Scenes with Immediate, Beat or Bar recall",
      "Windows x64 VST3 audio effect; MIDI optional"
    ],
    "whatsNew": "TimeField 0.15.1 introduces PLAY, MODULATION and MIX / FX workspaces, retaining six playback heads and twelve LFOs, with optimized audio processing.",
    "version": "0.15.1",
    "screenshots": [
      {
        "src": "assets/products/timefield/2026-10-12/play.png",
        "caption": "PLAY",
        "alt": "TimeField PLAY workspace"
      },
      {
        "src": "assets/products/timefield/2026-10-12/play-details.png",
        "caption": "PLAY / Details",
        "alt": "TimeField PLAY / Details workspace"
      },
      {
        "src": "assets/products/timefield/2026-10-12/modulation.png",
        "caption": "MODULATION",
        "alt": "TimeField MODULATION workspace"
      },
      {
        "src": "assets/products/timefield/2026-10-12/mix-fx.png",
        "caption": "MIX / FX",
        "alt": "TimeField MIX / FX workspace"
      }
    ],
    "listingDescription": "Record a four-bar audio field and reshape it with six playback heads.",
    "vst": true,
    "softwareGroup": "audio-plugin",
    "downloadVersion": "1.0",
    "downloadUrl": "uploads/vst/TimeField-1.0-Windows-x64-VST3.zip"
  },
  {
    "name": "STRETCH",
    "slug": "stretch",
    "disciplines": [
      "audio"
    ],
    "category": "Live time bender",
    "shortDescription": "Bend live audio with stretch, pitch, freeze and reverse controls.",
    "longDescription": "STRETCH is a live time-bending audio instrument with stretch, pitch, window, feedback, mix and output controls. Tempo lock, freeze, reverse and an LFO section shape its temporal playback.",
    "image": "assets/products/stretch/2026-10-11/main.png",
    "heroImage": "assets/products/stretch/2026-10-11/main.png",
    "platform": "Windows · VST3",
    "status": "IN DEVELOPMENT",
    "homePreview": false,
    "headline": "LIVE TIME BENDER.",
    "exhibitNotes": "STRETCH / PITCH / FREEZE / REVERSE",
    "toolsUsedIn": [],
    "features": [
      "Stretch, pitch and window controls",
      "Feedback, mix and output controls",
      "Tempo lock, freeze, hold freeze and reverse",
      "Freeze length and feedback tone controls",
      "Two LFOs with target, waveform, sync, speed and depth controls",
      "Envelope modulation with attack, hold, release, sensitivity and amount"
    ],
    "whatsNew": "Updated STRETCH screenshots show the main controls, LFO modulation and envelope modulation views.",
    "screenshots": [
      {
        "src": "assets/products/stretch/2026-10-11/main.png",
        "caption": "Main controls",
        "alt": "STRETCH Main controls interface"
      },
      {
        "src": "assets/products/stretch/2026-10-11/lfo.png",
        "caption": "LFO modulation",
        "alt": "STRETCH LFO modulation interface"
      },
      {
        "src": "assets/products/stretch/2026-10-11/envelope.png",
        "caption": "Envelope modulation",
        "alt": "STRETCH Envelope modulation interface"
      }
    ],
    "listingDescription": "Bend live audio with stretch, pitch, freeze, reverse and modulation.",
    "vst": true,
    "vst3": true,
    "softwareGroup": "audio-plugin",
    "downloadVersion": "1.0",
    "downloadUrl": "uploads/vst/Stretch-1.0-Windows-x64-VST3.zip"
  },
  {
    "name": "Grain Alchemy",
    "slug": "grain-alchemy",
    "version": "1.1.0",
    "disciplines": [
      "audio"
    ],
    "category": "Interactive synthesis instrument",
    "shortDescription": "Shape a visual matter field with energy, resonance and gravity controls.",
    "longDescription": "Grain Alchemy is an interactive audio instrument with a visual matter field, a playable keyboard, synthesis controls and master delay and reverb. Shape the field with Matter, Energy, Resonance, Gravity and brush controls.",
    "image": "assets/products/grain-alchemy/2026-10-11/main.png",
    "heroImage": "assets/products/grain-alchemy/2026-10-11/main.png",
    "platform": "Windows · VST",
    "status": "IN DEVELOPMENT",
    "homePreview": true,
    "features": [
      "Visual matter field and playable keyboard",
      "Matter, Energy, Resonance and Gravity controls",
      "Brush size, brush energy and excitation controls",
      "Amplitude envelope and filter controls",
      "Tempo-synced delay and reverb controls",
      "Alchemize, undo, redo and reset"
    ],
    "screenshots": [
      {
        "src": "assets/products/grain-alchemy/2026-10-11/main.png",
        "caption": "Matter + keyboard",
        "alt": "Grain Alchemy Matter + keyboard interface"
      },
      {
        "src": "assets/products/grain-alchemy/2026-10-11/master-fx.png",
        "caption": "Master FX",
        "alt": "Grain Alchemy Master FX interface"
      },
      {
        "src": "assets/products/grain-alchemy/2026-10-11/synth.png",
        "caption": "Synth controls",
        "alt": "Grain Alchemy Synth controls interface"
      }
    ],
    "whatsNew": "Grain Alchemy brings together a visual matter field, playable keyboard, synth controls and master effects.",
    "listingDescription": "A visual matter field, playable keyboard and synth controls.",
    "vst": true,
    "softwareGroup": "audio-plugin"
  },
  {
    "name": "AuViMosh",
    "slug": "avm",
    "disciplines": [
      "visual"
    ],
    "category": "Audio / video mosh instrument",
    "shortDescription": "AuViMosh is a browser-based datamosh and glitch editor for transforming video and still images through motion transfer, compression artifacts, visual analysis and experimental image processing.",
    "longDescription": "AuViMosh is a browser-based datamosh and glitch editor for transforming video and still images through motion transfer, compression artifacts, visual analysis and experimental image processing.",
    "image": "assets/products/avm/2026-10-11/source-inputs.png",
    "heroImage": "assets/products/avm/2026-10-11/source-inputs.png",
    "platform": "Web + Windows",
    "standalone": true,
    "vst3": false,
    "pricingType": "PREMIUM",
    "publicPrice": null,
    "membershipAvailability": true,
    "status": "1.0 · WEB LIVE",
    "purchaseUrl": "#purchase-coming-soon",
    "appUrl": "apps/auvimosh/",
    "githubUrl": "https://github.com/",
    "patreonUrl": "https://www.patreon.com/",
    "featured": true,
    "headline": "datamosh editor",
    "homePreview": true,
    "exhibitNotes": "DATAMOSH / AUDIO MOSH / VIDEO PROCESSING",
    "toolsUsedIn": [],
    "features": [
      "A / B / C video or still-image sources",
      "Extra motion-source pool",
      "Weighted roulette + temporal shuttle",
      "Motion echo + freeze/release",
      "Motion transfer + inject",
      "Drawable mosh region",
      "Realtime preview",
      "Audio Mosh",
      "Source bleed + grain processing",
      "Spectral swap + feedback",
      "Video export"
    ],
    "examples": [
      {
        "src": "assets/products/avm/output-example.png",
        "alt": "Artwork output from AuViMosh",
        "caption": "Datamoshed video — frame study"
      }
    ],
    "screenshots": [
      {
        "src": "assets/products/avm/2026-10-11/source-inputs.png",
        "caption": "Source inputs / Base, motion and inject",
        "alt": "AuViMosh desktop interface showing base image and motion source inputs"
      },
      {
        "src": "assets/products/avm/2026-10-11/preview-controls.png",
        "caption": "Mosh preview / Audio, masking and output controls",
        "alt": "AuViMosh desktop mosh preview with audio, masking and output controls"
      }
    ],
    "listingDescription": "Transfer motion between sources and shape image damage with audio/video controls.",
    "softwareGroup": "visual-media-tool",
    "videos": [
      {
        "src": "assets/products/avm/pedestrian.webm",
        "poster": "assets/products/avm/pedestrian-poster.png",
        "label": "Pedestrian — AuViMosh example"
      },
      {
        "src": "assets/products/avm/jellyglitch.webm",
        "poster": "assets/products/avm/jellyglitch-poster.png",
        "label": "Jellyglitch — AuViMosh example"
      }
    ]
  },
  {
    "name": "HEXIT",
    "slug": "hexit",
    "version": "0.1.0",
    "disciplines": [
      "audio"
    ],
    "category": "Sample switching rhythm instrument",
    "shortDescription": "Six sample voices with sample switching and FX sequencing.",
    "longDescription": "HEXIT is a six-voice sample instrument with sample switching, per-voice sample and effect sequences, a shared six-slot FX bank, and master effects with LFO modulation.",
    "image": "assets/products/hexit/voices.png",
    "heroImage": "assets/products/hexit/voices.png",
    "platform": "Windows · VST",
    "status": "IN DEVELOPMENT",
    "homePreview": true,
    "headline": "SAMPLE / SWITCH / SEQUENCE",
    "features": [
      "Six sample voices: Kick, Hihat, Snare, Hand, Mallet and Metallic",
      "Per-voice sample selection, pitch, envelopes, filter, pan and sample boundaries",
      "Independent sample and FX slot sequences",
      "Six shared FX slots with per-hit settings",
      "Compressor, bitcrusher, wavefolder, ring modulation, filter, comb filter and delay views",
      "Two master effects with independent LFO controls",
      "Preset and FX bank save/load controls"
    ],
    "whatsNew": "The current HEXIT interface brings together six sample voices, sample and FX sequencing, a shared FX bank, and master effects.",
    "screenshots": [
      {
        "src": "assets/products/hexit/voices.png",
        "caption": "Voices + sample sequence",
        "alt": "HEXIT Voices + sample sequence interface"
      },
      {
        "src": "assets/products/hexit/fx-sequence.png",
        "caption": "FX sequence",
        "alt": "HEXIT FX sequence interface"
      },
      {
        "src": "assets/products/hexit/fx-bank.png",
        "caption": "Shared FX bank",
        "alt": "HEXIT Shared FX bank interface"
      },
      {
        "src": "assets/products/hexit/master.png",
        "caption": "Master FX + LFO",
        "alt": "HEXIT Master FX + LFO interface"
      },
      {
        "src": "assets/products/hexit/compressor.png",
        "caption": "Compressor",
        "alt": "HEXIT Compressor interface"
      }
    ],
    "listingDescription": "Six sample voices with sample switching and FX sequencing.",
    "vst": true,
    "softwareGroup": "audio-plugin"
  },
  {
    "name": "StreamArch",
    "slug": "streamarch",
    "disciplines": [
      "visual",
      "archive"
    ],
    "category": "Archive film web app",
    "shortDescription": "A streaming interface for video from the Internet Archive.",
    "longDescription": "StreamArch is a web app for browsing and streaming video from archive.org, the Internet Archive.",
    "image": "assets/products/reelvault/card.png",
    "heroImage": "assets/products/reelvault/card.png",
    "platform": "Web",
    "standalone": true,
    "vst3": false,
    "pricingType": "FREE",
    "publicPrice": null,
    "membershipAvailability": false,
    "status": "LIVE",
    "purchaseUrl": "apps/streamarch/",
    "githubUrl": "https://github.com/",
    "patreonUrl": "https://www.patreon.com/",
    "featured": true,
    "appUrl": "apps/streamarch/",
    "headline": "Internet Archive video streaming",
    "homePreview": false,
    "exhibitNotes": "ARCHIVE SEARCH / WATCH / COLLECT",
    "toolsUsedIn": [],
    "features": [],
    "collection": "other",
    "softwareGroup": "web-application",
    "listingDescription": "A streaming interface for video from the Internet Archive."
  },
  {
    "name": "DrawTable",
    "slug": "drawtable",
    "disciplines": [
      "audio"
    ],
    "category": "Drawable wavetable synthesizer",
    "shortDescription": "You draw the oscillator.",
    "longDescription": "A hands-on wavetable instrument for drawing frames, shaping motion and generating morphs.",
    "image": "assets/products/drawtable/card.png",
    "heroImage": "assets/products/drawtable/hero.png",
    "platform": "Windows · VST",
    "standalone": true,
    "pricingType": "FREE",
    "publicPrice": null,
    "membershipAvailability": false,
    "status": "IN DEVELOPMENT",
    "purchaseUrl": "#",
    "githubUrl": "https://github.com/",
    "patreonUrl": "https://www.patreon.com/",
    "featured": true,
    "headline": "YOU DRAW THE OSCILLATOR.",
    "homePreview": false,
    "exhibitNotes": "DRAWN WAVETABLES / FRAME MORPHING / SOUND",
    "toolsUsedIn": [],
    "features": [],
    "vst": true,
    "softwareGroup": "audio-plugin"
  },
  {
    "slug": "kaleidofield",
    "name": "KaleidoField",
    "category": "Kaleidoscope image and video maker",
    "platform": "Windows + Web",
    "appUrl": "apps/kaleidofield/",
    "disciplines": [
      "visual"
    ],
    "standalone": true,
    "vst3": false,
    "status": "BROWSER PREVIEW",
    "image": "assets/products/kaleidofield/interface.png",
    "heroImage": "assets/products/kaleidofield/interface.png",
    "homePreview": true,
    "features": [
      "Import an image or video, or start with the generated light field.",
      "Adjust the mirror geometry and source position. Use Auto Movement to explore changing symmetry.",
      "Choose the output dimensions and save a PNG or record video. Seamless output-loop encoding is available in the Windows app."
    ],
    "longDescription": "KaleidoField is an interactive video and image kaleidoscope generator for transforming visual media into animated radial patterns, symmetry and experimental kaleidoscopic art.",
    "shortDescription": "KaleidoField is an interactive video and image kaleidoscope generator for transforming visual media into animated radial patterns, symmetry and experimental kaleidoscopic art.",
    "headline": "kaleidoscope generator",
    "exhibitNotes": "KALEIDOSCOPE IMAGE AND VIDEO MAKER",
    "examples": [
      {
        "src": "assets/products/kaleidofield/output-example.png",
        "alt": "Artwork output from KaleidoField",
        "caption": "Exported artwork study"
      }
    ],
    "videos": [
      {
        "src": "assets/products/kaleidofield/KaleidoField_8-13_square.webm",
        "poster": "assets/products/kaleidofield/kaleidofield-square-poster.png",
        "label": "KaleidoField — square motion study"
      },
      {
        "src": "assets/products/kaleidofield/output-landscape.webm",
        "poster": "assets/products/kaleidofield/output-landscape-poster.png",
        "label": "KaleidoField — landscape motion study"
      }
    ],
    "softwareGroup": "generative-visual-system"
  },
  {
    "slug": "guillochefield",
    "name": "Guilloché",
    "category": "Geometric engraving instrument",
    "platform": "Windows + Web",
    "appUrl": "apps/guillochefield/",
    "disciplines": [
      "visual"
    ],
    "standalone": true,
    "vst3": false,
    "status": "BROWSER PREVIEW",
    "image": "assets/products/guillochefield/interface.png",
    "heroImage": "assets/products/guillochefield/interface.png",
    "homePreview": true,
    "features": [
      "Choose a starting machine configuration and adjust the oscillators and rotation.",
      "Draw passes, change the pen style and layer the resulting geometric paths.",
      "Set the canvas dimensions, export PNG or SVG, or record the drawing in motion."
    ],
    "longDescription": "Guilloché is an interactive guilloché pattern generator for creating intricate mathematical curves, geometric line art and layered ornamental patterns in the browser.",
    "shortDescription": "Guilloché is an interactive guilloché pattern generator for creating intricate mathematical curves, geometric line art and layered ornamental patterns in the browser.",
    "headline": "guilloché pattern generator",
    "exhibitNotes": "GEOMETRIC ENGRAVING INSTRUMENT",
    "examples": [
      {
        "src": "assets/products/guillochefield/output-example.png",
        "alt": "Artwork output from Guilloché",
        "caption": "Exported artwork study"
      }
    ],
    "softwareGroup": "generative-visual-system"
  },
  {
    "slug": "interferencefield",
    "name": "Interference Field",
    "category": "Rotational interference instrument",
    "platform": "Windows + Web",
    "appUrl": "apps/interferencefield/",
    "disciplines": [
      "visual"
    ],
    "standalone": true,
    "vst3": false,
    "status": "BROWSER PREVIEW",
    "image": "assets/products/interferencefield/interface.png",
    "heroImage": "assets/products/interferencefield/interface.png",
    "homePreview": true,
    "features": [
      "Choose the field geometry and adjust its rotation and spacing.",
      "Explore motion and accumulation; use Auto Movement to vary controls over time.",
      "Set the canvas size, save a PNG or record the changing field as WebM in the browser."
    ],
    "longDescription": "Interference Field is an animated interference pattern generator for exploring overlapping waves, optical interference, geometric interactions and evolving generative patterns.",
    "shortDescription": "Interference Field is an animated interference pattern generator for exploring overlapping waves, optical interference, geometric interactions and evolving generative patterns.",
    "headline": "interference pattern generator",
    "exhibitNotes": "ROTATIONAL INTERFERENCE INSTRUMENT",
    "examples": [
      {
        "src": "assets/products/interferencefield/output-example.png",
        "alt": "Artwork output from Interference Field",
        "caption": "Exported artwork study"
      }
    ],
    "softwareGroup": "generative-visual-system"
  },
  {
    "slug": "moshpaint",
    "name": "OddPaint",
    "category": "Living Canvas painting instrument",
    "platform": "Windows + Web",
    "appUrl": "apps/moshpaint/",
    "disciplines": [
      "visual"
    ],
    "standalone": true,
    "vst3": false,
    "status": "ALPHA · WEB + WINDOWS",
    "image": "assets/products/moshpaint/oddpaint-brand.svg",
    "heroImage": "assets/products/moshpaint/oddpaint-brand.svg",
    "homePreview": true,
    "features": [
      "Import images, videos or camera clips into source wells; original media stays unchanged.",
      "Import images, videos or camera clips into source wells; source media stays unchanged.",
      "Paint with Image Brush and Living Brush, or create living video regions with mask and shape tools.",
      "Keep one Living Canvas active while painting and applying damage effects; bake when you want to make it permanent.",
      "Use shared color masks to select regions, clean mask edges and route supported canvas effects.",
      "Apply classic mosh and damage tools, temporal smears, living depth and form effects to the canvas.",
      "Export still images and complete videos from the browser or Windows application.",
      "The five modular processing engines are available in the separate Experimental Processing Studio, where they can be used without OddPaint."
    ],
    "longDescription": "OddPaint is a Living Canvas for painting images and video with Image Brush, Living Brush, masks and damage effects. Keep pigment alive while you work, then bake it to the canvas when ready. The five modular processing engines remain available in the separate Experimental Processing Studio.",
    "shortDescription": "Paint images and video on a Living Canvas with image and living brushes, masks, damage effects and full-video export.",
    "headline": "moving pigment. unusual possibilities.",
    "exhibitNotes": "LIVING CANVAS / MOVING PIGMENT / UNUSUAL POSSIBILITIES",
    "examples": [
      {
        "src": "assets/products/moshpaint/output-example.png",
        "alt": "Artwork output from OddPaint",
        "caption": "Exported artwork study"
      }
    ],
    "screenshots": [
      {
        "src": "assets/products/moshpaint/2026-10-11/portrait-interface.png",
        "caption": "OddPaint / Portrait canvas",
        "alt": "OddPaint interface showing a red and black portrait composition"
      },
      {
        "src": "assets/products/moshpaint/2026-10-11/landscape-interface.png",
        "caption": "OddPaint / Landscape canvas",
        "alt": "OddPaint interface showing a layered landscape glitch composition"
      }
    ],
    "listingDescription": "Paint images and video on a Living Canvas with image and living brushes, masks, damage effects and full-video export.",
    "softwareGroup": "visual-media-tool",
    "videos": [
      {
        "src": "assets/products/moshpaint/ginger.webm",
        "poster": "assets/products/moshpaint/ginger-poster.png",
        "label": "Ginger — OddPaint example"
      },
      {
        "src": "assets/products/moshpaint/circuit-memory.webm",
        "poster": "assets/products/moshpaint/circuit-memory-poster.png",
        "label": "Circuit Memory — OddPaint example"
      }
    ]
  },
  {
    "slug": "spirofield",
    "name": "SpiroField",
    "category": "Digital spirograph drawing instrument",
    "platform": "Windows + Web",
    "appUrl": "apps/spirofield/",
    "disciplines": [
      "visual"
    ],
    "standalone": true,
    "vst3": false,
    "status": "BROWSER PREVIEW",
    "image": "assets/products/spirofield/interface.png",
    "heroImage": "assets/products/spirofield/interface.png",
    "homePreview": true,
    "features": [
      "Choose a ring, rolling wheel, pen hole and inside or outside drawing mode.",
      "Press Draw to watch the mechanism, or complete the curve instantly; layer additional patterns and use Lab controls for mechanical variation.",
      "Set the canvas and export size, then save the composition as PNG or vector SVG."
    ],
    "longDescription": "SpiroField is an interactive digital spirograph for drawing layered hypotrochoid and epitrochoid curves with tactile ring, wheel and pen-hole controls.",
    "shortDescription": "SpiroField is an interactive digital spirograph for drawing layered hypotrochoid and epitrochoid curves with tactile ring, wheel and pen-hole controls.",
    "headline": "digital spirograph",
    "exhibitNotes": "DIGITAL SPIROGRAPH DRAWING INSTRUMENT",
    "examples": [
      {
        "src": "assets/products/spirofield/output-example.png",
        "alt": "Artwork output from SpiroField",
        "caption": "Exported artwork study"
      }
    ],
    "softwareGroup": "generative-visual-system"
  },
  {
    "name": "DCLASS",
    "slug": "dclass",
    "collection": "other",
    "category": "Document research system",
    "disciplines": [
      "research"
    ],
    "shortDescription": "Search public documents and government publications while keeping every record connected to its source.",
    "longDescription": "DCLASS combines public DocumentCloud documents and GovInfo publications in one research interface. Search live public records with source provenance and independent pagination.",
    "image": "assets/products/dclass/logo.png",
    "heroImage": "assets/products/dclass/logo.png",
    "platform": "Web",
    "status": "LIVE",
    "appUrl": "apps/dclass/",
    "homePreview": false,
    "features": [
      "DocumentCloud public search",
      "GovInfo publications",
      "Source provenance",
      "Independent pagination"
    ],
    "standalone": false,
    "vst3": false,
    "softwareGroup": "web-application"
  },
  {
    "name": "Recursive",
    "slug": "recursive-symbol-machine",
    "disciplines": [
      "visual"
    ],
    "category": "Recursive visual instrument",
    "shortDescription": "Build recursive symbol compositions with masks, video fills and 3D depth layers.",
    "longDescription": "Recursive is a standalone GPU visual instrument for building nested, radial, spiral, branching, tunnel, orbit, grid and cascading compositions from a symbol. Cut symbols or the whole composition with procedural masks, fill them with looping video, and separate generations into 3D depth layers with camera controls. Shape motion, color and feedback, then export a PNG or record the result.",
    "image": "assets/products/recursive-symbol-machine/2026-10-17/interface.png",
    "heroImage": "assets/products/recursive-symbol-machine/2026-10-17/interface.png",
    "platform": "Windows",
    "standalone": true,
    "vst3": false,
    "status": "STUDIO INSTRUMENT",
    "homePreview": true,
    "features": [
      "Load an image or choose from eight built-in symbols",
      "Eight recursive layouts with depth, copies and scale falloff controls",
      "Circle, box, wedge and stripe masks with feathering and inversion",
      "Apply masks to individual symbols or the whole composition; contain or leave feedback trails",
      "Loop video inside symbol silhouettes or mask apertures, per symbol or across the output",
      "3D depth layers with camera yaw, pitch, perspective and orbit",
      "Animation, modulation, color grading and feedback controls",
      "Save and load presets; relink local video clips when reopening",
      "PNG export and canvas or window recording; video fills play silently"
    ],
    "softwareGroup": "generative-visual-system",
    "examples": [
      {
        "src": "assets/products/recursive-symbol-machine/2026-10-17/iris-stack.png",
        "alt": "Tilted layers of eye symbols receding into depth",
        "caption": "Iris Stack — symbols arranged in depth layers"
      },
      {
        "src": "assets/products/recursive-symbol-machine/2026-10-17/portal-window.png",
        "alt": "Spiral symbols revealed through a circular composition mask",
        "caption": "Portal Window — a circular mask over the composition"
      },
      {
        "src": "assets/products/recursive-symbol-machine/2026-10-17/signal-slices.png",
        "alt": "Striped square outlines tilted and layered in space",
        "caption": "Signal Slices — striped symbol masks in depth layers"
      }
    ]
  },
  {
    "name": "3FIELD",
    "slug": "3field",
    "disciplines": [
      "visual"
    ],
    "category": "3D host for 2D visual systems",
    "shortDescription": "A 3D host for KaleidoField, MoiréField, SpiroField and Suminagashi.",
    "longDescription": "3FIELD is a 3D host for KaleidoField, MoiréField, SpiroField and Suminagashi. Layer these 2D visual systems on planes, cylinders and spheres, adjust transforms and movement, explore the scene with the camera, and export images or video.",
    "image": "assets/products/3field/interface.png",
    "heroImage": "assets/products/3field/interface.png",
    "platform": "Windows",
    "status": "IN DEVELOPMENT",
    "homePreview": true,
    "features": [
      "Plane, cylinder and sphere domains",
      "Layered fields and shared hosts",
      "Pattern position, rotation, scale, opacity and blending",
      "Layer motion and camera controls",
      "Record and replay manual movement takes",
      "Save and load projects",
      "PNG and video export"
    ],
    "softwareGroup": "visual-host",
    "listingDescription": "A 3D host for KaleidoField, MoiréField, SpiroField and Suminagashi."
  },
  {
    "name": "BASEMENT",
    "slug": "basement",
    "disciplines": [
      "audio"
    ],
    "category": "Four-layer bass synthesizer",
    "shortDescription": "Four bass oscillator layers with filtering, drive and disperser processing.",
    "longDescription": "BASEMENT is a MIDI-played bass synthesizer with four oscillator layers. Choose phase distortion, FM, resonator or subtractive synthesis, balance the layers in the mixer, and shape the result with master filtering, Parallel Drive and Disperser.",
    "image": "assets/products/basement/oscillators.png",
    "heroImage": "assets/products/basement/oscillators.png",
    "platform": "Windows x64 · VST3",
    "vst": true,
    "vst3": true,
    "standalone": true,
    "status": "AVAILABLE",
    "homePreview": false,
    "downloadVersion": "1.0",
    "downloadUrl": "uploads/vst/BASEMENT-1.0-Windows-x64-VST3.zip",
    "softwareGroup": "audio-plugin",
    "features": [
      "Four oscillator layers with selectable synthesis engines",
      "Keyboard layers, independent slots and legacy-pair modes",
      "Per-layer pitch, envelopes, level, mute and solo",
      "Bank LFOs and master LFO routing",
      "Master filter, Parallel Drive and Disperser"
    ],
    "screenshots": [
      {
        "src": "assets/products/basement/oscillators.png",
        "caption": "Oscillator layers",
        "alt": "BASEMENT oscillator and mixer controls"
      },
      {
        "src": "assets/products/basement/master-fx.png",
        "caption": "Master FX",
        "alt": "BASEMENT master filter, drive, disperser and modulation"
      }
    ]
  }
];
export const getProduct = slug => products.find(p=>p.slug===slug);
