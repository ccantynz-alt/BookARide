// Blog posts — single source of truth for BlogIndex.jsx and BlogPost.jsx.
// Every entry MUST have full `content` (HTML) — the index and the post page
// render from this same array, so a listed post can never 404.
// New posts go through Craig's copy approval before being added here.
export const blogPosts = [
  {
    slug: 'auckland-airport-to-cbd-guide',
    title: 'How to Get from Auckland Airport to CBD: Complete 2024 Guide',
    excerpt: 'Everything you need to know about getting from Auckland Airport to the city center. Compare shuttles, taxis, buses, and rental cars.',
    category: 'Travel Guide',
    author: 'BookaRide Team',
    date: '2024-12-01',
    readTime: '8 min read',
    featured: true,
    content: `
      <h2>Overview</h2>
      <p>Auckland Airport (AKL) is located about 21 kilometers south of Auckland's city center. Getting from the airport to the CBD is straightforward, with several transport options available to suit different budgets and preferences.</p>

      <h2>Transport Options Compared</h2>

      <h3>1. Airport Shuttle (Recommended)</h3>
      <p><strong>Cost:</strong> Get instant quote online</p>
      <p><strong>Time:</strong> 25-35 minutes</p>
      <p><strong>Best for:</strong> Families, groups, travelers with luggage</p>
      <p>Airport shuttles like BookaRide offer door-to-door service at fixed prices. You're picked up from the airport and dropped directly at your accommodation. This is the most convenient option, especially if you have luggage or are traveling with family.</p>

      <h3>2. Taxi/Rideshare</h3>
      <p><strong>Cost:</strong> $70-$120 (variable)</p>
      <p><strong>Time:</strong> 25-40 minutes</p>
      <p><strong>Best for:</strong> Solo travelers, business trips</p>
      <p>Taxis are available outside both terminals. Uber and Ola also operate at Auckland Airport. Note that prices can surge during peak times.</p>

      <h3>3. SkyBus</h3>
      <p><strong>Cost:</strong> $18 (one-way)</p>
      <p><strong>Time:</strong> 45-60 minutes</p>
      <p><strong>Best for:</strong> Budget travelers, solo travelers</p>
      <p>The SkyBus runs every 10-15 minutes between the airport and the city center. It stops at key locations including Britomart and SkyCity.</p>

      <h3>4. Rental Car</h3>
      <p><strong>Cost:</strong> Varies by provider and vehicle</p>
      <p><strong>Best for:</strong> Extended stays, exploring beyond Auckland</p>
      <p>Multiple rental car companies operate at Auckland Airport. However, parking in the CBD can be expensive.</p>

      <h2>Tips for a Smooth Journey</h2>
      <ul>
        <li><strong>Book in advance:</strong> Pre-booking your transfer ensures availability and often better prices</li>
        <li><strong>Allow extra time:</strong> Traffic can be unpredictable, especially during morning and evening rush hours</li>
        <li><strong>Consider your luggage:</strong> Shuttles and taxis are better if you have multiple bags</li>
        <li><strong>Check for deals:</strong> Many shuttle services offer discounts for round-trip bookings</li>
      </ul>

      <h2>Why Choose a Shuttle?</h2>
      <p>For most travelers, an airport shuttle offers the best balance of convenience, comfort, and value. With fixed pricing, you know exactly what you'll pay - no surprises. Plus, door-to-door service means no dragging luggage through bus stations or train platforms.</p>

      <h2>Book Your Auckland Airport Transfer</h2>
      <p>Ready to book? BookaRide offers 24/7 airport transfers across Auckland with fixed pricing and professional drivers. Book online in minutes and have your ride confirmed before you land.</p>
    `,
  },
  {
    slug: 'auckland-airport-terminal-guide',
    title: 'Auckland Airport Terminal Guide: Domestic vs International',
    excerpt: 'Navigate Auckland Airport like a pro. Everything about domestic and international terminals, transfers, and facilities.',
    category: 'Airport Info',
    author: 'BookaRide Team',
    date: '2024-11-28',
    readTime: '6 min read',
    featured: true,
    content: `
      <h2>Auckland Airport Layout</h2>
      <p>Auckland Airport has two main terminals: the International Terminal and the Domestic Terminal. While they're connected, understanding the layout helps you navigate more efficiently.</p>

      <h2>International Terminal</h2>
      <p>The International Terminal handles all overseas flights. It features:</p>
      <ul>
        <li>Check-in counters for all international airlines</li>
        <li>Customs and biosecurity</li>
        <li>Duty-free shopping</li>
        <li>Currency exchange</li>
        <li>Multiple dining options</li>
        <li>Premium lounges</li>
      </ul>

      <h2>Domestic Terminal</h2>
      <p>The Domestic Terminal serves flights within New Zealand. Key features:</p>
      <ul>
        <li>Air New Zealand regional services</li>
        <li>Jetstar domestic flights</li>
        <li>Regional airlines</li>
        <li>Cafés and quick-service restaurants</li>
      </ul>

      <h2>Getting Between Terminals</h2>
      <p>The terminals are about a 10-minute walk apart. A free shuttle bus also runs between them every 5-10 minutes. If you have a connecting flight between domestic and international, allow at least 2 hours for the transfer.</p>

      <h2>Shuttle Pickup Points</h2>
      <p><strong>International Terminal:</strong> Door 8 on the ground floor (arrivals level)</p>
      <p><strong>Domestic Terminal:</strong> Outside the main entrance</p>
      <p>BookaRide drivers will meet you at these designated pickup points with a name sign.</p>
    `,
  },
];
