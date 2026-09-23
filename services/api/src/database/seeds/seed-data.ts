import { PricingType, SiteCategory } from '../../common/enums';

export const COUNTRIES = [
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
  { code: 'EG', name: 'Egypt', currency: 'EGP' },
  { code: 'JO', name: 'Jordan', currency: 'JOD' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
];

export const CITIES = [
  { key: 'riyadh', country: 'SA', name: 'Riyadh', lat: 24.7136, lng: 46.6753, tz: 'Asia/Riyadh' },
  { key: 'jeddah', country: 'SA', name: 'Jeddah', lat: 21.4858, lng: 39.1925, tz: 'Asia/Riyadh' },
  { key: 'alula', country: 'SA', name: 'AlUla', lat: 26.6084, lng: 37.9232, tz: 'Asia/Riyadh' },
  { key: 'cairo', country: 'EG', name: 'Cairo', lat: 30.0444, lng: 31.2357, tz: 'Africa/Cairo' },
  { key: 'luxor', country: 'EG', name: 'Luxor', lat: 25.6872, lng: 32.6396, tz: 'Africa/Cairo' },
  { key: 'petra', country: 'JO', name: 'Petra', lat: 30.3216, lng: 35.4801, tz: 'Asia/Amman' },
  { key: 'amman', country: 'JO', name: 'Amman', lat: 31.9454, lng: 35.9284, tz: 'Asia/Amman' },
  { key: 'dubai', country: 'AE', name: 'Dubai', lat: 25.2048, lng: 55.2708, tz: 'Asia/Dubai' },
];

type SiteSeed = {
  key: string;
  city: string;
  name: string;
  category: SiteCategory;
  lat: number;
  lng: number;
  description: string;
  licensed?: boolean;
};

export const SITES: SiteSeed[] = [
  { key: 'turaif', city: 'riyadh', name: 'At-Turaif (Diriyah)', category: SiteCategory.HERITAGE, lat: 24.7336, lng: 46.5753, licensed: true, description: 'UNESCO-listed mud-brick birthplace of the first Saudi state.' },
  { key: 'masmak', city: 'riyadh', name: 'Masmak Fortress', category: SiteCategory.HERITAGE, lat: 24.6312, lng: 46.7134, description: 'Clay and mud-brick fort at the heart of old Riyadh.' },
  { key: 'nationalmuseum', city: 'riyadh', name: 'National Museum of Saudi Arabia', category: SiteCategory.MUSEUM, lat: 24.6476, lng: 46.7103, description: 'Eight galleries spanning the Arabian Peninsula from prehistory to today.' },
  { key: 'edge', city: 'riyadh', name: 'Edge of the World (Jebel Fihrayn)', category: SiteCategory.NATURE, lat: 24.9559, lng: 45.9976, description: 'Dramatic escarpment cliffs of the Tuwaiq range.' },
  { key: 'albalad', city: 'jeddah', name: 'Al-Balad Historic District', category: SiteCategory.HERITAGE, lat: 21.4827, lng: 39.1869, licensed: true, description: 'Coral-stone houses with wooden rawasheen balconies, UNESCO site.' },
  { key: 'corniche', city: 'jeddah', name: 'Jeddah Corniche', category: SiteCategory.CITY, lat: 21.5433, lng: 39.1046, description: '30 km Red Sea waterfront with King Fahd Fountain.' },
  { key: 'hegra', city: 'alula', name: 'Hegra (Mada\'in Salih)', category: SiteCategory.HERITAGE, lat: 26.7917, lng: 37.9531, licensed: true, description: 'Nabataean rock-cut tombs; Saudi Arabia\'s first UNESCO site.' },
  { key: 'elephant', city: 'alula', name: 'Elephant Rock', category: SiteCategory.NATURE, lat: 26.6522, lng: 37.9219, description: 'Towering sandstone formation shaped like an elephant.' },
  { key: 'oldtown', city: 'alula', name: 'AlUla Old Town', category: SiteCategory.HERITAGE, lat: 26.6164, lng: 37.9217, description: 'Maze of 900 mud-brick houses beneath a hilltop fort.' },
  { key: 'giza', city: 'cairo', name: 'Pyramids of Giza', category: SiteCategory.HERITAGE, lat: 29.9792, lng: 31.1342, licensed: true, description: 'The Great Pyramid, Khafre, Menkaure and the Sphinx.' },
  { key: 'gem', city: 'cairo', name: 'Grand Egyptian Museum', category: SiteCategory.MUSEUM, lat: 29.9941, lng: 31.1193, description: 'Home of the complete Tutankhamun collection.' },
  { key: 'khanelkhalili', city: 'cairo', name: 'Khan el-Khalili', category: SiteCategory.FOOD, lat: 30.0477, lng: 31.2623, description: '14th-century souk in Islamic Cairo.' },
  { key: 'karnak', city: 'luxor', name: 'Karnak Temple Complex', category: SiteCategory.RELIGIOUS, lat: 25.7188, lng: 32.6573, licensed: true, description: 'Vast temple complex with the Great Hypostyle Hall.' },
  { key: 'valleykings', city: 'luxor', name: 'Valley of the Kings', category: SiteCategory.HERITAGE, lat: 25.7402, lng: 32.6014, licensed: true, description: 'Royal tombs of the New Kingdom pharaohs.' },
  { key: 'treasury', city: 'petra', name: 'Petra — Al-Khazneh (Treasury)', category: SiteCategory.HERITAGE, lat: 30.3222, lng: 35.4516, licensed: true, description: 'Iconic rose-red façade at the end of the Siq.' },
  { key: 'monastery', city: 'petra', name: 'Petra — Ad Deir (Monastery)', category: SiteCategory.ADVENTURE, lat: 30.3367, lng: 35.4375, description: '800-step climb to Petra\'s largest monument.' },
  { key: 'citadel', city: 'amman', name: 'Amman Citadel', category: SiteCategory.HERITAGE, lat: 31.9546, lng: 35.9346, description: 'Temple of Hercules and Umayyad Palace above downtown.' },
  { key: 'aldeira', city: 'dubai', name: 'Al Fahidi Historical District', category: SiteCategory.HERITAGE, lat: 25.2637, lng: 55.2997, description: 'Wind-tower houses and the Dubai Museum by the Creek.' },
];

type GuideSeed = {
  key: string;
  name: string;
  email: string;
  phone: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  country: string;
  license: string;
  licenseExpires: string;
  languages: string[];
  years: number;
  bio: string;
  cities: string[];
  sites: string[];
  rejectionReason?: string;
  packages: Array<{
    title: string;
    city: string;
    description: string;
    durationMinutes: number;
    pricingType: PricingType;
    priceMinor: number;
    maxGroupSize: number;
    sites: string[];
  }>;
};

export const GUIDES: GuideSeed[] = [
  {
    key: 'faisal', name: 'Faisal Al-Harbi', email: 'faisal@guides.test', phone: '+966500000101', status: 'APPROVED',
    country: 'SA', license: 'SA-104233', licenseExpires: '2028-06-30', languages: ['ar', 'en'], years: 9,
    bio: 'Licensed by the Saudi Ministry of Tourism. Born in Diriyah, I love telling the story of the first Saudi state.',
    cities: ['riyadh'], sites: ['turaif', 'masmak', 'nationalmuseum', 'edge'],
    packages: [
      { title: 'Diriyah at Golden Hour', city: 'riyadh', description: 'Walk At-Turaif and Bujairi Terrace as the sun sets.', durationMinutes: 180, pricingType: PricingType.PER_GROUP, priceMinor: 45000, maxGroupSize: 6, sites: ['turaif'] },
      { title: 'Old Riyadh Heritage Walk', city: 'riyadh', description: 'Masmak Fortress, Souq Al-Zal and the National Museum.', durationMinutes: 240, pricingType: PricingType.PER_PERSON, priceMinor: 15000, maxGroupSize: 10, sites: ['masmak', 'nationalmuseum'] },
    ],
  },
  {
    key: 'noura', name: 'Noura Al-Qahtani', email: 'noura@guides.test', phone: '+966500000102', status: 'APPROVED',
    country: 'SA', license: 'SA-220981', licenseExpires: '2027-12-31', languages: ['ar', 'en', 'fr'], years: 6,
    bio: 'Archaeology graduate and certified AlUla guide. Tours in Arabic, English and French.',
    cities: ['alula'], sites: ['hegra', 'elephant', 'oldtown'],
    packages: [
      { title: 'Hegra Tombs Discovery', city: 'alula', description: 'Nabataean tombs of Hegra with a licensed site guide.', durationMinutes: 210, pricingType: PricingType.PER_PERSON, priceMinor: 32000, maxGroupSize: 8, sites: ['hegra'] },
      { title: 'AlUla Sunset & Old Town', city: 'alula', description: 'Old Town lanes then sunset at Elephant Rock.', durationMinutes: 180, pricingType: PricingType.PER_GROUP, priceMinor: 60000, maxGroupSize: 6, sites: ['oldtown', 'elephant'] },
    ],
  },
  {
    key: 'omar', name: 'Omar Bakr', email: 'omar@guides.test', phone: '+966500000103', status: 'APPROVED',
    country: 'SA', license: 'SA-318442', licenseExpires: '2027-03-31', languages: ['ar', 'en', 'ur'], years: 4,
    bio: 'Jeddah native. I know every rawasheen in Al-Balad and the best street food on the way.',
    cities: ['jeddah'], sites: ['albalad', 'corniche'],
    packages: [
      { title: 'Al-Balad Stories & Street Food', city: 'jeddah', description: 'Historic Jeddah plus tastings of mutabbaq and sobia.', durationMinutes: 180, pricingType: PricingType.PER_PERSON, priceMinor: 18000, maxGroupSize: 8, sites: ['albalad'] },
    ],
  },
  {
    key: 'mona', name: 'Mona Hassan', email: 'mona@guides.test', phone: '+201000000104', status: 'APPROVED',
    country: 'EG', license: 'EG-55120', licenseExpires: '2028-01-31', languages: ['ar', 'en', 'de'], years: 12,
    bio: 'Egyptologist licensed by the Ministry of Tourism & Antiquities. 12 years guiding at Giza and the GEM.',
    cities: ['cairo', 'luxor'], sites: ['giza', 'gem', 'khanelkhalili', 'karnak', 'valleykings'],
    packages: [
      { title: 'Giza Pyramids & Sphinx', city: 'cairo', description: 'Early start to beat the crowds on the Giza plateau.', durationMinutes: 240, pricingType: PricingType.PER_GROUP, priceMinor: 250000, maxGroupSize: 8, sites: ['giza'] },
      { title: 'Grand Egyptian Museum Highlights', city: 'cairo', description: 'Tutankhamun galleries and the Grand Staircase.', durationMinutes: 180, pricingType: PricingType.PER_PERSON, priceMinor: 90000, maxGroupSize: 12, sites: ['gem'] },
      { title: 'Luxor East & West Bank', city: 'luxor', description: 'Karnak in the morning, Valley of the Kings after lunch.', durationMinutes: 480, pricingType: PricingType.PER_GROUP, priceMinor: 400000, maxGroupSize: 6, sites: ['karnak', 'valleykings'] },
    ],
  },
  {
    key: 'yousef', name: 'Yousef Nasser', email: 'yousef@guides.test', phone: '+962700000105', status: 'APPROVED',
    country: 'JO', license: 'JO-7781', licenseExpires: '2027-09-30', languages: ['ar', 'en', 'es'], years: 8,
    bio: 'Bedouin-born Petra guide. I will take you beyond the Treasury to the Monastery.',
    cities: ['petra', 'amman'], sites: ['treasury', 'monastery', 'citadel'],
    packages: [
      { title: 'Petra Full Day: Siq to Monastery', city: 'petra', description: 'The Siq, Treasury, Street of Facades and the Monastery climb.', durationMinutes: 420, pricingType: PricingType.PER_GROUP, priceMinor: 90000, maxGroupSize: 8, sites: ['treasury', 'monastery'] },
    ],
  },
  {
    key: 'khalid', name: 'Khalid Al-Otaibi', email: 'khalid@guides.test', phone: '+966500000106', status: 'PENDING',
    country: 'SA', license: 'SA-449120', licenseExpires: '2028-02-28', languages: ['ar', 'en'], years: 3,
    bio: 'Desert and Edge of the World specialist, awaiting verification.',
    cities: ['riyadh'], sites: ['edge'],
    packages: [
      { title: 'Edge of the World Sunset 4x4', city: 'riyadh', description: '4x4 trip to Jebel Fihrayn for sunset.', durationMinutes: 360, pricingType: PricingType.PER_GROUP, priceMinor: 80000, maxGroupSize: 4, sites: ['edge'] },
    ],
  },
  {
    key: 'layla', name: 'Layla Mansour', email: 'layla@guides.test', phone: '+201000000107', status: 'PENDING',
    country: 'EG', license: '88213', licenseExpires: '2027-06-30', languages: ['ar', 'en', 'it'], years: 5,
    bio: 'Cairo food and souk tours. License number in old format — needs manual review.',
    cities: ['cairo'], sites: ['khanelkhalili'],
    packages: [],
  },
  {
    key: 'sami', name: 'Sami Haddad', email: 'sami@guides.test', phone: '+962700000108', status: 'REJECTED',
    country: 'JO', license: 'JO-FAKE-01', licenseExpires: '2027-01-01', languages: ['en'], years: 1,
    bio: 'Amman city walks.', cities: ['amman'], sites: ['citadel'],
    rejectionReason: 'License number not found in the Jordan Tourism Board registry.',
    packages: [],
  },
];

export const TOURISTS = [
  { key: 'sara', name: 'Sara Williams', email: 'sara@example.com', phone: '+447700900001' },
  { key: 'lucas', name: 'Lucas Martin', email: 'lucas@example.com', phone: '+33612345678' },
  { key: 'aisha', name: 'Aisha Rahman', email: 'aisha@example.com', phone: '+60123456789' },
];

export const ADMIN = { name: 'Platform Admin', email: 'admin@tourguide.test', phone: '+966500000001' };

export const PASSWORDS = { admin: 'Admin123!', default: 'Password123!' };
