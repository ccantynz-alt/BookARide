// Auckland Suburbs Data for SEO Landing Pages
export const aucklandSuburbs = [
  // CBD & Central
  {
    slug: 'auckland-cbd',
    name: 'Auckland CBD',
    region: 'Central Auckland',
    description: 'Auckland\'s vibrant city center with Sky Tower, Viaduct Harbour, and Queen Street',
    coordinates: { lat: -36.8485, lng: 174.7633 },
    distanceToAirport: 21,
    estimatedPrice: 100,
    estimatedTime: '25-30 minutes',
    landmarks: ['Sky Tower', 'Viaduct Harbour', 'Queen Street', 'Britomart', 'Commercial Bay'],
    nearbyAreas: ['Parnell', 'Newmarket', 'Ponsonby']
  },
  {
    slug: 'newmarket',
    name: 'Newmarket',
    region: 'Central Auckland',
    description: 'Premier shopping district with designer boutiques and restaurants',
    coordinates: { lat: -36.8697, lng: 174.7773 },
    distanceToAirport: 18,
    estimatedPrice: 95,
    estimatedTime: '22-28 minutes',
    landmarks: ['Westfield Newmarket', 'Broadway', '277 Shopping Centre'],
    nearbyAreas: ['Parnell', 'Remuera', 'Mt Eden']
  },
  {
    slug: 'parnell',
    name: 'Parnell',
    region: 'Central Auckland',
    description: 'Historic suburb with heritage buildings, galleries, and cafes',
    coordinates: { lat: -36.8585, lng: 174.7815 },
    distanceToAirport: 19,
    estimatedPrice: 95,
    estimatedTime: '23-28 minutes',
    landmarks: ['Parnell Rose Gardens', 'Holy Trinity Cathedral', 'Parnell Village'],
    nearbyAreas: ['Auckland CBD', 'Newmarket', 'Mission Bay']
  },
  
  // North Shore
  {
    slug: 'takapuna',
    name: 'Takapuna',
    region: 'North Shore',
    description: 'Beachside suburb with stunning views, cafes, and shopping',
    coordinates: { lat: -36.7878, lng: 174.7732 },
    distanceToAirport: 28,
    estimatedPrice: 120,
    estimatedTime: '30-35 minutes',
    landmarks: ['Takapuna Beach', 'The Strand', 'Lake Pupuke'],
    nearbyAreas: ['Devonport', 'Milford', 'Browns Bay']
  },
  {
    slug: 'albany',
    name: 'Albany',
    region: 'North Shore',
    description: 'Growing commercial hub with shopping centers and parks',
    coordinates: { lat: -36.7323, lng: 174.6983 },
    distanceToAirport: 35,
    estimatedPrice: 140,
    estimatedTime: '35-40 minutes',
    landmarks: ['Westfield Albany', 'Albany Mega Centre', 'Massey University'],
    nearbyAreas: ['Browns Bay', 'Silverdale', 'Glenfield']
  },
  {
    slug: 'browns-bay',
    name: 'Browns Bay',
    region: 'North Shore',
    description: 'Family-friendly beachside community with great amenities',
    coordinates: { lat: -36.7123, lng: 174.7471 },
    distanceToAirport: 38,
    estimatedPrice: 145,
    estimatedTime: '40-45 minutes',
    landmarks: ['Browns Bay Beach', 'Anzac Road Shopping', 'Murrays Bay'],
    nearbyAreas: ['Takapuna', 'Albany', 'Torbay']
  },
  {
    slug: 'devonport',
    name: 'Devonport',
    region: 'North Shore',
    description: 'Charming seaside village with Victorian architecture and naval history',
    coordinates: { lat: -36.8281, lng: 174.7963 },
    distanceToAirport: 24,
    estimatedPrice: 110,
    estimatedTime: '28-33 minutes',
    landmarks: ['Victoria Road', 'Mt Victoria', 'North Head Historic Reserve', 'Devonport Wharf'],
    nearbyAreas: ['Takapuna', 'Belmont', 'Auckland CBD']
  },
  
  // Central Suburbs
  {
    slug: 'mt-eden',
    name: 'Mt Eden',
    region: 'Central Auckland',
    description: 'Trendy village atmosphere with volcanic cone and panoramic city views',
    coordinates: { lat: -36.8796, lng: 174.7644 },
    distanceToAirport: 17,
    estimatedPrice: 90,
    estimatedTime: '20-25 minutes',
    landmarks: ['Mt Eden Summit', 'Eden Garden', 'Mt Eden Village'],
    nearbyAreas: ['Epsom', 'Newmarket', 'Kingsland']
  },
  {
    slug: 'epsom',
    name: 'Epsom',
    region: 'Central Auckland',
    description: 'Leafy residential area known for quality schools and cafes',
    coordinates: { lat: -36.8897, lng: 174.7725 },
    distanceToAirport: 16,
    estimatedPrice: 90,
    estimatedTime: '20-25 minutes',
    landmarks: ['Epsom Girls Grammar', 'Mt Eden Domain', 'Manukau Road'],
    nearbyAreas: ['Remuera', 'Mt Eden', 'Greenlane']
  },
  {
    slug: 'remuera',
    name: 'Remuera',
    region: 'Central Auckland',
    description: 'Upscale suburb with tree-lined streets and heritage homes',
    coordinates: { lat: -36.8767, lng: 174.7936 },
    distanceToAirport: 17,
    estimatedPrice: 90,
    estimatedTime: '22-27 minutes',
    landmarks: ['Remuera Road', 'Shore Road', 'Meadowbank'],
    nearbyAreas: ['Newmarket', 'Epsom', 'Mission Bay']
  },
  {
    slug: 'greenlane',
    name: 'Greenlane',
    region: 'Central Auckland',
    description: 'Central location with hospital, parks, and shopping',
    coordinates: { lat: -36.9015, lng: 174.7971 },
    distanceToAirport: 15,
    estimatedPrice: 85,
    estimatedTime: '18-23 minutes',
    landmarks: ['Auckland City Hospital', 'Cornwall Park', 'Greenlane Clinical Centre'],
    nearbyAreas: ['Epsom', 'Ellerslie', 'Remuera']
  },
  
  // East Auckland
  {
    slug: 'mission-bay',
    name: 'Mission Bay',
    region: 'Eastern Suburbs',
    description: 'Popular beachfront destination with restaurants and recreation',
    coordinates: { lat: -36.8499, lng: 174.8276 },
    distanceToAirport: 22,
    estimatedPrice: 105,
    estimatedTime: '25-30 minutes',
    landmarks: ['Mission Bay Beach', 'Tamaki Drive', 'Bastion Point'],
    nearbyAreas: ['St Heliers', 'Kohimarama', 'Parnell']
  },
  {
    slug: 'st-heliers',
    name: 'St Heliers',
    region: 'Eastern Suburbs',
    description: 'Affluent beachside suburb with boutique shops and cafes',
    coordinates: { lat: -36.8538, lng: 174.8541 },
    distanceToAirport: 24,
    estimatedPrice: 110,
    estimatedTime: '27-32 minutes',
    landmarks: ['St Heliers Bay', 'Achilles Point', 'Vellenoweth Green'],
    nearbyAreas: ['Mission Bay', 'Glendowie', 'Kohimarama']
  },
  {
    slug: 'howick',
    name: 'Howick',
    region: 'Eastern Suburbs',
    description: 'Historic village with markets, beaches, and family attractions',
    coordinates: { lat: -36.9902, lng: 174.9229 },
    distanceToAirport: 18,
    estimatedPrice: 95,
    estimatedTime: '22-27 minutes',
    landmarks: ['Howick Village', 'Picton Street', 'Cockle Bay', 'Mellons Bay'],
    nearbyAreas: ['Pakuranga', 'Bucklands Beach', 'Botany']
  },
  {
    slug: 'botany',
    name: 'Botany',
    region: 'Eastern Suburbs',
    description: 'Modern suburb with shopping centers and entertainment',
    coordinates: { lat: -36.9274, lng: 174.9108 },
    distanceToAirport: 12,
    estimatedPrice: 80,
    estimatedTime: '15-20 minutes',
    landmarks: ['Botany Town Centre', 'Ti Rakau Drive', 'The Hub'],
    nearbyAreas: ['Howick', 'East Tamaki', 'Pakuranga']
  },
  {
    slug: 'pakuranga',
    name: 'Pakuranga',
    region: 'Eastern Suburbs',
    description: 'Well-established suburb with shopping and schools',
    coordinates: { lat: -36.9074, lng: 174.8896 },
    distanceToAirport: 14,
    estimatedPrice: 85,
    estimatedTime: '18-23 minutes',
    landmarks: ['Pakuranga Plaza', 'Highland Park', 'Pigeon Mountain'],
    nearbyAreas: ['Howick', 'Botany', 'Half Moon Bay']
  },
  
  // South Auckland
  {
    slug: 'manukau',
    name: 'Manukau',
    region: 'South Auckland',
    description: 'Major commercial center close to airport with shopping',
    coordinates: { lat: -37.0082, lng: 174.8785 },
    distanceToAirport: 8,
    estimatedPrice: 70,
    estimatedTime: '12-17 minutes',
    landmarks: ['Westfield Manukau City', 'Manukau Sports Bowl', 'MIT'],
    nearbyAreas: ['Papatoetoe', 'Otara', 'Airport Area']
  },
  {
    slug: 'papakura',
    name: 'Papakura',
    region: 'South Auckland',
    description: 'Growing town with rail connections and local amenities',
    coordinates: { lat: -37.0654, lng: 174.9431 },
    distanceToAirport: 22,
    estimatedPrice: 105,
    estimatedTime: '25-30 minutes',
    landmarks: ['Papakura Town Centre', 'Red Hill', 'Clevedon Valley'],
    nearbyAreas: ['Drury', 'Takanini', 'Manurewa']
  },
  {
    slug: 'pukekohe',
    name: 'Pukekohe',
    region: 'Franklin',
    description: 'Rural town south of Auckland with farming heritage',
    coordinates: { lat: -37.2011, lng: 174.9014 },
    distanceToAirport: 45,
    estimatedPrice: 160,
    estimatedTime: '45-55 minutes',
    landmarks: ['Pukekohe Park Raceway', 'Franklin Road', 'King Street'],
    nearbyAreas: ['Paerata', 'Tuakau', 'Waiuku']
  },
  
  // West Auckland
  {
    slug: 'henderson',
    name: 'Henderson',
    region: 'West Auckland',
    description: 'Commercial hub of West Auckland with shopping and dining',
    coordinates: { lat: -36.8788, lng: 174.6392 },
    distanceToAirport: 28,
    estimatedPrice: 120,
    estimatedTime: '30-35 minutes',
    landmarks: ['WestCity Waitakere', 'Henderson Valley', 'Corban Estate'],
    nearbyAreas: ['New Lynn', 'Te Atatu', 'Glendene']
  },
  {
    slug: 'new-lynn',
    name: 'New Lynn',
    region: 'West Auckland',
    description: 'Transport hub with shopping and community facilities',
    coordinates: { lat: -36.9085, lng: 174.6848 },
    distanceToAirport: 24,
    estimatedPrice: 110,
    estimatedTime: '28-33 minutes',
    landmarks: ['LynnMall', 'New Lynn Train Station', 'Totara Park'],
    nearbyAreas: ['Henderson', 'Avondale', 'Glen Eden']
  },
  {
    slug: 'titirangi',
    name: 'Titirangi',
    region: 'West Auckland',
    description: 'Artistic village in the Waitakere Ranges with bush walks',
    coordinates: { lat: -36.9381, lng: 174.6599 },
    distanceToAirport: 30,
    estimatedPrice: 125,
    estimatedTime: '35-40 minutes',
    landmarks: ['Lopdell House', 'Arataki Visitor Centre', 'Scenic Drive'],
    nearbyAreas: ['New Lynn', 'Glen Eden', 'Waitakere']
  },
  
  // Additional Important Areas
  {
    slug: 'ponsonby',
    name: 'Ponsonby',
    region: 'Central Auckland',
    description: 'Trendy inner-city suburb with boutiques and cafes',
    coordinates: { lat: -36.8544, lng: 174.7524 },
    distanceToAirport: 22,
    estimatedPrice: 105,
    estimatedTime: '25-30 minutes',
    landmarks: ['Ponsonby Road', 'SPQR', 'Grey Lynn Park'],
    nearbyAreas: ['Auckland CBD', 'Grey Lynn', 'Herne Bay']
  },
  {
    slug: 'ellerslie',
    name: 'Ellerslie',
    region: 'Central Auckland',


// Import Hamilton and Whangarei areas
import { hamiltonAreas } from './hamiltonAreas';
import { whangareiAreas } from './whangareiAreas';

// Export all areas combined
export const allAreas = [
  ...aucklandSuburbs,
  ...hamiltonAreas,
  ...whangareiAreas
];

    description: 'Suburban area with racecourse and shopping facilities',
    coordinates: { lat: -36.9087, lng: 174.8109 },
    distanceToAirport: 13,
    estimatedPrice: 85,
    estimatedTime: '18-22 minutes',
    landmarks: ['Ellerslie Racecourse', 'Ladies Mile', 'Ellerslie Town Centre'],
    nearbyAreas: ['Greenlane', 'Panmure', 'Mt Wellington']
  },
  {
    slug: 'onehunga',
    name: 'Onehunga',
    region: 'Central Auckland',
    description: 'Historic suburb with port access and shopping strip',
    coordinates: { lat: -36.9262, lng: 174.7847 },
    distanceToAirport: 12,
    estimatedPrice: 80,
    estimatedTime: '15-20 minutes',
    landmarks: ['Onehunga Mall', 'Onehunga Bay', 'Dress-Smart'],
    nearbyAreas: ['Mt Roskill', 'Royal Oak', 'Penrose']
  },
  {
    slug: 'mt-wellington',
    name: 'Mt Wellington',
    region: 'Central Auckland',
    description: 'Industrial and residential area with good transport links',
    coordinates: { lat: -36.9076, lng: 174.8371 },
    distanceToAirport: 11,
    estimatedPrice: 80,
    estimatedTime: '15-20 minutes',
    landmarks: ['Sylvia Park', 'Mt Wellington Highway', 'Stonefields'],
    nearbyAreas: ['Panmure', 'Ellerslie', 'Glen Innes']
  },
  {
    slug: 'panmure',
    name: 'Panmure',
    region: 'Eastern Suburbs',
    description: 'Growing suburb with train station and shopping',
    coordinates: { lat: -36.9069, lng: 174.8518 },
    distanceToAirport: 13,
    estimatedPrice: 85,
    estimatedTime: '17-22 minutes',
    landmarks: ['Panmure Basin', 'Panmure Town Centre', 'Panmure Bridge'],
    nearbyAreas: ['Mt Wellington', 'Pakuranga', 'Glen Innes']
  }
];
