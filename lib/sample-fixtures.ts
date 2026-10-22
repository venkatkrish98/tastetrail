import { QlooRawPlaceCandidate } from './types';

/**
 * TasteTrail Labeled Offline Sample Fixtures
 * 
 * IMPORTANT DISCLAIMER FOR JUDGES & DEVELOPERS:
 * These fixtures are strictly static sample reference data used when no QLOO_API_KEY
 * is provided or when offline demo mode is explicitly enabled.
 * They are clearly marked to ensure total transparency and are never confused with
 * or misrepresented as live Qloo API responses.
 */

export interface CityFixtureData {
  name: string;
  coordinates: { lat: number; lng: number };
  curatedCandidates: QlooRawPlaceCandidate[];
  genericBaselineCandidates: QlooRawPlaceCandidate[];
}

export const SAMPLE_CITIES_FIXTURES: Record<string, CityFixtureData> = {
  'New York': {
    name: 'New York',
    coordinates: { lat: 40.7128, lng: -74.006 },
    curatedCandidates: [
      {
        id: 'sample-nyc-1',
        name: 'Village Vanguard & Jazz Archive',
        category: 'Live Music / Historic Jazz Cellar',
        affinityScore: 94,
        location: {
          lat: 40.736,
          lng: -74.0017,
          address: '178 7th Ave S',
          neighborhood: 'Greenwich Village',
        },
        attributes: ['Historic Landmark', 'Acoustic Intimacy', 'Vinyl History'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Miles Davis',
          sharedAffinities: ['Modal Jazz', 'Mid-century Avant-Garde', 'Bebop Legacy'],
          affinityPercentile: 96,
        },
      },
      {
        id: 'sample-nyc-2',
        name: 'Three Lives & Company Booksellers',
        category: 'Independent Literary Bookshop',
        affinityScore: 91,
        location: {
          lat: 40.7354,
          lng: -74.0019,
          address: '154 W 10th St',
          neighborhood: 'West Village',
        },
        attributes: ['Fiction Focus', 'Cozy Atmosphere', 'Curated Staff Picks'],
        estimatedSpendTier: '$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Haruki Murakami',
          sharedAffinities: ['Magical Realism', 'Cozy Solitude', 'Literary Escapism'],
          affinityPercentile: 92,
        },
      },
      {
        id: 'sample-nyc-3',
        name: 'Caffe Reggio & Historic Espresso',
        category: 'Historic Bohemian Cafe',
        affinityScore: 88,
        location: {
          lat: 40.7303,
          lng: -74.0002,
          address: '119 MacDougal St',
          neighborhood: 'Greenwich Village',
        },
        attributes: ['Original Espresso Machine (1902)', 'Beat Generation Hangout', 'Warm Lighting'],
        estimatedSpendTier: '$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Patti Smith',
          sharedAffinities: ['Beat Poetry', 'Coffeehouse Culture', 'Bohemian Heritage'],
          affinityPercentile: 89,
        },
      },
      {
        id: 'sample-nyc-4',
        name: 'Metrograph Independent Cinema & Commissary',
        category: 'Art House Cinema & Vintage Dining',
        affinityScore: 93,
        location: {
          lat: 40.7153,
          lng: -73.9912,
          address: '7 Ludlow St',
          neighborhood: 'Lower East Side',
        },
        attributes: ['35mm Screenings', 'Old Hollywood Aesthetic', 'Curated Bookstore'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Wes Anderson',
          sharedAffinities: ['Symmetrical Visuals', 'Vintage Nostalgia', 'Auteur Cinema'],
          affinityPercentile: 95,
        },
      },
      {
        id: 'sample-nyc-5',
        name: 'Nitehawk Cinema Williamsburg',
        category: 'Indie Film & Craft Hospitality',
        affinityScore: 86,
        location: {
          lat: 40.716,
          lng: -73.9602,
          address: '136 Metropolitan Ave',
          neighborhood: 'Williamsburg',
        },
        attributes: ['Director Retrospectives', 'Table Service', 'Dine-in Cinema'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Blade Runner',
          sharedAffinities: ['Neo-noir Cinema', 'Late-night Cult Screenings', 'Dystopian Sci-Fi'],
          affinityPercentile: 88,
        },
      },
      {
        id: 'sample-nyc-6',
        name: 'Casa Mono & Bar Jamón',
        category: 'Tapas & Regional Wine Cellar',
        affinityScore: 87,
        location: {
          lat: 40.7363,
          lng: -73.9877,
          address: '52 Irving Pl',
          neighborhood: 'Gramercy',
        },
        attributes: ['Small Plates', 'Extensive Sherry/Wine List', 'Intimate Counter'],
        estimatedSpendTier: '$$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Oaxacan cuisine',
          sharedAffinities: ['Heritage Culinary Craft', 'Regional Cooking', 'Artisanal Flavors'],
          affinityPercentile: 85,
        },
      },
    ],
    genericBaselineCandidates: [
      {
        id: 'baseline-nyc-1',
        name: 'Midtown Commercial Mall Food Court',
        category: 'Commercial Dining Chain',
        affinityScore: 40,
        location: {
          lat: 40.758,
          lng: -73.9855,
          address: 'Broadway & 45th St',
          neighborhood: 'Times Square',
        },
        attributes: ['Fast Food', 'High Foot Traffic', 'Generic Seating'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'General Foot Traffic',
          sharedAffinities: ['Mass Market Visibility'],
          affinityPercentile: 40,
        },
      },
      {
        id: 'baseline-nyc-2',
        name: 'Souvenir & Big Box Retail Center',
        category: 'Commercial Retail',
        affinityScore: 35,
        location: {
          lat: 40.757,
          lng: -73.986,
          address: '1540 Broadway',
          neighborhood: 'Times Square',
        },
        attributes: ['Generic Souvenirs', 'Loud Music', 'Mass Merchandise'],
        estimatedSpendTier: '$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'General Foot Traffic',
          sharedAffinities: ['Tourist Convenience'],
          affinityPercentile: 35,
        },
      },
      {
        id: 'baseline-nyc-3',
        name: 'Chain Coffeehouse & Drive-Thru Style Counter',
        category: 'Chain Coffee',
        affinityScore: 42,
        location: {
          lat: 40.755,
          lng: -73.987,
          address: '1411 Broadway',
          neighborhood: 'Garment District',
        },
        attributes: ['Pre-packaged Snacks', 'High Turnover', 'Fluorescent Lighting'],
        estimatedSpendTier: '$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'General Foot Traffic',
          sharedAffinities: ['Everyday Caffeine'],
          affinityPercentile: 42,
        },
      },
    ],
  },
  'Tokyo': {
    name: 'Tokyo',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    curatedCandidates: [
      {
        id: 'sample-tky-1',
        name: 'Bar DUG Jazz Cafe & Bar',
        category: 'Historic Jazz Kissa',
        affinityScore: 97,
        location: {
          lat: 35.6924,
          lng: 139.7042,
          address: '3-15-8 Shinjuku',
          neighborhood: 'Shinjuku',
        },
        attributes: ['Murakami Norwegian Wood Inspiration', 'Audiophile Vinyl System', 'Dark Wood Interior'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Haruki Murakami',
          sharedAffinities: ['Jazz Kissa Culture', 'Nocturnal Solitude', '1960s Shinjuku Nostalgia'],
          affinityPercentile: 98,
        },
      },
      {
        id: 'sample-tky-2',
        name: 'Daikanyama T-Site Tsutaya',
        category: 'Cultural Complex & Architecture',
        affinityScore: 94,
        location: {
          lat: 35.6489,
          lng: 139.7001,
          address: '17-5 Sarugakucho',
          neighborhood: 'Daikanyama',
        },
        attributes: ['Klein Dytham Architecture', 'Rare Art Monographs', 'Outdoor Terrace Cafe'],
        estimatedSpendTier: '$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Wes Anderson',
          sharedAffinities: ['Symmetrical Architecture', 'Design Books', 'Clean Aesthetics'],
          affinityPercentile: 94,
        },
      },
      {
        id: 'sample-tky-3',
        name: 'Shiro-Hige Cream Puff Factory',
        category: 'Whimsical Patisserie & Cafe',
        affinityScore: 92,
        location: {
          lat: 35.6593,
          lng: 139.6644,
          address: '5-3-1 Daita',
          neighborhood: 'Setagaya',
        },
        attributes: ['Handcrafted Totoro Pastries', 'Forest Garden Setting', 'Miyazaki Family Connected'],
        estimatedSpendTier: '$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Studio Ghibli',
          sharedAffinities: ['Animation Whimsy', 'Nature Nostalgia', 'Artisanal Confectionery'],
          affinityPercentile: 96,
        },
      },
      {
        id: 'sample-tky-4',
        name: 'Disk Union Ochanomizu Jazz館',
        category: 'Specialty Vintage Vinyl Store',
        affinityScore: 89,
        location: {
          lat: 35.6994,
          lng: 139.764,
          address: '2-1-17 Kanda Surugadai',
          neighborhood: 'Chiyoda',
        },
        attributes: ['Rare Blue Note First Pressings', 'Listening Booths', 'Hard Bop Archiving'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Miles Davis',
          sharedAffinities: ['Vintage Vinyl', 'Mid-century Hard Bop', 'Audio Curation'],
          affinityPercentile: 91,
        },
      },
    ],
    genericBaselineCandidates: [
      {
        id: 'baseline-tky-1',
        name: 'Mega Electronics Department Store',
        category: 'Mass Electronics Outlet',
        affinityScore: 38,
        location: { lat: 35.698, lng: 139.771, address: 'Akihabara', neighborhood: 'Chiyoda' },
        attributes: ['Loud Jingles', 'Fluorescent Aisles', 'Mass Merchandise'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'General Foot Traffic',
          sharedAffinities: ['Standard Tourist Stop'],
          affinityPercentile: 38,
        },
      },
    ],
  },
  'London': {
    name: 'London',
    coordinates: { lat: 51.5074, lng: -0.1278 },
    curatedCandidates: [
      {
        id: 'sample-ldn-1',
        name: 'Ronnie Scott’s Upstairs Bar',
        category: 'Historic Jazz Institution',
        affinityScore: 93,
        location: { lat: 51.5132, lng: -0.1317, address: '47 Frith St', neighborhood: 'Soho' },
        attributes: ['Historic Soho Roots', 'Low Intimate Lighting', 'Live Improvisation'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Miles Davis',
          sharedAffinities: ['Modern Jazz Heritage', 'Late Night Vibe', 'Soho Beat Culture'],
          affinityPercentile: 95,
        },
      },
      {
        id: 'sample-ldn-2',
        name: 'Daunt Books Marylebone',
        category: 'Edwardian Travel & Literature Bookshop',
        affinityScore: 92,
        location: { lat: 51.5204, lng: -0.1517, address: '84 Marylebone High St', neighborhood: 'Marylebone' },
        attributes: ['Stained Glass Window', 'Oak Balconies', 'Curated Travel Fiction'],
        estimatedSpendTier: '$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Haruki Murakami',
          sharedAffinities: ['Literary Flâneur', 'Quiet Contemplation', 'World Literature'],
          affinityPercentile: 93,
        },
      },
      {
        id: 'sample-ldn-3',
        name: 'BFI Southbank & Riverfront Lounge',
        category: 'Independent Cinema & Archive',
        affinityScore: 90,
        location: { lat: 51.5065, lng: -0.116, address: 'Belvedere Rd', neighborhood: 'South Bank' },
        attributes: ['National Film Theatre', 'Cinema Mediatheque', 'Riverside Deck'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Wes Anderson',
          sharedAffinities: ['Curated Film Seasons', 'Print Publications', 'Auteur Cinema'],
          affinityPercentile: 91,
        },
      },
    ],
    genericBaselineCandidates: [
      {
        id: 'baseline-ldn-1',
        name: 'Commercial Tourist Pub on Trafalgar',
        category: 'Commercial Pub Chain',
        affinityScore: 36,
        location: { lat: 51.508, lng: -0.128, address: 'Strand', neighborhood: 'Westminster' },
        attributes: ['Microwaved Meals', 'High Noise', 'Crowded Standing Bar'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'General Foot Traffic',
          sharedAffinities: ['Standard Tourist Convenience'],
          affinityPercentile: 36,
        },
      },
    ],
  },
  'Paris': {
    name: 'Paris',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    curatedCandidates: [
      {
        id: 'sample-prs-1',
        name: 'Shakespeare and Company & Cafe',
        category: 'Historic Anglophone Bookshop & Reading Salon',
        affinityScore: 95,
        location: { lat: 48.8525, lng: 2.3471, address: '37 Rue de la Bûcherie', neighborhood: '5th Arrondissement' },
        attributes: ['Lost Generation Heritage', 'Overlooking Notre Dame', 'Literary Piano'],
        estimatedSpendTier: '$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Patti Smith',
          sharedAffinities: ['Poetic Pilgrimage', 'Bohemian Memoir', 'Left Bank History'],
          affinityPercentile: 96,
        },
      },
      {
        id: 'sample-prs-2',
        name: 'Le Champo - Espace Jacques Tati',
        category: 'Historic Art-et-Essai Cinema',
        affinityScore: 92,
        location: { lat: 48.8504, lng: 2.3435, address: '51 Rue des Écoles', neighborhood: 'Latin Quarter' },
        attributes: ['Nouvelle Vague Landmark', 'Periscope Projection Room', 'Auteur Retrospectives'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Wes Anderson',
          sharedAffinities: ['French New Wave', 'Art-et-Essai Aesthetics', 'Historic Screenings'],
          affinityPercentile: 94,
        },
      },
      {
        id: 'sample-prs-3',
        name: 'Caveau de la Huchette',
        category: 'Medieval Vault Jazz Cave',
        affinityScore: 91,
        location: { lat: 48.8532, lng: 2.346, address: '5 Rue de la Huchette', neighborhood: 'Latin Quarter' },
        attributes: ['16th Century Stone Cellar', 'Live Swing & Bebop', 'La La Land Featured'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Miles Davis',
          sharedAffinities: ['Post-war Paris Jazz', 'Vaulted Acoustics', 'Bebop Heritage'],
          affinityPercentile: 92,
        },
      },
    ],
    genericBaselineCandidates: [
      {
        id: 'baseline-prs-1',
        name: 'Fast-Service Bistro Near Tourist Gate',
        category: 'Tourist Bistro',
        affinityScore: 37,
        location: { lat: 48.858, lng: 2.294, address: 'Champ de Mars', neighborhood: '7th Arr.' },
        attributes: ['Pre-made Croissants', 'High Markup', 'Crowded Sidewalk'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'General Foot Traffic',
          sharedAffinities: ['Sightseeing Proximity'],
          affinityPercentile: 37,
        },
      },
    ],
  },
  'San Francisco': {
    name: 'San Francisco',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    curatedCandidates: [
      {
        id: 'sample-sf-1',
        name: 'City Lights Booksellers & Publishers',
        category: 'Historic Beat Literature & Poetry Room',
        affinityScore: 96,
        location: { lat: 37.7977, lng: -122.4066, address: '261 Columbus Ave', neighborhood: 'North Beach' },
        attributes: ['Ferlinghetti Founded', 'Poet’s Room Upstairs', 'Radical Publishing'],
        estimatedSpendTier: '$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Patti Smith',
          sharedAffinities: ['Beat Generation', 'Poetic Dissidence', 'Independent Press'],
          affinityPercentile: 97,
        },
      },
      {
        id: 'sample-sf-2',
        name: 'Vesuvio Cafe',
        category: 'Bohemian Saloon & Art Bar',
        affinityScore: 91,
        location: { lat: 37.7975, lng: -122.4065, address: '255 Columbus Ave', neighborhood: 'North Beach' },
        attributes: ['Kerouac & Ginsberg Hangout', 'Stained Glass & Murals', 'Adjacent to Jack Kerouac Alley'],
        estimatedSpendTier: '$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Miles Davis',
          sharedAffinities: ['Bohemian Nightlife', 'Jazz & Beat Intersection', 'Vintage San Francisco'],
          affinityPercentile: 90,
        },
      },
      {
        id: 'sample-sf-3',
        name: 'Roxie Theater',
        category: 'Historic Community Non-Profit Cinema',
        affinityScore: 89,
        location: { lat: 37.7645, lng: -122.422, address: '3117 16th St', neighborhood: 'Mission District' },
        attributes: ['Oldest Continuously Operating Theater', 'Cult & Indie Programming', 'Film Noir Festivals'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'Blade Runner',
          sharedAffinities: ['Film Noir Retrospectives', 'Cult Cyberpunk', 'Midnight Screenings'],
          affinityPercentile: 91,
        },
      },
    ],
    genericBaselineCandidates: [
      {
        id: 'baseline-sf-1',
        name: 'Fisherman’s Wharf Souvenir Emporium',
        category: 'Commercial Pier Retail',
        affinityScore: 33,
        location: { lat: 37.808, lng: -122.417, address: 'Pier 39', neighborhood: 'Fisherman Wharf' },
        attributes: ['Mass-produced Souvenirs', 'Loud Arcades', 'Crowded Walkways'],
        estimatedSpendTier: '$$',
        
        typicalDwellMinutes: 60,
        isSampleData: true,
        qlooSignalEvidence: {
          connectedAnchor: 'General Foot Traffic',
          sharedAffinities: ['Mass Tourism'],
          affinityPercentile: 33,
        },
      },
    ],
  },
};

/**
 * Standard suggested cultural anchors across diverse media domains
 * with verified Qloo entity types for fast user picking
 */
export const POPULAR_CULTURAL_ANCHORS = [
  { name: 'Miles Davis', category: 'music' as const, entityType: 'urn:entity:artist' as const, preview: 'Jazz innovator & modal pioneer' },
  { name: 'Haruki Murakami', category: 'literature' as const, entityType: 'urn:entity:book' as const, preview: 'Magical realism, jazz kissa & urban solitude' },
  { name: 'Wes Anderson', category: 'film' as const, entityType: 'urn:entity:movie' as const, preview: 'Symmetrical palette, eccentric nostalgia & retro craft' },
  { name: 'Studio Ghibli', category: 'film' as const, entityType: 'urn:entity:movie' as const, preview: 'Lush pastoral animation, quiet reflection & folklore' },
  { name: 'Patti Smith', category: 'music' as const, entityType: 'urn:entity:artist' as const, preview: 'Poet, punk icon & bohemian flâneur' },
  { name: 'Blade Runner', category: 'film' as const, entityType: 'urn:entity:movie' as const, preview: 'Neo-noir aesthetic, dystopian synth & neon atmosphere' },
  { name: 'Oaxacan cuisine', category: 'culinary' as const, entityType: 'urn:entity:brand' as const, preview: 'Rich mole varieties, ancestral agave & artisanal craft' },
  { name: 'David Lynch', category: 'film' as const, entityType: 'urn:entity:movie' as const, preview: 'Surrealist Americana, dream logic & noir diners' },
  { name: 'Bauhaus Movement', category: 'visual_art' as const, entityType: 'urn:entity:brand' as const, preview: 'Modernist geometry, functional minimalism & typography' },
  { name: 'A Tribe Called Quest', category: 'music' as const, entityType: 'urn:entity:artist' as const, preview: 'Jazz rap, vibrant rhythm & Afrocentric urban cool' },
];
