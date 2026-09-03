export const products = [
  {
    name: "MoiréField", slug: "moirefield", category: "Optical interference drawing instrument", disciplines: ["visual"],
    shortDescription: "Layer patterns. Shift their relationship. Draw interference.",
    longDescription: "A real-time optical interference instrument. Arrange mathematical pattern layers, adjust their rotation and spacing, and explore the moiré structures that emerge. Classic controls and Lab warps turn small changes into complex moving fields.",
    image: "assets/products/moirefield/interface.png", heroImage: "assets/products/moirefield/interface.png",
    platform: "Windows + Web", standalone: true, vst3: false, status: "STUDIO INSTRUMENT", homePreview: true,
    headline: "PATTERN / RELATIONSHIP / INTERFERENCE", exhibitNotes: "LAYERS / OPTICAL INTERFERENCE / LIVE DRAWING", toolsUsedIn: [],
    features: ["Independent mathematical pattern layers", "Direct position, rotation, and scale controls", "Relationship presets and reproducible mutation", "Lab layer warps with on-canvas handles", "Save and restore projects", "High-resolution still export", "Live canvas and window recording"],
    video: {src: "assets/products/moirefield/live-example.webm", poster: "assets/products/moirefield/video-poster.png", label: "MoiréField — live canvas recording"}
  },
  {
    name: "TunnelField", slug: "tunnelfield", category: "Generative visual instrument", disciplines: ["visual"],
    shortDescription: "Reproject. Descend. Build depth from repeating geometry.",
    longDescription: "A visual instrument built from repeated mathematical cross-sections. Shape the source, depth, path, distortion, and color to create moving tunnels, intricate line fields, and still artwork.",
    image: "assets/products/tunnelfield/interface.png", heroImage: "assets/products/tunnelfield/interface.png",
    platform: "Windows + Web", standalone: true, vst3: false, status: "STUDIO INSTRUMENT", homePreview: true,
    headline: "REPROJECT / DESCEND", exhibitNotes: "GEOMETRY / DEPTH / MOTION", toolsUsedIn: [],
    features: ["Source, depth, path, distortion, and color controls", "Randomize and mutate the field", "Save and restore instrument state", "High-resolution still export", "Live canvas and window recording"],
    examples: [
      {src: "assets/products/tunnelfield/line-study.png", alt: "Red and black interwoven tunnel contours on white", caption: "Line / Depth"},
      {src: "assets/products/tunnelfield/violet-study.png", alt: "Layered violet shapes receding into a dark tunnel", caption: "Color / Descent"},
      {src: "assets/products/tunnelfield/dark-study.png", alt: "Cyan and orange wireframe tunnel on black", caption: "Contour / Motion"}
    ],
    video: {src: "assets/products/tunnelfield/live-example.webm", poster: "assets/products/tunnelfield/interface.png", label: "TunnelField — recorded live window demonstration"}
  },
  {
    name: "TimeField", slug: "timefield", disciplines: ["audio"], category: "Temporal instrument",
    shortDescription: "Six heads. Six seconds. Play the immediate past.",
    longDescription: "TimeField continuously captures the previous six seconds of incoming audio and turns that recent history into a playable six-head temporal instrument.",
    image: "assets/products/timefield/ui-2026.png", heroImage: "assets/products/timefield/ui-2026.png",
    platform: "Windows", standalone: true, vst3: true, pricingType: "PREMIUM", publicPrice: null, membershipAvailability: true, status: "BETA",
    purchaseUrl: "#purchase-coming-soon", githubUrl: "https://github.com/", patreonUrl: "https://www.patreon.com/", featured: true,
    headline: "SEQUENCE THE PAST.", homePreview: true, exhibitNotes: "REALTIME RECORDING / SIX HEADS / TEMPORAL PLAYBACK", toolsUsedIn: [],
    features: ["Six temporal heads", "Six-second rolling field", "Freeze + six Record Fields", "6×16 trigger sequencer", "Stretch, Reverse + Drift", "Guarded feedback", "MIDI performance", "Standalone + VST3"]
  },
  {
    name: "AuViMosh", slug: "avm", disciplines: ["audio", "visual"], category: "Audio / video mosh instrument",
    shortDescription: "Destroy motion. Infect sound.",
    longDescription: "An experimental audio/video mosh instrument for live image corruption, sound-driven motion and unstable feedback systems.",
    image: "assets/products/avm/ui-2026-trim.png", heroImage: "assets/products/avm/ui-2026-trim.png",
    platform: "Web + Windows", standalone: true, vst3: false, pricingType: "PREMIUM", publicPrice: null, membershipAvailability: true, status: "1.0 · WEB LIVE",
    purchaseUrl: "#purchase-coming-soon", appUrl: "apps/auvimosh/", githubUrl: "https://github.com/", patreonUrl: "https://www.patreon.com/", featured: true,
    headline: "DESTROY MOTION. INFECT SOUND.", homePreview: true, exhibitNotes: "DATAMOSH / AUDIO MOSH / VIDEO PROCESSING", toolsUsedIn: [],
    features: ["A / B / C video sources", "Motion transfer + inject", "Drawable mosh region", "Realtime preview", "Audio Mosh", "Source bleed + grain processing", "Spectral swap + feedback", "Video export"]
  },
  {
    name: "HEXIT:B", slug: "hexd", disciplines: ["audio"], category: "Sample Based Drum Machine", shortDescription: "A compact six-voice sample based drum machine.", longDescription: "A focused sample based drum machine built for direct performance.", image: "assets/products/hexd/ui-2026.png", heroImage: "assets/products/hexd/ui-2026.png", platform: "Windows", standalone: true, vst3: true, pricingType: "FREE", publicPrice: null, membershipAvailability: false, status: "ACTIVE", purchaseUrl: "#", githubUrl: "https://github.com/", patreonUrl: "https://www.patreon.com/", featured: true, homePreview: true, exhibitNotes: "SIX VOICES / SAMPLE PLAYBACK / DIRECT PERFORMANCE", toolsUsedIn: [], headline: "SAMPLE BASED. PERFORMANCE READY.", features: []
  },
  {
    name: "HEXIT:A", slug: "and", disciplines: ["audio"], category: "Analog Drum Machine", shortDescription: "A six-voice analog drum machine.", longDescription: "A native six-voice analog drum machine built for direct performance.", image: "assets/products/and/ui-2026.png", heroImage: "assets/products/and/ui-2026.png", platform: "Windows", standalone: true, vst3: true, pricingType: "MEMBER", publicPrice: null, membershipAvailability: true, status: "COMING SOON", purchaseUrl: "#", githubUrl: "https://github.com/", patreonUrl: "https://www.patreon.com/", featured: true, homePreview: false, exhibitNotes: "SIX VOICES / ANALOG SYNTHESIS / DIRECT PERFORMANCE", toolsUsedIn: [], headline: "ANALOG. NERVE. DRUM.", features: []
  },
  {
    name: "StreamArch", slug: "streamarch", disciplines: ["archive"], category: "Archive film web app",
    shortDescription: "Discover, watch and collect cinema history.",
    longDescription: "A fully functional browser for films preserved by the Internet Archive.",
    image: "assets/products/reelvault/card.png", heroImage: "assets/products/reelvault/card.png",
    platform: "Web", standalone: true, vst3: false, pricingType: "FREE", publicPrice: null, membershipAvailability: false, status: "LIVE",
    purchaseUrl: "apps/streamarch/", githubUrl: "https://github.com/", patreonUrl: "https://www.patreon.com/", featured: true,
    appUrl: "apps/streamarch/", headline: "STREAM. PRESERVE. ARCHIVE.", homePreview: false, exhibitNotes: "ARCHIVE SEARCH / WATCH / COLLECT", toolsUsedIn: [], features: []
  },
  {
    name: "DrawTable", slug: "drawtable", disciplines: ["audio"], category: "Drawable wavetable synthesizer",
    shortDescription: "You draw the oscillator.",
    longDescription: "A hands-on wavetable instrument for drawing frames, shaping motion and generating morphs.",
    image: "assets/products/drawtable/card.png", heroImage: "assets/products/drawtable/hero.png",
    platform: "Windows", standalone: true, vst3: false, pricingType: "FREE", publicPrice: null, membershipAvailability: false, status: "IN DEVELOPMENT",
    purchaseUrl: "#", githubUrl: "https://github.com/", patreonUrl: "https://www.patreon.com/", featured: true,
    headline: "YOU DRAW THE OSCILLATOR.", homePreview: false, exhibitNotes: "DRAWN WAVETABLES / FRAME MORPHING / SOUND", toolsUsedIn: [], features: []
  }
];

export const getProduct = slug => products.find(product => product.slug === slug);
