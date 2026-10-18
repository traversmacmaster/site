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
    "image": "assets/products/moirefield/interface.png",
    "heroImage": "assets/products/moirefield/interface.png",
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
      "Live canvas and window recording · browser WebM; Windows WebM / MP4"
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
    "softwareGroup": "generative-visual-system"
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
    "downloadUrl": "downloads/#timefield"
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
    "downloadUrl": "downloads/#stretch"
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
      "audio",
      "visual"
    ],
    "category": "Audio / video mosh instrument",
    "shortDescription": "AuViMosh is a browser-based datamosh and glitch video editor for transforming video through motion, compression artifacts, visual analysis and experimental image processing.",
    "longDescription": "AuViMosh is a browser-based datamosh and glitch video editor for transforming video through motion, compression artifacts, visual analysis and experimental image processing.",
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
      "A / B / C video sources",
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
    "name": "BOTTOMFEEDER",
    "slug": "bottomfeeder",
    "disciplines": [
      "audio"
    ],
    "category": "Phase distortion wavefold drums",
    "shortDescription": "Eight drum voices. Phase distortion, wavefolding and master glitch effects.",
    "longDescription": "BOTTOMFEEDER is a phase-distortion and wavefold drum instrument with eight voices, synthesis controls, an effects and LFO rack, and a master glitch chain.",
    "image": "assets/products/bottomfeeder/synth.png",
    "heroImage": "assets/products/bottomfeeder/synth.png",
    "platform": "Windows · VST",
    "status": "IN DEVELOPMENT",
    "homePreview": true,
    "exhibitNotes": "PHASE DISTORTION / WAVEFOLD / DRUMS",
    "features": [
      "Eight individually editable drum voices",
      "Pitch, envelopes, phase distortion and wavefold controls",
      "Per-voice and master effects with LFO modulation",
      "Master Glitch Echo, Repeater and Tape Stop",
      "A PHASE and B FOLD modulation sequences",
      "Save, load and factory kit controls"
    ],
    "whatsNew": "Meet BOTTOMFEEDER: eight voices of phase-distortion and wavefold drums, with FX + LFO and MASTER GLITCH workspaces.",
    "screenshots": [
      {
        "src": "assets/products/bottomfeeder/synth.png",
        "caption": "SYNTH",
        "alt": "BOTTOMFEEDER SYNTH interface"
      },
      {
        "src": "assets/products/bottomfeeder/fx-lfo.png",
        "caption": "FX + LFO",
        "alt": "BOTTOMFEEDER FX + LFO interface"
      },
      {
        "src": "assets/products/bottomfeeder/voice-fx.png",
        "caption": "Voice editor + FX",
        "alt": "BOTTOMFEEDER Voice editor + FX interface"
      },
      {
        "src": "assets/products/bottomfeeder/master-glitch.png",
        "caption": "MASTER GLITCH",
        "alt": "BOTTOMFEEDER MASTER GLITCH interface"
      }
    ],
    "listingDescription": "Eight voices of phase-distortion and wavefold drums.",
    "vst": true,
    "softwareGroup": "audio-plugin"
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
      "archive"
    ],
    "category": "Archive film web app",
    "shortDescription": "Discover, watch and collect cinema history.",
    "longDescription": "A fully functional browser for films preserved by the Internet Archive.",
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
    "headline": "STREAM. PRESERVE. ARCHIVE.",
    "homePreview": false,
    "exhibitNotes": "ARCHIVE SEARCH / WATCH / COLLECT",
    "toolsUsedIn": [],
    "features": [],
    "collection": "other",
    "softwareGroup": "web-application"
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
    "name": "MoshPaint",
    "category": "Glitch painting instrument",
    "platform": "Windows + Web",
    "appUrl": "apps/moshpaint/",
    "disciplines": [
      "visual"
    ],
    "standalone": true,
    "vst3": false,
    "status": "ALPHA · WEB + WINDOWS",
    "image": "assets/products/moshpaint/2026-10-11/landscape-interface.png",
    "heroImage": "assets/products/moshpaint/2026-10-11/landscape-interface.png",
    "homePreview": true,
    "features": [
      "Import images, videos or camera clips into source wells; original media stays unchanged.",
      "Paint with living video brushes, fields and shapes, or place pigment on depth and form surfaces.",
      "Place the current 3D view on the flat canvas as a transparent snapshot, then drag or resize it.",
      "Select dry paint or living pigment with Color mask. Color Solidify consolidates similar shades for cleaner selections.",
      "Fill selected masks with video or integrated Moirefield patterns; create Moire pigment directly in source wells.",
      "Save editable projects and export PNG, JPG, WebP or WebM in the browser. Choose the source frame rate for smoother motion."
    ],
    "longDescription": "MoshPaint is a browser and Windows glitch painting tool for painting, distorting and animating images and video. Use moving pigment, color masks and Moirefield fills to build layered artwork.",
    "shortDescription": "Paint with images, moving video and camera clips. Clean color masks, add animated Moirefield fills and export stills or video.",
    "headline": "glitch art editor",
    "exhibitNotes": "GLITCH PAINTING INSTRUMENT",
    "examples": [
      {
        "src": "assets/products/moshpaint/output-example.png",
        "alt": "Artwork output from MoshPaint",
        "caption": "Exported artwork study"
      }
    ],
    "screenshots": [
      {
        "src": "assets/products/moshpaint/2026-10-11/portrait-interface.png",
        "caption": "MoshPaint / Portrait canvas",
        "alt": "MoshPaint interface showing a red and black portrait composition"
      },
      {
        "src": "assets/products/moshpaint/2026-10-11/landscape-interface.png",
        "caption": "MoshPaint / Landscape canvas",
        "alt": "MoshPaint interface showing a layered landscape glitch composition"
      }
    ],
    "listingDescription": "Paint images and moving video in your browser, with color masks and animated Moirefield fills.",
    "softwareGroup": "visual-media-tool",
    "videos": [
      {
        "src": "assets/products/moshpaint/ginger.webm",
        "poster": "assets/products/moshpaint/ginger-poster.png",
        "label": "Ginger — MoshPaint example"
      },
      {
        "src": "assets/products/moshpaint/circuit-memory.webm",
        "poster": "assets/products/moshpaint/circuit-memory-poster.png",
        "label": "Circuit Memory — MoshPaint example"
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
    "name": "Recursive Symbol Machine",
    "slug": "recursive-symbol-machine",
    "disciplines": [
      "visual"
    ],
    "category": "Recursive visual instrument",
    "shortDescription": "One symbol becomes a nested, radial, spiral or branching composition.",
    "longDescription": "Recursive Symbol Machine is a standalone GPU visual instrument that turns one symbol into nested, radial, spiral, branching, tunnel, orbit, grid or cascading compositions. Shape recursion, transforms, motion and color, then save a PNG or record the result.",
    "image": "assets/products/recursive-symbol-machine/interface.png",
    "heroImage": "assets/products/recursive-symbol-machine/interface.png",
    "platform": "Windows",
    "standalone": true,
    "vst3": false,
    "status": "STUDIO INSTRUMENT",
    "homePreview": true,
    "features": [
      "Load a symbol or use built-in shapes",
      "Nested, radial, spiral, branch, tunnel, orbit, grid and cascade structures",
      "Recursion depth, copies and scale falloff controls",
      "Direct position, scale, rotation and mirror controls",
      "Animation, modulation and color controls",
      "Save and load presets",
      "PNG export and canvas or window recording"
    ],
    "softwareGroup": "generative-visual-system"
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
  }
];
export const getProduct = slug => products.find(p=>p.slug===slug);
