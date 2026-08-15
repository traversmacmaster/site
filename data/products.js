export const products = [
  {
    name: "TimeField", slug: "timefield", category: "Temporal instrument",
    shortDescription: "Six heads. Six seconds. Play the immediate past.",
    longDescription: "TimeField continuously captures the previous six seconds of incoming audio and turns that recent history into a playable six-head temporal instrument.",
    image: "assets/products/timefield/ui-2026.png", heroImage: "assets/products/timefield/ui-2026.png",
    platform: "Windows", standalone: true, vst3: true, pricingType: "PREMIUM", publicPrice: null, membershipAvailability: true, status: "BETA",
    purchaseUrl: "#purchase-coming-soon", githubUrl: "https://github.com/", patreonUrl: "https://www.patreon.com/", featured: true,
    headline: "SEQUENCE THE PAST.",
    features: ["Six temporal heads", "Six-second rolling field", "Freeze + six Record Fields", "6×16 trigger sequencer", "Stretch, Reverse + Drift", "Guarded feedback", "MIDI performance", "Standalone + VST3"]
  },
  {
    name: "AuViMosh", slug: "avm", category: "Audio / video mosh instrument",
    shortDescription: "Destroy motion. Infect sound.",
    longDescription: "An experimental audio/video mosh instrument for live image corruption, sound-driven motion and unstable feedback systems.",
    image: "assets/products/avm/ui-2026.png", heroImage: "assets/products/avm/ui-2026.png",
    platform: "Desktop", standalone: true, vst3: false, pricingType: "PREMIUM", publicPrice: null, membershipAvailability: true, status: "IN DEVELOPMENT",
    purchaseUrl: "#purchase-coming-soon", githubUrl: "https://github.com/", patreonUrl: "https://www.patreon.com/", featured: true,
    headline: "DESTROY MOTION. INFECT SOUND.",
    features: ["A / B / C video sources", "Motion transfer + inject", "Drawable mosh region", "Realtime preview", "Audio Mosh", "Source bleed + grain processing", "Spectral swap + feedback", "Video export"]
  },
  {
    name: "HEXIT:B", slug: "hexd", category: "Sample Based Drum Machine", shortDescription: "A compact six-voice sample based drum machine.", longDescription: "A focused sample based drum machine built for direct performance.", image: "assets/products/hexd/ui-2026.png", heroImage: "assets/products/hexd/ui-2026.png", platform: "Windows", standalone: true, vst3: true, pricingType: "FREE", publicPrice: null, membershipAvailability: false, status: "ACTIVE", purchaseUrl: "#", githubUrl: "https://github.com/", patreonUrl: "https://www.patreon.com/", featured: true, headline: "SAMPLE BASED. PERFORMANCE READY.", features: []
  },
  {
    name: "HEXIT:A", slug: "and", category: "Analog Drum Machine", shortDescription: "A six-voice analog drum machine.", longDescription: "A native six-voice analog drum machine built for direct performance.", image: "assets/products/and/ui-2026.png", heroImage: "assets/products/and/ui-2026.png", platform: "Windows", standalone: true, vst3: true, pricingType: "MEMBER", publicPrice: null, membershipAvailability: true, status: "COMING SOON", purchaseUrl: "#", githubUrl: "https://github.com/", patreonUrl: "https://www.patreon.com/", featured: true, headline: "ANALOG. NERVE. DRUM.", features: []
  },
  {
    name: "ReelVault", slug: "reelvault", category: "Archive film web app",
    shortDescription: "Discover, watch and collect cinema history.",
    longDescription: "A fully functional browser for films preserved by the Internet Archive.",
    image: "assets/products/reelvault/card.png", heroImage: "assets/products/reelvault/card.png",
    platform: "Web", standalone: true, vst3: false, pricingType: "FREE", publicPrice: null, membershipAvailability: false, status: "LIVE",
    purchaseUrl: "apps/reelvault/", githubUrl: "https://github.com/", patreonUrl: "https://www.patreon.com/", featured: true,
    appUrl: "apps/reelvault/", headline: "THE ARCHIVE, UNCOVERED.", features: []
  },
  {
    name: "DrawTable", slug: "drawtable", category: "Drawable wavetable synthesizer",
    shortDescription: "You draw the oscillator.",
    longDescription: "A hands-on wavetable instrument for drawing frames, shaping motion and generating morphs.",
    image: "assets/products/drawtable/card.png", heroImage: "assets/products/drawtable/hero.png",
    platform: "Windows", standalone: true, vst3: false, pricingType: "FREE", publicPrice: null, membershipAvailability: false, status: "IN DEVELOPMENT",
    purchaseUrl: "#", githubUrl: "https://github.com/", patreonUrl: "https://www.patreon.com/", featured: true,
    headline: "YOU DRAW THE OSCILLATOR.", features: []
  }
];

export const getProduct = slug => products.find(product => product.slug === slug);
