// Site Configuration
// This file controls branding for different domains

const configs = {
  'bookaride.co.nz': {
    siteName: 'Book A Ride NZ',
    domain: 'bookaride.co.nz',
    maintenanceMode: true,  // Set to false when ready to accept bookings
    siteUrl: 'https://bookaride.co.nz',
    email: 'info@bookaride.co.nz',
    phone: '', // Removed - encourage online booking instead
    tagline: 'Airport Shuttles & Private Transfers Across New Zealand',
    description: 'Professional airport shuttle service in Auckland, Hamilton, and Whangarei. Book online for instant confirmation.',
    keywords: 'airport shuttle, Auckland airport transfer, private shuttle, airport transport',
    address: 'Auckland, New Zealand',
    // Logo and assets
    logo: '/logo.png',
    favicon: '/favicon.svg',
    // Brand colors (optional - using Tailwind classes)
    primaryColor: 'gold',
    // Social media
    facebook: '',
    instagram: '',
    twitter: '',
  },
  
  'bookaridenz.com': {
    siteName: 'Book A Ride New Zealand',
    domain: 'bookaridenz.com',
    siteUrl: 'https://bookaridenz.com',
    email: 'international@bookaridenz.com',
    phone: '', // Removed - encourage online booking instead
    tagline: 'New Zealand Airport Transfers for International Travelers',
    description: 'Premium airport shuttle service across New Zealand. Serving international visitors with transfers in Auckland, Hamilton, Whangarei, and beyond. Multi-currency payments accepted.',
    keywords: 'New Zealand airport transfer, Auckland airport shuttle international, NZ airport transport, New Zealand taxi service, airport pickup Auckland, New Zealand travel transport',
    address: 'Auckland, New Zealand',
    // International-focused
    isInternational: true,
    currenciesAccepted: ['NZD', 'USD', 'AUD', 'GBP', 'EUR', 'CNY', 'JPY'],
    languagesSupported: ['English', 'Chinese', 'Japanese', 'Korean', 'Spanish', 'French'],
    // Logo and assets
    logo: '/logo.png',
    favicon: '/favicon.svg',
    // Brand colors
    primaryColor: 'gold',
    // Social media
    facebook: '',
    instagram: '',
    twitter: '',
  }
};

// Detect current domain and return appropriate config
const getCurrentDomain = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Check exact matches first
    if (configs[hostname]) {
      return hostname;
    }
    
    // Check if it includes known domains
    for (const domain in configs) {
      if (hostname.includes(domain.split('.')[0])) {
        return domain;
      }
    }
  }
  
  // Default to bookaride.co.nz for localhost and unknown domains
  return 'bookaride.co.nz';
};

// Get site configuration based on current domain
export const getSiteConfig = () => {
  const domain = getCurrentDomain();
  return configs[domain];
};

// Export default config
export default getSiteConfig();
