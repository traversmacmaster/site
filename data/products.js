// Catalog source; launch descriptions are maintained in ../launch-content.json.
export const products = [
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
    ]
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
    "appUrl": "apps/tunnelfield/"
  },
  {
    "name": "TimeField",
    "slug": "timefield",
    "disciplines": [
      "audio"
    ],
    "category": "Temporal instrument",
    "shortDescription": "Six heads. Six seconds. Play the immediate past.",
    "longDescription": "TimeField continuously captures the previous six seconds of incoming audio and turns that recent history into a playable six-head temporal instrument.",
    "image": "assets/products/timefield/ui-2026.png",
    "heroImage": "assets/products/timefield/ui-2026.png",
    "platform": "Windows",
    "standalone": true,
    "vst3": true,
    "pricingType": "PREMIUM",
    "publicPrice": null,
    "membershipAvailability": true,
    "status": "BETA",
    "purchaseUrl": "#purchase-coming-soon",
    "githubUrl": "https://github.com/",
    "patreonUrl": "https://www.patreon.com/",
    "featured": true,
    "headline": "SEQUENCE THE PAST.",
    "homePreview": true,
    "exhibitNotes": "REALTIME RECORDING / SIX HEADS / TEMPORAL PLAYBACK",
    "toolsUsedIn": [],
    "features": [
      "Six temporal heads",
      "Six-second rolling field",
      "Freeze + six Record Fields",
      "6×16 trigger sequencer",
      "Stretch, Reverse + Drift",
      "Guarded feedback",
      "MIDI performance",
      "Standalone + VST3"
    ]
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
    "image": "assets/products/avm/ui-2026-trim.png",
    "heroImage": "assets/products/avm/ui-2026-trim.png",
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
    ]
  },
  {
    "name": "HEXIT:B",
    "slug": "hexd",
    "disciplines": [
      "audio"
    ],
    "category": "Sample Based Drum Machine",
    "shortDescription": "A compact six-voice sample based drum machine.",
    "longDescription": "A focused sample based drum machine built for direct performance.",
    "image": "assets/products/hexd/ui-2026.png",
    "heroImage": "assets/products/hexd/ui-2026.png",
    "platform": "Windows",
    "standalone": true,
    "vst3": true,
    "pricingType": "FREE",
    "publicPrice": null,
    "membershipAvailability": false,
    "status": "ACTIVE",
    "purchaseUrl": "#",
    "githubUrl": "https://github.com/",
    "patreonUrl": "https://www.patreon.com/",
    "featured": true,
    "homePreview": true,
    "exhibitNotes": "SIX VOICES / SAMPLE PLAYBACK / DIRECT PERFORMANCE",
    "toolsUsedIn": [],
    "headline": "SAMPLE BASED. PERFORMANCE READY.",
    "features": []
  },
  {
    "name": "HEXIT:A",
    "slug": "and",
    "disciplines": [
      "audio"
    ],
    "category": "Analog Drum Machine",
    "shortDescription": "A six-voice analog drum machine.",
    "longDescription": "A native six-voice analog drum machine built for direct performance.",
    "image": "assets/products/and/ui-2026.png",
    "heroImage": "assets/products/and/ui-2026.png",
    "platform": "Windows",
    "standalone": true,
    "vst3": true,
    "pricingType": "MEMBER",
    "publicPrice": null,
    "membershipAvailability": true,
    "status": "COMING SOON",
    "purchaseUrl": "#",
    "githubUrl": "https://github.com/",
    "patreonUrl": "https://www.patreon.com/",
    "featured": true,
    "homePreview": false,
    "exhibitNotes": "SIX VOICES / ANALOG SYNTHESIS / DIRECT PERFORMANCE",
    "toolsUsedIn": [],
    "headline": "ANALOG. NERVE. DRUM.",
    "features": []
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
    "features": []
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
    "platform": "Windows",
    "standalone": true,
    "vst3": false,
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
    "features": []
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
    ]
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
    ]
  },
  {
    "slug": "harmano",
    "name": "Harmano",
    "category": "Digital harmonograph",
    "platform": "Windows + Web",
    "appUrl": "apps/harmano/",
    "disciplines": [
      "visual"
    ],
    "standalone": true,
    "vst3": false,
    "status": "BROWSER PREVIEW",
    "image": "assets/products/harmano/interface.png",
    "heroImage": "assets/products/harmano/interface.png",
    "homePreview": true,
    "features": [
      "Choose a frequency relationship or adjust the oscillators directly.",
      "Run the drawing and change phase, damping and pen settings to shape the curve.",
      "Commit drawings to layers, choose the canvas size and export the composition as SVG or PNG."
    ],
    "longDescription": "Harmano is an animated harmonograph art generator for creating pendulum-inspired mathematical drawings, evolving line patterns and geometric generative art.",
    "shortDescription": "Harmano is an animated harmonograph art generator for creating pendulum-inspired mathematical drawings, evolving line patterns and geometric generative art.",
    "headline": "harmonograph generator",
    "exhibitNotes": "DIGITAL HARMONOGRAPH",
    "examples": [
      {
        "src": "assets/products/harmano/output-example.png",
        "alt": "Artwork output from Harmano",
        "caption": "Exported artwork study"
      }
    ]
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
    ]
  },
  {
    "slug": "moshpaint",
    "name": "MoshPaint",
    "category": "Glitch painting instrument",
    "platform": "Windows",
    "appUrl": "",
    "disciplines": [
      "visual"
    ],
    "standalone": true,
    "vst3": false,
    "status": "ALPHA · WINDOWS",
    "image": "assets/products/moshpaint/interface.png",
    "heroImage": "assets/products/moshpaint/interface.png",
    "homePreview": true,
    "features": [
      "Open the Windows preview and import an image or video into a pigment well.",
      "Paint with image brushes, create living video regions and use mosh or damage tools to reshape the artwork.",
      "Save the project or export a still. Motion export uses FFmpeg installed on the computer. A browser edition is not yet available."
    ],
    "longDescription": "MoshPaint is a Windows glitch art editor and experimental painting tool for painting, distorting, transforming and animating images and video through unconventional digital processes.",
    "shortDescription": "MoshPaint is a Windows glitch art editor and experimental painting tool for painting, distorting, transforming and animating images and video through unconventional digital processes.",
    "headline": "glitch art editor",
    "exhibitNotes": "GLITCH PAINTING INSTRUMENT",
    "examples": [
      {
        "src": "assets/products/moshpaint/output-example.png",
        "alt": "Artwork output from MoshPaint",
        "caption": "Exported artwork study"
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
    ]
  }
];
export const getProduct = slug => products.find(p=>p.slug===slug);
