const { DEST_IDS, USER_IDS, ACTIVITY_IDS, HOTEL_IDS, TRIP_IDS } = require('../ids');

const DRAFT_TTL = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

module.exports = [
  {
    _id: TRIP_IDS.amsterdam_weekend_james,
    userId: USER_IDS.james,
    title: 'Amsterdam Long Weekend',
    status: 'planned',
    startDate: new Date('2026-07-10'),
    endDate: new Date('2026-07-13'),
    budget: { total: 900, currency: 'EUR' },
    travelers: { count: 1, type: 'solo' },
    destinations: [{ destinationId: DEST_IDS.amsterdam_centrum, arrivalDate: new Date('2026-07-10'), departureDate: new Date('2026-07-13') }],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-07-10'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.hotel_v, time: '15:00', notes: 'Check in' },
          { type: 'activity', refId: ACTIVITY_IDS.canal_boat_tour, time: '17:00', duration: 1.5, notes: 'Evening canal cruise' },
        ],
      },
      {
        dayNumber: 2, date: new Date('2026-07-11'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.rijksmuseum, time: '09:30', duration: 3 },
          { type: 'activity', refId: ACTIVITY_IDS.van_gogh_museum, time: '14:30', duration: 2.5 },
        ],
      },
      {
        dayNumber: 3, date: new Date('2026-07-12'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.anne_frank_house, time: '09:00', duration: 1.5, notes: 'Pre-book tickets' },
          { type: 'activity', refId: ACTIVITY_IDS.vondelpark_cycling, time: '11:30', duration: 2 },
        ],
      },
      {
        dayNumber: 4, date: new Date('2026-07-13'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.albert_cuyp_market, time: '10:00', duration: 2, notes: 'Pick up stroopwafels' },
        ],
      },
    ],
    chatHistory: [
      { role: 'user', content: 'Can you recommend the best order to visit Amsterdam museums to avoid peak crowds?' },
      { role: 'assistant', content: 'For the Rijksmuseum, arrive at opening (09:00) on a weekday. Book Van Gogh Museum slots 2 weeks ahead for your preferred time. Anne Frank House sells out fastest — secure 09:00 entry online as soon as your dates are confirmed.' },
    ],
  },
  {
    _id: TRIP_IDS.nl_grand_tour_emma,
    userId: USER_IDS.emma,
    title: 'Netherlands Grand Tour — 10 Days',
    status: 'planned',
    startDate: new Date('2026-08-15'),
    endDate: new Date('2026-08-24'),
    budget: { total: 2400, currency: 'EUR' },
    travelers: { count: 2, type: 'couple' },
    destinations: [
      { destinationId: DEST_IDS.amsterdam_centrum, arrivalDate: new Date('2026-08-15'), departureDate: new Date('2026-08-18') },
      { destinationId: DEST_IDS.rotterdam_centrum, arrivalDate: new Date('2026-08-18'), departureDate: new Date('2026-08-20') },
      { destinationId: DEST_IDS.maastricht, arrivalDate: new Date('2026-08-20'), departureDate: new Date('2026-08-22') },
      { destinationId: DEST_IDS.the_hague, arrivalDate: new Date('2026-08-22'), departureDate: new Date('2026-08-24') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-08-15'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.kimpton_de_witt, time: '14:00', notes: 'Check in — 3 nights' },
          { type: 'activity', refId: ACTIVITY_IDS.canal_boat_tour, time: '17:00', duration: 1.5 },
        ],
      },
      {
        dayNumber: 2, date: new Date('2026-08-16'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.rijksmuseum, time: '09:30', duration: 3 },
          { type: 'activity', refId: ACTIVITY_IDS.stedelijk_museum, time: '14:00', duration: 2.5 },
        ],
      },
      {
        dayNumber: 3, date: new Date('2026-08-17'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.anne_frank_house, time: '09:00', duration: 1.5 },
          { type: 'activity', refId: ACTIVITY_IDS.rembrandt_house, time: '11:30', duration: 2 },
        ],
      },
      {
        dayNumber: 4, date: new Date('2026-08-18'),
        items: [
          { type: 'transport', time: '10:00', notes: 'Intercity train to Rotterdam (~40 min)' },
          { type: 'hotel', refId: HOTEL_IDS.hotel_new_york, time: '14:00', notes: 'Check in — 2 nights' },
          { type: 'activity', refId: ACTIVITY_IDS.cube_houses, time: '16:00', duration: 1 },
        ],
      },
      {
        dayNumber: 5, date: new Date('2026-08-19'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.markthal_tour, time: '10:00', duration: 2 },
          { type: 'activity', refId: ACTIVITY_IDS.erasmus_bridge, time: '12:30', duration: 1 },
          { type: 'activity', refId: ACTIVITY_IDS.rotterdam_harbour, time: '14:30', duration: 1.5 },
        ],
      },
      {
        dayNumber: 6, date: new Date('2026-08-20'),
        items: [
          { type: 'transport', time: '10:00', notes: 'Train to Maastricht (~2h30m)' },
          { type: 'hotel', refId: HOTEL_IDS.kruisherenhotel, time: '15:00', notes: 'Check in — 2 nights' },
        ],
      },
      {
        dayNumber: 7, date: new Date('2026-08-21'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.maastricht_caves, time: '10:30', duration: 1.5 },
        ],
      },
    ],
    chatHistory: [
      { role: 'user', content: 'Is 10 days enough for Amsterdam, Rotterdam, Maastricht, and The Hague?' },
      { role: 'assistant', content: 'It\'s a comfortable pace — 3 nights Amsterdam, 2 Rotterdam, 2 Maastricht, 2 The Hague gives you full days without rushing. I\'d add day trips: Kinderdijk from Rotterdam and Delft from The Hague fill spare half-days perfectly.' },
    ],
  },
  {
    _id: TRIP_IDS.rotterdam_arch_carlos,
    userId: USER_IDS.carlos,
    title: 'Rotterdam Architecture Weekend',
    status: 'completed',
    startDate: new Date('2026-05-02'),
    endDate: new Date('2026-05-04'),
    budget: { total: 400, currency: 'EUR' },
    travelers: { count: 1, type: 'solo' },
    destinations: [{ destinationId: DEST_IDS.rotterdam_centrum, arrivalDate: new Date('2026-05-02'), departureDate: new Date('2026-05-04') }],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-05-02'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.citizenm_rdam, time: '14:00', notes: 'Check in — 2 nights' },
          { type: 'activity', refId: ACTIVITY_IDS.cube_houses, time: '15:30', duration: 1 },
          { type: 'activity', refId: ACTIVITY_IDS.markthal_tour, time: '17:00', duration: 2 },
        ],
      },
      {
        dayNumber: 2, date: new Date('2026-05-03'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.erasmus_bridge, time: '09:00', duration: 1, notes: 'Golden hour walk' },
          { type: 'activity', refId: ACTIVITY_IDS.rotterdam_harbour, time: '11:00', duration: 1.5 },
          { type: 'activity', refId: ACTIVITY_IDS.maritime_museum_rdam, time: '14:00', duration: 2 },
        ],
      },
    ],
    chatHistory: [],
  },
  {
    _id: TRIP_IDS.tulip_season_sophie,
    userId: USER_IDS.sophie,
    title: 'Tulip Season — Keukenhof & Bollenstreek',
    status: 'completed',
    startDate: new Date('2026-04-18'),
    endDate: new Date('2026-04-21'),
    budget: { total: 1200, currency: 'EUR' },
    travelers: { count: 2, type: 'couple' },
    destinations: [
      { destinationId: DEST_IDS.amsterdam_jordaan, arrivalDate: new Date('2026-04-18'), departureDate: new Date('2026-04-21') },
      { destinationId: DEST_IDS.keukenhof, arrivalDate: new Date('2026-04-19'), departureDate: new Date('2026-04-19') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-04-18'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.pulitzer, time: '14:00', notes: 'Canal-view room requested' },
        ],
      },
      {
        dayNumber: 2, date: new Date('2026-04-19'),
        items: [
          { type: 'transport', time: '08:30', notes: 'Coach to Keukenhof (~1h from Amsterdam)' },
          { type: 'activity', refId: ACTIVITY_IDS.keukenhof_gardens, time: '09:30', duration: 4, notes: 'Full morning — arrive early to beat crowds' },
          { type: 'transport', time: '14:00', notes: 'Cycle through the Bollenstreek bulb fields back toward Lisse station' },
        ],
      },
      {
        dayNumber: 3, date: new Date('2026-04-20'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.anne_frank_house, time: '10:00', duration: 1.5 },
          { type: 'activity', refId: ACTIVITY_IDS.vondelpark_cycling, time: '12:00', duration: 2 },
        ],
      },
    ],
    chatHistory: [
      { role: 'user', content: 'Is late April good for Keukenhof tulips or is it past peak?' },
      { role: 'assistant', content: 'Late April is excellent — generally peak for tulips, which bloom after hyacinths (early April). The park is open until May 14, and mid-to-late April typically has the most diverse blooms across all varieties. Book the park ticket and coach transfer in advance.' },
    ],
  },
  {
    _id: TRIP_IDS.maastricht_getaway_marco,
    userId: USER_IDS.marco,
    title: 'Burgundian Maastricht Food Trip',
    status: 'planned',
    startDate: new Date('2026-09-12'),
    endDate: new Date('2026-09-15'),
    budget: { total: 1100, currency: 'EUR' },
    travelers: { count: 2, type: 'couple' },
    destinations: [{ destinationId: DEST_IDS.maastricht, arrivalDate: new Date('2026-09-12'), departureDate: new Date('2026-09-15') }],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-09-12'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.kruisherenhotel, time: '14:00' },
        ],
      },
      {
        dayNumber: 2, date: new Date('2026-09-13'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.maastricht_caves, time: '10:00' },
        ],
      },
      {
        dayNumber: 3, date: new Date('2026-09-14'),
        items: [
          { type: 'transport', time: '13:00', notes: 'Walk to Limburg wine region (short taxi)' },
        ],
      },
    ],
    chatHistory: [
      { role: 'user', content: 'What is zuurvlees and should I try it in Maastricht?' },
      { role: 'assistant', content: 'Zuurvlees is a traditional Limburg dish of horse meat (or sometimes beef) slow-braised with vinegar, juniper berries, and spices — a sweet-sour stew served with frites. It\'s an essential regional speciality, best tried at a traditional eetcafé on the Vrijthof.' },
    ],
  },
  {
    _id: TRIP_IDS.amsterdam_draft_priya,
    userId: USER_IDS.priya,
    title: 'Amsterdam Cultural Immersion — Draft',
    status: 'draft',
    budget: { total: 1500, currency: 'EUR' },
    travelers: { count: 2, type: 'couple' },
    destinations: [
      { destinationId: DEST_IDS.amsterdam_centrum },
      { destinationId: DEST_IDS.leiden },
      { destinationId: DEST_IDS.delft },
    ],
    itinerary: [],
    chatHistory: [
      { role: 'user', content: 'I want to combine Amsterdam with Leiden and Delft — Rembrandt connections. How many days?' },
      { role: 'assistant', content: 'Three days works well: Amsterdam day 1 (Rembrandt House, Rijksmuseum), Leiden day 2 (Rembrandt\'s birthplace area, Hortus Botanicus, National Museum of Antiquities), Delft day 3 (Vermeer Centre, Delftware factories, New Church). All three are within 30-45 minutes of each other by train.' },
    ],
    draftExpiresAt: DRAFT_TTL,
  },
  {
    _id: TRIP_IDS.family_trip_fatima,
    userId: USER_IDS.fatima,
    title: 'Family Netherlands Holiday',
    status: 'planned',
    startDate: new Date('2026-07-25'),
    endDate: new Date('2026-08-01'),
    budget: { total: 3200, currency: 'EUR' },
    travelers: { count: 4, type: 'family' },
    destinations: [
      { destinationId: DEST_IDS.amsterdam_centrum, arrivalDate: new Date('2026-07-25'), departureDate: new Date('2026-07-28') },
      { destinationId: DEST_IDS.the_hague, arrivalDate: new Date('2026-07-28'), departureDate: new Date('2026-07-31') },
      { destinationId: DEST_IDS.giethoorn, arrivalDate: new Date('2026-07-31'), departureDate: new Date('2026-08-01') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-07-25'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.citizenm_ams, time: '14:00', notes: 'Family connecting rooms requested' },
          { type: 'activity', refId: ACTIVITY_IDS.canal_boat_tour, time: '17:00', notes: 'Kids will love the canal cruise' },
        ],
      },
      {
        dayNumber: 2, date: new Date('2026-07-26'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.nemo_science, time: '10:00', duration: 3, notes: 'Best family activity in Amsterdam' },
        ],
      },
      {
        dayNumber: 4, date: new Date('2026-07-28'),
        items: [
          { type: 'transport', time: '10:00', notes: 'Train to The Hague (~50 min)' },
          { type: 'hotel', refId: HOTEL_IDS.boutique_corona, time: '14:00' },
          { type: 'activity', refId: ACTIVITY_IDS.madurodam, time: '15:30', duration: 2.5, notes: 'Kids\' highlight of the trip' },
        ],
      },
      {
        dayNumber: 7, date: new Date('2026-07-31'),
        items: [
          { type: 'transport', time: '09:00', notes: 'Car rental for Giethoorn (2h drive)' },
          { type: 'activity', refId: ACTIVITY_IDS.giethoorn_boat, time: '12:00', notes: 'Self-drive whisper boat' },
        ],
      },
    ],
    chatHistory: [
      { role: 'user', content: 'Is Giethoorn safe with children under 8 on the boats?' },
      { role: 'assistant', content: 'Yes — the electric whisper boats are very stable and slow-moving. Children must wear life jackets (provided). Guided tour boats are even safer if you\'d prefer not to self-drive. Early morning (09:00-11:00) is quietest with fewer boats on the narrow canals.' },
    ],
  },
  {
    _id: TRIP_IDS.cycling_tour_lars,
    userId: USER_IDS.lars,
    title: 'Netherlands Cycling Tour — Coast to Coast',
    status: 'planned',
    startDate: new Date('2026-06-20'),
    endDate: new Date('2026-06-27'),
    budget: { total: 1400, currency: 'EUR' },
    travelers: { count: 1, type: 'solo' },
    destinations: [
      { destinationId: DEST_IDS.texel, arrivalDate: new Date('2026-06-20'), departureDate: new Date('2026-06-22') },
      { destinationId: DEST_IDS.alkmaar, arrivalDate: new Date('2026-06-22'), departureDate: new Date('2026-06-23') },
      { destinationId: DEST_IDS.haarlem, arrivalDate: new Date('2026-06-23'), departureDate: new Date('2026-06-25') },
      { destinationId: DEST_IDS.kinderdijk, arrivalDate: new Date('2026-06-25'), departureDate: new Date('2026-06-26') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-06-20'),
        items: [
          { type: 'transport', time: '08:00', notes: 'Ferry Den Helder → Texel (20 min)' },
          { type: 'activity', refId: ACTIVITY_IDS.texel_cycling, time: '10:00', duration: 4, notes: 'Northern dune route via De Cocksdorp' },
        ],
      },
      {
        dayNumber: 3, date: new Date('2026-06-22'),
        items: [
          { type: 'transport', time: '09:00', notes: 'Ferry Texel → Den Helder, train to Alkmaar' },
          { type: 'activity', refId: ACTIVITY_IDS.alkmaar_cheese, time: '10:00', notes: 'Friday cheese market!' },
          { type: 'hotel', refId: HOTEL_IDS.amadeus_haarlem, time: '15:00', notes: 'Cycle Alkmaar to Haarlem (30 km)' },
        ],
      },
      {
        dayNumber: 6, date: new Date('2026-06-25'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.kinderdijk_walk, time: '09:30', duration: 2 },
        ],
      },
    ],
    chatHistory: [],
  },
  {
    _id: TRIP_IDS.luxury_ams_mohammed,
    userId: USER_IDS.mohammed,
    title: 'Luxury Amsterdam & Maastricht',
    status: 'planned',
    startDate: new Date('2026-10-05'),
    endDate: new Date('2026-10-11'),
    budget: { total: 6000, currency: 'EUR' },
    travelers: { count: 2, type: 'couple' },
    destinations: [
      { destinationId: DEST_IDS.amsterdam_jordaan, arrivalDate: new Date('2026-10-05'), departureDate: new Date('2026-10-08') },
      { destinationId: DEST_IDS.maastricht, arrivalDate: new Date('2026-10-08'), departureDate: new Date('2026-10-11') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-10-05'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.the_dylan, time: '14:00', notes: 'Canal suite — Keizersgracht view' },
        ],
      },
      {
        dayNumber: 2, date: new Date('2026-10-06'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.rijksmuseum, time: '09:30', duration: 3, notes: 'Private guided tour booked' },
          { type: 'activity', refId: ACTIVITY_IDS.van_gogh_museum, time: '14:00', duration: 2.5 },
        ],
      },
      {
        dayNumber: 4, date: new Date('2026-10-08'),
        items: [
          { type: 'transport', time: '10:00', notes: 'First-class Thalys to Maastricht (~2h30m)' },
          { type: 'hotel', refId: HOTEL_IDS.kruisherenhotel, time: '14:00', notes: 'Chapel suite' },
        ],
      },
    ],
    chatHistory: [
      { role: 'user', content: 'Are there halal fine dining options in Amsterdam comparable to Michelin level?' },
      { role: 'assistant', content: 'The fine dining scene in Amsterdam is not broadly halal-certified, but Bazar Rotterdam and Tempo Doeloe offer excellent halal options. For Amsterdam, I recommend contacting Restaurant Rijks directly — they accommodate halal dietary requirements with advance notice and their kitchen is very accommodating.' },
    ],
  },
  {
    _id: TRIP_IDS.budget_nl_anna,
    userId: USER_IDS.anna,
    title: 'Budget Backpacker Netherlands',
    status: 'active',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-14'),
    budget: { total: 700, currency: 'EUR' },
    travelers: { count: 1, type: 'solo' },
    destinations: [
      { destinationId: DEST_IDS.amsterdam_centrum, arrivalDate: new Date('2026-06-01'), departureDate: new Date('2026-06-05') },
      { destinationId: DEST_IDS.rotterdam_centrum, arrivalDate: new Date('2026-06-05'), departureDate: new Date('2026-06-07') },
      { destinationId: DEST_IDS.utrecht, arrivalDate: new Date('2026-06-07'), departureDate: new Date('2026-06-09') },
      { destinationId: DEST_IDS.groningen, arrivalDate: new Date('2026-06-09'), departureDate: new Date('2026-06-11') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-06-01'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.generator_ams, time: '14:00', notes: '4-bed dorm' },
          { type: 'activity', refId: ACTIVITY_IDS.vondelpark_cycling, time: '16:00', notes: 'Free bike loan from hostel' },
        ],
      },
      {
        dayNumber: 2, date: new Date('2026-06-02'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.albert_cuyp_market, time: '10:00', notes: 'Free and delicious street snacks' },
          { type: 'activity', refId: ACTIVITY_IDS.canal_boat_tour, time: '17:00' },
        ],
      },
    ],
    chatHistory: [
      { role: 'user', content: 'What is the cheapest way to get around between Dutch cities?' },
      { role: 'assistant', content: 'The OV-chipkaart is your best friend — a reusable transport card valid on all Dutch trains, buses, trams, and metros. Buy one at any train station for €7.50 (reusable), top up as needed. A single Amsterdam–Rotterdam intercity trip costs ~€6 off-peak. Consider a "Dal Vrij" unlimited off-peak day pass (~€35) if you\'re doing multiple cities in one day.' },
    ],
  },
  {
    _id: TRIP_IDS.art_trip_hiroshi,
    userId: USER_IDS.hiroshi,
    title: 'Dutch Masters Art Pilgrimage',
    status: 'planned',
    startDate: new Date('2026-09-20'),
    endDate: new Date('2026-09-26'),
    budget: { total: 2000, currency: 'EUR' },
    travelers: { count: 1, type: 'solo' },
    destinations: [
      { destinationId: DEST_IDS.amsterdam_centrum, arrivalDate: new Date('2026-09-20'), departureDate: new Date('2026-09-23') },
      { destinationId: DEST_IDS.delft, arrivalDate: new Date('2026-09-23'), departureDate: new Date('2026-09-24') },
      { destinationId: DEST_IDS.leiden, arrivalDate: new Date('2026-09-24'), departureDate: new Date('2026-09-25') },
      { destinationId: DEST_IDS.the_hague, arrivalDate: new Date('2026-09-25'), departureDate: new Date('2026-09-26') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-09-20'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.hotel_brouwer, time: '14:00', notes: 'Rembrandt-era canal house hotel' },
          { type: 'activity', refId: ACTIVITY_IDS.rijksmuseum, time: '16:00', notes: 'Late afternoon — fewer crowds' },
        ],
      },
      {
        dayNumber: 2, date: new Date('2026-09-21'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.rembrandt_house, time: '10:00' },
          { type: 'activity', refId: ACTIVITY_IDS.stedelijk_museum, time: '13:30' },
        ],
      },
      {
        dayNumber: 4, date: new Date('2026-09-23'),
        items: [
          { type: 'transport', time: '09:00', notes: 'Train to Delft (45 min via The Hague)' },
        ],
      },
      {
        dayNumber: 6, date: new Date('2026-09-25'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.mauritshuis, time: '10:00', notes: 'Girl with the Pearl Earring — Hiroshi\'s highlight' },
        ],
      },
    ],
    chatHistory: [],
  },
  {
    _id: TRIP_IDS.museum_amelia,
    userId: USER_IDS.amelia,
    title: 'Amsterdam & Haarlem Museum Break',
    status: 'completed',
    startDate: new Date('2026-04-04'),
    endDate: new Date('2026-04-07'),
    budget: { total: 800, currency: 'EUR' },
    travelers: { count: 1, type: 'solo' },
    destinations: [
      { destinationId: DEST_IDS.amsterdam_centrum, arrivalDate: new Date('2026-04-04'), departureDate: new Date('2026-04-06') },
      { destinationId: DEST_IDS.haarlem, arrivalDate: new Date('2026-04-06'), departureDate: new Date('2026-04-07') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-04-04'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.citizenm_ams, time: '14:00' },
          { type: 'activity', refId: ACTIVITY_IDS.van_gogh_museum, time: '16:00' },
        ],
      },
      {
        dayNumber: 2, date: new Date('2026-04-05'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.rijksmuseum, time: '09:30' },
          { type: 'activity', refId: ACTIVITY_IDS.anne_frank_house, time: '14:00' },
        ],
      },
      {
        dayNumber: 3, date: new Date('2026-04-06'),
        items: [
          { type: 'transport', time: '10:30', notes: 'Train to Haarlem (20 min)' },
          { type: 'hotel', refId: HOTEL_IDS.amadeus_haarlem, time: '13:00', notes: 'Grote Markt view room' },
        ],
      },
    ],
    chatHistory: [],
  },
  {
    _id: TRIP_IDS.business_thomas,
    userId: USER_IDS.thomas,
    title: 'Amsterdam Business + Weekend Leisure',
    status: 'planned',
    startDate: new Date('2026-08-03'),
    endDate: new Date('2026-08-07'),
    budget: { total: 1800, currency: 'EUR' },
    travelers: { count: 1, type: 'business' },
    destinations: [{ destinationId: DEST_IDS.amsterdam_centrum, arrivalDate: new Date('2026-08-03'), departureDate: new Date('2026-08-07') }],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-08-03'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.kimpton_de_witt, time: '12:00', notes: '4 nights corporate rate' },
        ],
      },
      {
        dayNumber: 3, date: new Date('2026-08-05'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.rijksmuseum, time: '10:00', notes: 'Weekend leisure' },
        ],
      },
      {
        dayNumber: 4, date: new Date('2026-08-06'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.canal_boat_tour, time: '14:00' },
        ],
      },
    ],
    chatHistory: [],
  },
  {
    _id: TRIP_IDS.honeymoon_yuki,
    userId: USER_IDS.yuki,
    title: 'Honeymoon — Netherlands Romantic Tour',
    status: 'planned',
    startDate: new Date('2026-11-01'),
    endDate: new Date('2026-11-08'),
    budget: { total: 4500, currency: 'EUR' },
    travelers: { count: 2, type: 'couple' },
    destinations: [
      { destinationId: DEST_IDS.amsterdam_jordaan, arrivalDate: new Date('2026-11-01'), departureDate: new Date('2026-11-04') },
      { destinationId: DEST_IDS.giethoorn, arrivalDate: new Date('2026-11-04'), departureDate: new Date('2026-11-06') },
      { destinationId: DEST_IDS.maastricht, arrivalDate: new Date('2026-11-06'), departureDate: new Date('2026-11-08') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-11-01'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.pulitzer, time: '14:00', notes: 'Canal-view room, honeymoon package' },
          { type: 'activity', refId: ACTIVITY_IDS.canal_boat_tour, time: '16:30', notes: 'Private evening canal cruise' },
        ],
      },
      {
        dayNumber: 4, date: new Date('2026-11-04'),
        items: [
          { type: 'transport', time: '09:00', notes: 'Car to Giethoorn (1h30m)' },
          { type: 'activity', refId: ACTIVITY_IDS.giethoorn_boat, time: '12:00', notes: 'Private skipper for 3 hours' },
        ],
      },
    ],
    chatHistory: [
      { role: 'user', content: 'Is November a good time for a honeymoon in the Netherlands?' },
      { role: 'assistant', content: 'November is off-peak and atmospheric — fewer crowds, golden light, and cosy brown cafes. Giethoorn is enchanting in mist. Bring waterproofs — expect rain. The Maastricht Christmas market opens late November and is one of the most romantic in Europe. Hotels often offer excellent off-season rates on honeymoon packages.' },
    ],
  },
  {
    _id: TRIP_IDS.food_tour_david,
    userId: USER_IDS.david,
    title: 'Dutch Food Scene Deep Dive',
    status: 'planned',
    startDate: new Date('2026-07-17'),
    endDate: new Date('2026-07-22'),
    budget: { total: 1600, currency: 'EUR' },
    travelers: { count: 1, type: 'solo' },
    destinations: [
      { destinationId: DEST_IDS.amsterdam_centrum, arrivalDate: new Date('2026-07-17'), departureDate: new Date('2026-07-19') },
      { destinationId: DEST_IDS.rotterdam_centrum, arrivalDate: new Date('2026-07-19'), departureDate: new Date('2026-07-21') },
      { destinationId: DEST_IDS.the_hague, arrivalDate: new Date('2026-07-21'), departureDate: new Date('2026-07-22') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-07-17'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.hotel_v, time: '13:00' },
        ],
      },
      {
        dayNumber: 2, date: new Date('2026-07-18'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.albert_cuyp_market, time: '09:30', notes: 'Haring, stroopwafels, kaas' },
        ],
      },
      {
        dayNumber: 3, date: new Date('2026-07-19'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.markthal_tour, time: '10:00', notes: 'Rotterdam Markthal' },
        ],
      },
    ],
    chatHistory: [],
  },
  {
    _id: TRIP_IDS.wellness_ingrid,
    userId: USER_IDS.ingrid,
    title: 'Nature & Wellness — Texel & Giethoorn',
    status: 'planned',
    startDate: new Date('2026-06-13'),
    endDate: new Date('2026-06-17'),
    budget: { total: 1100, currency: 'EUR' },
    travelers: { count: 2, type: 'couple' },
    destinations: [
      { destinationId: DEST_IDS.texel, arrivalDate: new Date('2026-06-13'), departureDate: new Date('2026-06-15') },
      { destinationId: DEST_IDS.giethoorn, arrivalDate: new Date('2026-06-15'), departureDate: new Date('2026-06-17') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-06-13'),
        items: [
          { type: 'transport', time: '08:00', notes: 'Train to Den Helder, ferry to Texel' },
          { type: 'activity', refId: ACTIVITY_IDS.texel_cycling, time: '12:00', notes: 'Gentle route to De Slufter seal beach' },
        ],
      },
      {
        dayNumber: 3, date: new Date('2026-06-15'),
        items: [
          { type: 'transport', time: '09:00', notes: 'Ferry back, car hire to Giethoorn (2h)' },
          { type: 'activity', refId: ACTIVITY_IDS.giethoorn_boat, time: '14:00', notes: 'Afternoon whisper boat' },
        ],
      },
    ],
    chatHistory: [],
  },
  {
    _id: TRIP_IDS.photography_sarah,
    userId: USER_IDS.sarah,
    title: 'Photography Trip — Windmills & Waterways',
    status: 'draft',
    budget: { total: 900, currency: 'EUR' },
    travelers: { count: 1, type: 'solo' },
    destinations: [
      { destinationId: DEST_IDS.zaanse_schans },
      { destinationId: DEST_IDS.kinderdijk },
      { destinationId: DEST_IDS.giethoorn },
    ],
    itinerary: [],
    chatHistory: [
      { role: 'user', content: 'What time of day is best to photograph Kinderdijk windmills?' },
      { role: 'assistant', content: 'Golden hour (1 hour after sunrise) is magical — the low light glows on the mill sails and reflects perfectly in the still canal water. The site opens at 09:00, so arrive at the car park by 08:30 in summer to catch the last of the early light. Evening (18:00-19:30) is the second-best option with fewer visitors.' },
    ],
    draftExpiresAt: DRAFT_TTL,
  },
  {
    _id: TRIP_IDS.solo_isabella,
    userId: USER_IDS.isabella,
    title: 'Solo Adventure — Texel to Groningen',
    status: 'planned',
    startDate: new Date('2026-08-08'),
    endDate: new Date('2026-08-15'),
    budget: { total: 1200, currency: 'EUR' },
    travelers: { count: 1, type: 'solo' },
    destinations: [
      { destinationId: DEST_IDS.texel, arrivalDate: new Date('2026-08-08'), departureDate: new Date('2026-08-10') },
      { destinationId: DEST_IDS.groningen, arrivalDate: new Date('2026-08-10'), departureDate: new Date('2026-08-13') },
      { destinationId: DEST_IDS.nijmegen, arrivalDate: new Date('2026-08-13'), departureDate: new Date('2026-08-15') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-08-08'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.texel_cycling, time: '11:00', notes: 'Southern route via Ecomare' },
        ],
      },
      {
        dayNumber: 3, date: new Date('2026-08-10'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.prinsenhof_gron, time: '14:00' },
        ],
      },
    ],
    chatHistory: [],
  },
  {
    _id: TRIP_IDS.local_sven,
    userId: USER_IDS.sven,
    title: 'Dutch Design & Tech Tour — Eindhoven & Rotterdam',
    status: 'completed',
    startDate: new Date('2026-10-17'),
    endDate: new Date('2026-10-20'),
    budget: { total: 600, currency: 'EUR' },
    travelers: { count: 1, type: 'solo' },
    destinations: [
      { destinationId: DEST_IDS.eindhoven, arrivalDate: new Date('2026-10-17'), departureDate: new Date('2026-10-19') },
      { destinationId: DEST_IDS.rotterdam_centrum, arrivalDate: new Date('2026-10-19'), departureDate: new Date('2026-10-20') },
    ],
    itinerary: [
      {
        dayNumber: 1, date: new Date('2026-10-17'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.vdv_eindhoven, time: '13:00', notes: 'During Dutch Design Week' },
        ],
      },
      {
        dayNumber: 3, date: new Date('2026-10-19'),
        items: [
          { type: 'hotel', refId: HOTEL_IDS.nhow_rotterdam, time: '13:00' },
          { type: 'activity', refId: ACTIVITY_IDS.markthal_tour, time: '15:00' },
        ],
      },
    ],
    chatHistory: [],
  },
  {
    _id: TRIP_IDS.ams_completed_alice,
    userId: USER_IDS.alice,
    title: 'Home City Weekend — Jordaan & De Pijp',
    status: 'completed',
    startDate: new Date('2026-05-16'),
    endDate: new Date('2026-05-18'),
    budget: { total: 300, currency: 'EUR' },
    travelers: { count: 2, type: 'couple' },
    destinations: [
      { destinationId: DEST_IDS.amsterdam_jordaan, arrivalDate: new Date('2026-05-16'), departureDate: new Date('2026-05-17') },
      { destinationId: DEST_IDS.amsterdam_de_pijp, arrivalDate: new Date('2026-05-17'), departureDate: new Date('2026-05-18') },
    ],
    itinerary: [
      {
        dayNumber: 2, date: new Date('2026-05-17'),
        items: [
          { type: 'activity', refId: ACTIVITY_IDS.albert_cuyp_market, time: '10:00' },
          { type: 'activity', refId: ACTIVITY_IDS.heineken_experience, time: '14:00' },
        ],
      },
    ],
    chatHistory: [],
  },
];
