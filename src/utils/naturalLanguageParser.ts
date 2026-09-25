// Universal Multilingual NLP Query Parser and Tolerant Search Matching for WORTHX

export interface ParsedQuantity {
  value: number;
  unit: string;
  originalText: string;
}

export interface ParsedQuery {
  originalQuery: string;
  detectedLanguage?: 'English' | 'Tamil' | 'Hindi' | 'Tanglish' | 'Mixed';
  material: string | null;
  canonicalName: string | null;
  quantity: ParsedQuantity | null;
  location: string | null;
  cleanKeywords: string[];
}

export const CANONICAL_MATERIALS = [
  'Coconut Shell',
  'Coconut Husk',
  'Eggshell',
  'Orange Peel',
  'Plastic Bottles',
  'Paper Waste',
  'Banana Peel',
  'Agricultural Waste',
] as const;

export type CanonicalMaterial = (typeof CANONICAL_MATERIALS)[number];

// Comprehensive Multilingual (English, Tamil, Hindi, Tanglish) dictionary
export const MULTILINGUAL_SYNONYMS: Record<CanonicalMaterial, string[]> = {
  'Coconut Shell': [
    'coconut shell',
    'coconutshell',
    'coconut-shell',
    'coco shell',
    'endocarp',
    'charcoal shell',
    'activated carbon shell',
    // Tamil script
    'தேங்காய் ஓடு',
    'தேங்காயோடு',
    'சிரட்டை',
    'தேங்காய் சிரட்டை',
    // Tanglish / Transliterated Tamil
    'thengai odu',
    'thenga odu',
    'thenga chirattai',
    'chirattai',
    'cirattai',
    'tengai odu',
    'thengai koodu',
    // Hindi & Hinglish
    'nariyal shell',
    'nariyal ka khol',
    'nariyal khol',
    'nariyal katori',
    'nariyal chhilka hard',
  ],
  'Coconut Husk': [
    'coconut husk',
    'coconuthusk',
    'coconut-husk',
    'coir',
    'coir fiber',
    'coir fibre',
    'coco peat',
    'cocopeat',
    'raw coir',
    // Tamil script
    'தேங்காய் நார்',
    'தேங்காயின் மட்டை',
    'மட்டை நார்',
    'கயிறு நார்',
    // Tanglish
    'thengai naar',
    'thenga naar',
    'thengai mattai',
    'mattai',
    'thenga fiber',
    'kayiru naar',
    // Hindi & Hinglish
    'nariyal jutta',
    'nariyal rassa',
    'nariyal fiber',
    'nariyal chhilka',
    'nariyal baal',
  ],
  'Eggshell': [
    'eggshell',
    'egg shell',
    'egg-shell',
    'eggshell waste',
    'egg shell waste',
    'bio calcium',
    'biocalcium',
    'poultry shell',
    // Tamil script
    'முட்டை ஓடு',
    'முட்டையோடு',
    'கோழி முட்டை ஓடு',
    // Tanglish
    'muttai odu',
    'muttai thol',
    'mottai odu',
    'mutta odu',
    // Hindi & Hinglish
    'ande ka chilka',
    'ande ka chhilka',
    'anda chilka',
    'egg chilka',
  ],
  'Orange Peel': [
    'orange peel',
    'orangepeel',
    'orange-peel',
    'citrus rind',
    'citrus peel',
    'citrus waste',
    'lemon peel',
    // Tamil script
    'ஆரஞ்சு தோல்',
    'ஆரஞ்சு பழத்தோல்',
    'எலுமிச்சை தோல்',
    // Tanglish
    'orange thol',
    'aranju thol',
    'arunchu thol',
    // Hindi & Hinglish
    'santra chhilka',
    'santra chilka',
    'narangi chhilka',
    'mosambi chilka',
  ],
  'Plastic Bottles': [
    'plastic bottle',
    'plastic bottles',
    'plasticbottle',
    'pet bottle',
    'pet bottles',
    'rpet',
    'rpet flakes',
    'plastic container scrap',
    // Tamil script
    'பிளாஸ்டிக் பாட்டில்',
    'பிளாஸ்டிக் கழிவு',
    // Tanglish
    'plastic bottle-gal',
    'plastic kuppai',
    // Hindi & Hinglish
    'plastic botal',
    'plastic bottle scrap',
    'pet botal',
  ],
  'Paper Waste': [
    'paper waste',
    'paperwaste',
    'scrap paper',
    'shredded paper',
    'cardboard',
    'occ cardboard',
    'kraft paper',
    // Tamil script
    'காகித கழிவு',
    'பழைய பேப்பர்',
    // Tanglish
    'paper kuppai',
    'palaiya paper',
    // Hindi & Hinglish
    'kagaz raddi',
    'raddi kagaz',
    'paper raddi',
  ],
  'Banana Peel': [
    'banana peel',
    'bananapeel',
    'banana skin',
    'banana waste',
    // Tamil script
    'வாழைப்பழ தோல்',
    'வாழைத்தோல்',
    // Tanglish
    'vazhai pazham thol',
    'vazhaithol',
    'kezhangu thol',
    // Hindi & Hinglish
    'kela chhilka',
    'kela chilka',
  ],
  'Agricultural Waste': [
    'agricultural waste',
    'agro waste',
    'crop residue',
    'paddy straw',
    'sugarcane bagasse',
    'mustard stalk',
    'rice husk',
    // Tamil script
    'விவசாய கழிவு',
    'வைக்கோல்',
    'கரும்பு சக்கை',
    // Tanglish
    'vaikol',
    'karumbu sakkai',
    'vivasaya kazhivu',
    // Hindi & Hinglish
    'parali',
    'kisan kachra',
    'paddy kachra',
    'fasal avshesh',
  ],
};

/**
 * Normalizes text: trims, lowercases, replaces hyphens and symbols with spaces, removes extra whitespace
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes text to contiguous alpha-numeric string for space-free comparison
 * e.g. "egg-shell" -> "eggshell", "orange peel" -> "orangepeel"
 */
export function toContiguousString(text: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF\u0900-\u097F]/g, '');
}

/**
 * Detect language script
 */
export function detectLanguage(text: string): 'Tamil' | 'Hindi' | 'Tanglish' | 'English' {
  if (/[\u0B80-\u0BFF]/.test(text)) return 'Tamil';
  if (/[\u0900-\u097F]/.test(text)) return 'Hindi';
  const tanglishWords = ['thengai', 'thenga', 'chirattai', 'naar', 'muttai', 'thol', 'vaikol', 'kazhivu'];
  const lower = text.toLowerCase();
  if (tanglishWords.some((w) => lower.includes(w))) return 'Tanglish';
  return 'English';
}

/**
 * Universal tolerant matching:
 * Supports lowercase, whitespace, punctuation, hyphens, partial words,
 * word-order tolerance, multilingual synonyms, and typo tolerance.
 */
export function matchListingAgainstQuery(
  listing: {
    materialName: string;
    category: string;
    description?: string;
    location?: string;
    tags?: string[];
    applications?: string[];
  },
  query: string,
  _parsed?: any
): { matched: boolean; priority: number } {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) {
    return { matched: true, priority: 1 };
  }

  const queryTokens = normQuery.split(' ').filter((t) => t.length > 0);
  const contiguousQuery = toContiguousString(normQuery);

  const normName = normalizeSearchText(listing.materialName);
  const contiguousName = toContiguousString(listing.materialName);
  const normCat = normalizeSearchText(listing.category);
  const normDesc = normalizeSearchText(listing.description || '');
  const normLoc = normalizeSearchText(listing.location || '');
  const allTags = (listing.tags || []).map(normalizeSearchText);
  const allApps = (listing.applications || []).map(normalizeSearchText);

  // 1. Exact match (Priority 100)
  if (normName === normQuery || contiguousName === contiguousQuery) {
    return { matched: true, priority: 100 };
  }

  // 2. Multilingual Synonym Match (Priority 95)
  for (const [canonical, synonyms] of Object.entries(MULTILINGUAL_SYNONYMS)) {
    const canonicalLower = canonical.toLowerCase();
    const isTargetListing = normName.includes(canonicalLower) || contiguousName.includes(toContiguousString(canonical));

    if (isTargetListing) {
      for (const syn of synonyms) {
        const normSyn = normalizeSearchText(syn);
        const contigSyn = toContiguousString(syn);

        if (
          normQuery === normSyn ||
          contiguousQuery === contigSyn ||
          normQuery.includes(normSyn) ||
          normSyn.includes(normQuery)
        ) {
          return { matched: true, priority: 95 };
        }

        // Token intersection with synonym
        const synTokens = normSyn.split(' ');
        const matchesAllSynTokens = synTokens.every((st) => normQuery.includes(st) || contiguousQuery.includes(st));
        if (matchesAllSynTokens && synTokens.length > 0) {
          return { matched: true, priority: 90 };
        }
      }
    }
  }

  // 3. Word-order tolerance & Token subset in Material Name (Priority 85)
  const nameMatchesAllTokens = queryTokens.every(
    (token) => normName.includes(token) || contiguousName.includes(token)
  );
  if (nameMatchesAllTokens && queryTokens.length > 0) {
    return { matched: true, priority: 85 };
  }

  // 4. Any meaningful token match in Material Name (Priority 75)
  const nameMatchesAnyToken = queryTokens.some(
    (token) => token.length >= 3 && (normName.includes(token) || contiguousName.includes(token))
  );
  if (nameMatchesAnyToken) {
    return { matched: true, priority: 75 };
  }

  // 5. Category or Tag Match (Priority 60)
  if (
    normCat.includes(normQuery) ||
    queryTokens.some((t) => t.length >= 3 && normCat.includes(t)) ||
    allTags.some((tag) => tag.includes(normQuery) || queryTokens.some((t) => tag.includes(t)))
  ) {
    return { matched: true, priority: 60 };
  }

  // 6. Description & Applications Match (Priority 40)
  const inDesc = queryTokens.some((t) => t.length >= 3 && normDesc.includes(t));
  const inApps = allApps.some((app) => queryTokens.some((t) => t.length >= 3 && app.includes(t)));
  if (inDesc || inApps) {
    return { matched: true, priority: 40 };
  }

  // 7. Location Match (Priority 20)
  if (queryTokens.some((t) => t.length >= 3 && normLoc.includes(t))) {
    return { matched: true, priority: 20 };
  }

  return { matched: false, priority: 0 };
}

/**
 * Natural Language Parser for conversational queries:
 * Extracts Material intent, Quantity, Location, and detected Language.
 */
export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return {
      originalQuery: '',
      material: null,
      canonicalName: null,
      quantity: null,
      location: null,
      cleanKeywords: [],
    };
  }

  const detectedLang = detectLanguage(trimmed);

  // 1. Extract Quantity: e.g. "50 kg", "1,000 kg", "5 tons", "10 tonnes", "100 kgs"
  let parsedQuantity: ParsedQuantity | null = null;
  const quantityRegex =
    /\b(\d+(?:,\d+)*(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|ton|tons|tonne|tonnes|metric\s*tons|mt|quintal|quintals|bales)\b/i;
  const qMatch = trimmed.match(quantityRegex);
  if (qMatch) {
    const rawVal = qMatch[1].replace(/,/g, '');
    const val = parseFloat(rawVal);
    let unit = qMatch[2].toLowerCase();
    if (unit.startsWith('kg') || unit.startsWith('kilo')) unit = 'kg';
    if (unit.startsWith('ton') || unit === 'mt') unit = 'Tons';
    if (unit.startsWith('quint')) unit = 'Quintal';

    parsedQuantity = {
      value: val,
      unit,
      originalText: qMatch[0],
    };
  }

  // 2. Extract Location
  let location: string | null = null;
  const locationPrefixRegex =
    /\b(?:near|in|at|around|close to|located in|from)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b/i;
  const locMatch = trimmed.match(locationPrefixRegex);
  if (locMatch) {
    const candidate = locMatch[1].trim();
    const candidateLower = candidate.toLowerCase();
    const ignoreList = ['kg', 'material', 'materials', 'feedstock', 'here', 'now', 'nearby', 'good', 'cheap', 'making', 'products'];
    if (!ignoreList.includes(candidateLower)) {
      location = candidate.charAt(0).toUpperCase() + candidate.slice(1);
    }
  }

  if (!location) {
    const knownCities = [
      'Chennai',
      'Coimbatore',
      'Pollachi',
      'Namakkal',
      'Nagpur',
      'Sivakasi',
      'Theni',
      'Thanjavur',
      'Mumbai',
      'Pune',
      'Bengaluru',
      'Bangalore',
      'Hyderabad',
      'Ahmedabad',
      'Madurai',
      'Salem',
      'Tirupur',
    ];
    for (const city of knownCities) {
      const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
      if (cityRegex.test(trimmed)) {
        location = city;
        break;
      }
    }
  }

  // 3. Extract Material Intent through multilingual dictionary
  let canonicalName: string | null = null;
  let materialMatchStr: string | null = null;
  const normQuery = normalizeSearchText(trimmed);
  const contigQuery = toContiguousString(trimmed);

  for (const [canonical, synonyms] of Object.entries(MULTILINGUAL_SYNONYMS)) {
    for (const syn of synonyms) {
      const normSyn = normalizeSearchText(syn);
      const contigSyn = toContiguousString(syn);
      if (
        normQuery === normSyn ||
        contigQuery === contigSyn ||
        normQuery.includes(normSyn) ||
        contigQuery.includes(contigSyn)
      ) {
        canonicalName = canonical;
        materialMatchStr = syn;
        break;
      }
    }
    if (canonicalName) break;
  }

  // Clean keywords
  const cleanKeywords = trimmed
    .toLowerCase()
    .replace(quantityRegex, '')
    .replace(locationPrefixRegex, '')
    .replace(
      /\b(i need|want|looking for|find|show me|where can i get|procure|buy|purchase|supplier of|available|cheap|bulk|reusable|waste|for making products|for recycling)\b/gi,
      ''
    )
    .split(/\s+/)
    .filter((w) => w.length > 2);

  return {
    originalQuery: trimmed,
    detectedLanguage: detectedLang,
    material: materialMatchStr || canonicalName,
    canonicalName,
    quantity: parsedQuantity,
    location,
    cleanKeywords,
  };
}

export const calculateQueryRelevance = matchListingAgainstQuery;

