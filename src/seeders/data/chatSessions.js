const { USER_IDS, DEST_IDS, ACTIVITY_IDS, HOTEL_IDS, RESTAURANT_IDS, TRIP_IDS } = require('../ids');

module.exports = [
  {
    userId: USER_IDS.james,
    tripId: TRIP_IDS.amsterdam_weekend_james,
    messages: [
      { role: 'user', content: 'I have 4 days in Amsterdam in July. What should I prioritise?', timestamp: new Date('2026-06-15T10:00:00Z') },
      { role: 'assistant', content: 'July is peak season — pre-book everything. Top priorities: Rijksmuseum (morning, first slot), Van Gogh Museum (pre-book a specific time slot), Anne Frank House (online only, sells out weeks ahead). Fill afternoons with the canal boat tour and a Vondelpark cycle. For evenings, De Pijp neighbourhood has the best restaurant density.', timestamp: new Date('2026-06-15T10:00:08Z') },
      { role: 'user', content: 'Are Amsterdam museums worth the entry price?', timestamp: new Date('2026-06-15T10:02:00Z') },
      { role: 'assistant', content: 'Yes — especially the Rijksmuseum (€22.50) and Van Gogh Museum (€22). The Anne Frank House (€16) is more compact but deeply moving. Consider the Amsterdam City Card if you\'re doing 4+ paid attractions — it includes unlimited public transport and pays for itself quickly.', timestamp: new Date('2026-06-15T10:02:06Z') },
      { role: 'user', content: 'Best neighbourhood for first-time visitors to stay?', timestamp: new Date('2026-06-15T10:05:00Z') },
      { role: 'assistant', content: 'The Jordaan or Centrum give you walkability to everything. De Pijp is excellent if you want a more local feel — tram connections are fast to the museums. Avoid staying near Leidseplein if noise is a concern — it\'s very lively at night.', timestamp: new Date('2026-06-15T10:05:09Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'destinations', refId: DEST_IDS.amsterdam_centrum, score: 0.94, snippet: 'Amsterdam Historic Centre — canals, museums, cycling' },
        { entityType: 'destinations', refId: DEST_IDS.amsterdam_jordaan, score: 0.89, snippet: 'Amsterdam Jordaan — boutiques, cafes, Anne Frank House' },
        { entityType: 'hotels', refId: HOTEL_IDS.hotel_v, score: 0.82, snippet: 'Hotel V Nesplein — 4-star boutique near Spui' },
      ],
      preferencesSnapshot: { destinations: ['Netherlands'], travelStyle: 'adventure', budget: 'mid' },
    },
  },
  {
    userId: USER_IDS.emma,
    tripId: TRIP_IDS.nl_grand_tour_emma,
    messages: [
      { role: 'user', content: 'I want to do a 10-day Netherlands grand tour with my partner. Is that enough time?', timestamp: new Date('2026-07-01T09:00:00Z') },
      { role: 'assistant', content: '10 days is perfect for a well-paced grand tour. I suggest: Amsterdam (3 nights), Rotterdam (2 nights), Maastricht (2 nights), The Hague (2 nights). That gives you full days without the fatigue of constant moving. Add Delft as a half-day from The Hague and Kinderdijk as a half-day from Rotterdam.', timestamp: new Date('2026-07-01T09:00:10Z') },
      { role: 'user', content: 'What is unique about Rotterdam compared to Amsterdam?', timestamp: new Date('2026-07-01T09:03:00Z') },
      { role: 'assistant', content: 'Rotterdam is the Netherlands\' antithesis to Amsterdam. Where Amsterdam is beautifully preserved Golden Age, Rotterdam was bombed flat in WWII and rebuilt as Europe\'s most ambitious modern architecture showcase — Renzo Piano, Rem Koolhaas, MVRDV. It\'s grittier, more international, and most Dutch people consider it the most exciting city in the country right now.', timestamp: new Date('2026-07-01T09:03:08Z') },
      { role: 'user', content: 'Is August a good time to visit?', timestamp: new Date('2026-07-01T09:06:00Z') },
      { role: 'assistant', content: 'August is the peak of Dutch summer — warm (18–23°C), long daylight, outdoor terraces packed. Downside: Amsterdam is very crowded. Book accommodation and major museums 6-8 weeks ahead. Maastricht and Rotterdam are noticeably less crowded than Amsterdam.', timestamp: new Date('2026-07-01T09:06:05Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'destinations', refId: DEST_IDS.amsterdam_centrum, score: 0.96, snippet: 'Amsterdam Historic Centre — 3-night base for museums' },
        { entityType: 'destinations', refId: DEST_IDS.rotterdam_centrum, score: 0.91, snippet: 'Rotterdam City Centre — modern architecture, Markthal' },
        { entityType: 'destinations', refId: DEST_IDS.maastricht, score: 0.88, snippet: 'Maastricht — Burgundian cuisine, caves, medieval streets' },
      ],
      preferencesSnapshot: { destinations: ['Amsterdam', 'Rotterdam', 'Maastricht'], travelStyle: 'cultural', budget: 'mid' },
    },
  },
  {
    userId: USER_IDS.sophie,
    tripId: TRIP_IDS.tulip_season_sophie,
    messages: [
      { role: 'user', content: 'When exactly is the tulip season in the Netherlands?', timestamp: new Date('2026-03-10T14:00:00Z') },
      { role: 'assistant', content: 'Tulip fields bloom mid-March to mid-May, peaking in mid-to-late April depending on the year. Keukenhof is open 20 March – 11 May 2026. The Bollenstreek countryside near Lisse peaks around April 15-25. For the iconic striped field photos, target the week between April 12-20.', timestamp: new Date('2026-03-10T14:00:07Z') },
      { role: 'user', content: 'Can you combine Keukenhof with Amsterdam in a day trip?', timestamp: new Date('2026-03-10T14:02:00Z') },
      { role: 'assistant', content: 'Yes, very easily. Direct coaches run from Amsterdam Centraal and Leidseplein hourly during the Keukenhof season (€21 return including entry). Journey time is ~1 hour. Arrive at Keukenhof by 09:00, spend 3–4 hours, cycle through the bulb fields in the afternoon, and be back in Amsterdam for dinner. A perfect full day.', timestamp: new Date('2026-03-10T14:02:09Z') },
      { role: 'user', content: 'What are the best luxury hotels in Amsterdam Jordaan?', timestamp: new Date('2026-03-10T14:05:00Z') },
      { role: 'assistant', content: 'The Pulitzer (5-star, 25 canal houses merged) and The Dylan (5-star boutique in a converted theatre) are the Jordaan\'s finest. Both have celebrated restaurants, canal views, and rates from €420/night. The Dylan\'s Vinkeles is Michelin-starred. Book directly for best canal-facing room upgrades.', timestamp: new Date('2026-03-10T14:05:11Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'destinations', refId: DEST_IDS.keukenhof, score: 0.97, snippet: 'Keukenhof — 7 million tulip bulbs, March to May' },
        { entityType: 'activities', refId: ACTIVITY_IDS.keukenhof_gardens, score: 0.95, snippet: 'Keukenhof Gardens — open annually Mar-May, 32 hectares' },
        { entityType: 'hotels', refId: HOTEL_IDS.pulitzer, score: 0.87, snippet: 'Pulitzer Amsterdam — 5-star canal hotel in Jordaan' },
      ],
      preferencesSnapshot: { destinations: ['Amsterdam', 'Keukenhof'], travelStyle: 'luxury', budget: 'luxury' },
    },
  },
  {
    userId: USER_IDS.fatima,
    tripId: TRIP_IDS.family_trip_fatima,
    messages: [
      { role: 'user', content: 'We are travelling with two children aged 6 and 9. What are the best family-friendly activities in the Netherlands?', timestamp: new Date('2026-06-10T11:00:00Z') },
      { role: 'assistant', content: 'Top family picks: NEMO Science Museum Amsterdam (hands-on, 5 floors), Madurodam The Hague (1:25 scale Netherlands miniature city — kids can operate everything), Giethoorn (whisper boat for the whole family), and the windmills at Zaanse Schans. Keukenhof in spring is spectacular for children who enjoy outdoor space.', timestamp: new Date('2026-06-10T11:00:09Z') },
      { role: 'user', content: 'Are there halal restaurants in Amsterdam good for families?', timestamp: new Date('2026-06-10T11:03:00Z') },
      { role: 'assistant', content: 'The Foodhallen in Oud-West has several certified halal stalls within the food hall — children can choose different things making it great for families. In De Pijp, the Albert Cuyp Market area has many halal street food vendors. Bazar Rotterdam (Middle Eastern) is also halal-certified and very family-friendly with a children\'s menu.', timestamp: new Date('2026-06-10T11:03:07Z') },
      { role: 'user', content: 'What is the best way to travel between Dutch cities with children?', timestamp: new Date('2026-06-10T11:06:00Z') },
      { role: 'assistant', content: 'Dutch intercity trains are excellent with children — clean, frequent (every 15 min between major cities), and children under 4 travel free. Reserve seats in advance on busy summer weekends. For Giethoorn, you\'ll need a car (2 hours from Amsterdam) — Europcar and Hertz have stations at Amsterdam Centraal. The NS trains have family carriages on Intercity Direct routes.', timestamp: new Date('2026-06-10T11:06:12Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'activities', refId: ACTIVITY_IDS.nemo_science, score: 0.95, snippet: 'NEMO Science Museum — 5 floors of family hands-on science' },
        { entityType: 'activities', refId: ACTIVITY_IDS.madurodam, score: 0.93, snippet: 'Madurodam — 1:25 scale Netherlands miniature city, The Hague' },
        { entityType: 'restaurants', refId: RESTAURANT_IDS.foodhallen, score: 0.84, snippet: 'Foodhallen Amsterdam — diverse food stalls including halal options' },
      ],
      preferencesSnapshot: { destinations: ['Amsterdam', 'The Hague', 'Giethoorn'], travelStyle: 'family', budget: 'mid' },
    },
  },
  {
    userId: USER_IDS.anna,
    tripId: TRIP_IDS.budget_nl_anna,
    messages: [
      { role: 'user', content: 'I have €700 for 14 days in the Netherlands. Is that realistic?', timestamp: new Date('2026-05-20T08:00:00Z') },
      { role: 'assistant', content: '€50/day is tight but doable. Hostel dorms average €25-35/night. Free activities: cycling, parks, Albert Cuyp Market, Erasmus Bridge, Kinderdijk walking trails. Budget eats: Albert Cuyp Market herring (€3), Graanstra frites (€3-5), supermarkets (Albert Heijn). Intercity trains are €6-12 between cities. Skip paid museums except 1-2 priorities.', timestamp: new Date('2026-05-20T08:00:11Z') },
      { role: 'user', content: 'Which Dutch cities are cheapest to visit?', timestamp: new Date('2026-05-20T08:03:00Z') },
      { role: 'assistant', content: 'Groningen and Nijmegen are the cheapest — university cities with student-priced food and bars. Utrecht is mid-range. Rotterdam is 20-30% cheaper than Amsterdam for accommodation. Amsterdam is the most expensive, especially July-August. Consider staying in Haarlem (20 min from Amsterdam by train, 40% cheaper hotel rates) and commuting in.', timestamp: new Date('2026-05-20T08:03:08Z') },
      { role: 'user', content: 'What is the cheapest way to travel from Amsterdam to Groningen?', timestamp: new Date('2026-05-20T08:06:00Z') },
      { role: 'assistant', content: 'NS Intercity direct: ~€22 single, 2h20m. Buy "Dal Voordeel" (off-peak discount) tickets 1 day ahead online for 40% savings — off-peak is Mon-Fri before 06:30, 09:00-16:00, after 18:30, all day weekends. Flixbus also runs Amsterdam–Groningen for €9-15 but takes 3+ hours. For 14 days, a 7-day OV-chipkaart season ticket may save you money.', timestamp: new Date('2026-05-20T08:06:15Z') },
      { role: 'user', content: 'Is free camping possible in the Netherlands?', timestamp: new Date('2026-05-20T08:10:00Z') },
      { role: 'assistant', content: 'Wild camping is technically illegal in the Netherlands but tolerated in some areas. Trekkershutten (hiker\'s huts) at campsite are the best budget sleep option at €15-25/night. Camping De Lakens near Bloemendaal is well-positioned for Amsterdam. Naturkampeerterreinen (nature campsites) are rustic and cheap (€8-12/night). Check Camping.nl for options.', timestamp: new Date('2026-05-20T08:10:09Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'destinations', refId: DEST_IDS.groningen, score: 0.91, snippet: 'Groningen — affordable northern university city' },
        { entityType: 'destinations', refId: DEST_IDS.amsterdam_centrum, score: 0.87, snippet: 'Amsterdam — most expensive Dutch city, peak summer crowded' },
        { entityType: 'activities', refId: ACTIVITY_IDS.albert_cuyp_market, score: 0.88, snippet: 'Albert Cuyp Market — free, best budget street food' },
      ],
      preferencesSnapshot: { destinations: ['Amsterdam', 'Groningen', 'Utrecht'], travelStyle: 'budget', budget: 'budget' },
    },
  },
  {
    userId: USER_IDS.lars,
    tripId: TRIP_IDS.cycling_tour_lars,
    messages: [
      { role: 'user', content: 'I want to cycle across the Netherlands coast to coast. How many days do I need?', timestamp: new Date('2026-05-15T07:00:00Z') },
      { role: 'assistant', content: 'A Texel-to-Zeeland route covers ~350 km. At a leisurely 50-60 km/day, plan 6-7 cycling days. The LF1 (North Sea Route) is a signposted coast-to-coast cycle path from Den Helder (Texel ferry) to the Belgian border — well-marked, mostly flat, through dunes, polders, and dune reserves. Add 2 days for rest and sightseeing.', timestamp: new Date('2026-05-15T07:00:10Z') },
      { role: 'user', content: 'What is the best month for cycling in the Netherlands?', timestamp: new Date('2026-05-15T07:03:00Z') },
      { role: 'assistant', content: 'May and June are ideal — long days (light until 22:00), temperatures 16-22°C, spring flowers still in the fields, and crowds much lighter than July-August. September is excellent too. Avoid March-April if you want reliability — it can be very wet. The Netherlands has 35,000 km of dedicated cycle paths so traffic is rarely an issue.', timestamp: new Date('2026-05-15T07:03:08Z') },
      { role: 'user', content: 'Can I bring my own bike on the Dutch train?', timestamp: new Date('2026-05-15T07:06:00Z') },
      { role: 'assistant', content: 'Yes — you need a fietskaart (day pass for bike, €7.50) on top of your regular ticket. Bikes allowed on all trains except peak hours (Mon-Fri 06:30-09:00 and 16:00-18:30). Folding bikes travel free and unpacked at any time. The card is not valid on high-speed Thalys or Intercity Direct without a specific upgrade.', timestamp: new Date('2026-05-15T07:06:06Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'destinations', refId: DEST_IDS.texel, score: 0.97, snippet: 'Texel Island — 140 km cycle paths through dunes and nature reserves' },
        { entityType: 'activities', refId: ACTIVITY_IDS.texel_cycling, score: 0.95, snippet: 'Texel Dune Cycling Route — 4h, full island coverage' },
        { entityType: 'activities', refId: ACTIVITY_IDS.kinderdijk_walk, score: 0.85, snippet: 'Kinderdijk — UNESCO windmills, cycle along the dyke' },
      ],
      preferencesSnapshot: { destinations: ['Texel', 'Giethoorn', 'Groningen'], travelStyle: 'adventure', budget: 'budget' },
    },
  },
  {
    userId: USER_IDS.hiroshi,
    tripId: TRIP_IDS.art_trip_hiroshi,
    messages: [
      { role: 'user', content: 'I want to follow in Rembrandt\'s footsteps across the Netherlands. What is the route?', timestamp: new Date('2026-08-20T09:00:00Z') },
      { role: 'assistant', content: 'The definitive Rembrandt route: Leiden (birthplace, 1606 — visit Lakenhal Museum near his childhood home), Amsterdam (1631–1656 — Rembrandt House Museum, Rijksmuseum Night Watch), and then trace his influences in the Mauritshuis The Hague (Anatomy Lesson). A 3-city, 4-day circuit connects all three by train.', timestamp: new Date('2026-08-20T09:00:12Z') },
      { role: 'user', content: 'How does the Rembrandt House compare to the Rijksmuseum experience?', timestamp: new Date('2026-08-20T09:04:00Z') },
      { role: 'assistant', content: 'Completely different. The Rijksmuseum is overwhelming — 8,000 objects, the grand Night Watch gallery, an art-history epic. The Rembrandt House is intimate — 1 hour, his actual studio restored with his etching press and copper plates, live demonstrations from the staff. I\'d do the Rembrandt House first to understand his working process, then the Rijksmuseum for the masterpieces in context.', timestamp: new Date('2026-08-20T09:04:09Z') },
      { role: 'user', content: 'Is there a Vermeer museum in Delft?', timestamp: new Date('2026-08-20T09:08:00Z') },
      { role: 'assistant', content: 'The Vermeer Centrum Delft tells the story of his life and technique — it holds no original Vermeer paintings (only high-res reproductions) but is beautifully done and essential context for the city. Vermeer\'s actual works are split between the Mauritshuis (Girl with a Pearl Earring), Rijksmuseum (The Milkmaid, View of Delft), and Gemäldegalerie Berlin. Worth visiting after the Mauritshuis so you understand what you\'re seeing.', timestamp: new Date('2026-08-20T09:08:13Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'activities', refId: ACTIVITY_IDS.rembrandt_house, score: 0.98, snippet: 'Rembrandt House Museum — restored studio with etching demonstrations' },
        { entityType: 'activities', refId: ACTIVITY_IDS.rijksmuseum, score: 0.96, snippet: 'Rijksmuseum — Night Watch, 8,000 Golden Age masterworks' },
        { entityType: 'activities', refId: ACTIVITY_IDS.mauritshuis, score: 0.94, snippet: 'Mauritshuis — Girl with a Pearl Earring, Anatomy Lesson' },
      ],
      preferencesSnapshot: { destinations: ['Amsterdam', 'Delft', 'Leiden'], travelStyle: 'cultural', budget: 'mid' },
    },
  },
  {
    userId: USER_IDS.priya,
    tripId: TRIP_IDS.amsterdam_draft_priya,
    messages: [
      { role: 'user', content: 'My partner and I love art and history. We\'re planning Amsterdam, Leiden, and Delft. How do we connect them?', timestamp: new Date('2026-05-28T12:00:00Z') },
      { role: 'assistant', content: 'All three are easy by NS train: Amsterdam–Leiden (35 min, €8), Leiden–Delft (20 min, €4), Delft–Amsterdam via The Hague (1h, €10). I suggest: Day 1 Amsterdam (Rijksmuseum, Rembrandt House), Day 2 Leiden (Lakenhal Museum, Hortus Botanicus, Rembrandt birthplace area), Day 3 Delft (Vermeer Centrum, Nieuwe Kerk, Delftware factory), optional Day 4 back via The Hague (Mauritshuis).', timestamp: new Date('2026-05-28T12:00:10Z') },
      { role: 'user', content: 'Is Leiden worth a full day or just half a day?', timestamp: new Date('2026-05-28T12:03:00Z') },
      { role: 'assistant', content: 'Full day if you\'re art-focused. The Lakenhal Museum is excellent (Rembrandt early works), the Hortus Botanicus is one of the oldest botanical gardens in Europe (1590), and the Rijksmuseum van Oudheden (National Museum of Antiquities) has an Egyptian Temple reassembled inside. The canal walks and Molen de Valk windmill add another 2 hours. Leiden rewards slow exploration.', timestamp: new Date('2026-05-28T12:03:11Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'destinations', refId: DEST_IDS.leiden, score: 0.94, snippet: 'Leiden — Rembrandt birthplace, university city, botanical garden' },
        { entityType: 'destinations', refId: DEST_IDS.delft, score: 0.92, snippet: 'Delft — Vermeer birthplace, 17th-century canals, Delftware' },
      ],
      preferencesSnapshot: { destinations: ['Amsterdam', 'Leiden', 'Delft'], travelStyle: 'cultural', budget: 'mid' },
    },
  },
  {
    userId: USER_IDS.marco,
    tripId: TRIP_IDS.maastricht_getaway_marco,
    messages: [
      { role: 'user', content: 'What makes Maastricht cuisine "Burgundian"?', timestamp: new Date('2026-08-01T16:00:00Z') },
      { role: 'assistant', content: 'Maastricht sits at the crossroads of France, Belgium, and Germany — historically part of the Duchy of Burgundy, which encompassed the Low Countries until the 16th century. This Burgundian heritage means a food culture centred on richness, conviviality, and fine wine: slow-braised meats, regional cheeses, Limburg wines, and a café culture closer to French bistro than Dutch brown café. It\'s the Netherlands\' most European city by gastronomy.', timestamp: new Date('2026-08-01T16:00:11Z') },
      { role: 'user', content: 'Is Toine Hermsen difficult to book?', timestamp: new Date('2026-08-01T16:03:00Z') },
      { role: 'assistant', content: 'Yes — Toine Hermsen (2 Michelin stars) books out 4-6 weeks ahead for weekends. Call or book via their website as soon as you confirm your dates. Wednesday/Thursday evenings have more availability. The tasting menu is ~€110/person without wine pairing. Worth every cent for a Maastricht food trip centrepiece.', timestamp: new Date('2026-08-01T16:03:08Z') },
      { role: 'user', content: 'What Limburg specialities must I try?', timestamp: new Date('2026-08-01T16:06:00Z') },
      { role: 'assistant', content: 'Essential Limburg dishes: vlaai (fruit pie — peach, apricot, or quark), zuurvlees (sweet-sour horse/beef stew with frites), gevulde koek met amandel (almond paste pastry), Hertog Jan beer (brewed in Arcen), and rijsttafel from Maastricht\'s excellent Indonesian community. For cheese: Limburger and Rommedou are pungent, intensely local. Try the Saturday market on the Markt square for all of the above.', timestamp: new Date('2026-08-01T16:06:14Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'destinations', refId: DEST_IDS.maastricht, score: 0.97, snippet: 'Maastricht — Burgundian culinary capital of the Netherlands' },
        { entityType: 'restaurants', refId: RESTAURANT_IDS.toine_hermsen, score: 0.96, snippet: 'Toine Hermsen — 2 Michelin stars, Burgundian fine dining' },
        { entityType: 'restaurants', refId: RESTAURANT_IDS.dingel_maastricht, score: 0.89, snippet: 'Grand Café d\'n Ingel — vlaai, zuurvlees, Vrijthof terrace' },
      ],
      preferencesSnapshot: { destinations: ['Maastricht', 'Amsterdam', 'Rotterdam'], travelStyle: 'cultural', budget: 'luxury' },
    },
  },
  {
    userId: USER_IDS.yuki,
    tripId: TRIP_IDS.honeymoon_yuki,
    messages: [
      { role: 'user', content: 'We are planning our honeymoon in the Netherlands in November. What romantic experiences do you recommend?', timestamp: new Date('2026-09-01T20:00:00Z') },
      { role: 'assistant', content: 'November is underrated for romance in the Netherlands. Top picks: private canal boat evening cruise in Amsterdam (Orangelining offer private boats from €80/hour), a weekend at the Kruisherenhotel in Maastricht (Gothic monastery — uniquely atmospheric), Giethoorn by whisper boat in the autumn mist, and the opening of the Maastricht Christmas market (late November) with mulled wine and Limburg vlaai.', timestamp: new Date('2026-09-01T20:00:12Z') },
      { role: 'user', content: 'What is the best hotel in Amsterdam for a honeymoon?', timestamp: new Date('2026-09-01T20:03:00Z') },
      { role: 'assistant', content: 'The Pulitzer Amsterdam and The Dylan are the top two for honeymoons. The Pulitzer has a dedicated honeymoon package with canal-view rooms, private boat hire, and a in-room breakfast. The Dylan\'s Keizersgracht canal suite has floor-to-ceiling windows overlooking the water and the Michelin-starred Vinkeles restaurant below. Both are in the Jordaan — Amsterdam\'s most romantic neighbourhood.', timestamp: new Date('2026-09-01T20:03:10Z') },
      { role: 'user', content: 'Is Japanese spoken in any Dutch restaurants?', timestamp: new Date('2026-09-01T20:06:00Z') },
      { role: 'assistant', content: 'In Amsterdam, several high-end restaurants have Japanese-speaking staff, especially those with Japanese head chefs or owned by Japanese groups. Restaurant Bak and Rijks have English-fluent staff who can navigate menus thoroughly. For Japanese cuisine specifically, De Japanse Tuin in Amsterdam and Yamazato at the Okura Hotel (the Netherlands\' only Japan-listed Michelin-starred Japanese restaurant) are exceptional.', timestamp: new Date('2026-09-01T20:06:08Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'hotels', refId: HOTEL_IDS.pulitzer, score: 0.95, snippet: 'Pulitzer Amsterdam — 5-star honeymoon packages, canal boat' },
        { entityType: 'hotels', refId: HOTEL_IDS.kruisherenhotel, score: 0.93, snippet: 'Kruisherenhotel — Gothic monastery hotel, Maastricht' },
        { entityType: 'activities', refId: ACTIVITY_IDS.giethoorn_boat, score: 0.91, snippet: 'Giethoorn whisper boat — romantic canal village' },
      ],
      preferencesSnapshot: { destinations: ['Amsterdam', 'Giethoorn', 'Maastricht'], travelStyle: 'luxury', budget: 'luxury' },
    },
  },
  {
    userId: USER_IDS.thomas,
    tripId: TRIP_IDS.business_thomas,
    messages: [
      { role: 'user', content: 'I have a business trip to Amsterdam with a free weekend. Best use of 2 days?', timestamp: new Date('2026-07-20T18:00:00Z') },
      { role: 'assistant', content: 'Saturday: Rijksmuseum (09:30, pre-book), lunch at Rijks restaurant, Van Gogh Museum (14:00). Evening in Leidseplein area. Sunday: Jordaan neighbourhood walk in the morning, Albert Cuyp Market (open until 17:00), canal boat tour in the afternoon. That covers the cultural essentials without rushing.', timestamp: new Date('2026-07-20T18:00:09Z') },
      { role: 'user', content: 'Good restaurants for a business dinner in Amsterdam?', timestamp: new Date('2026-07-20T18:03:00Z') },
      { role: 'assistant', content: 'For business: Restaurant Rijks (impressive setting inside the Rijksmuseum, always a talking point), Envy (sharing plates, good for group dynamics), or Brasserie De Witt at the Kimpton for something more relaxed. All have private dining options with advance notice. Avoid tourist-trap areas near the Leidseplein for serious dinners.', timestamp: new Date('2026-07-20T18:03:08Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'activities', refId: ACTIVITY_IDS.rijksmuseum, score: 0.90, snippet: 'Rijksmuseum — 3 hours, book morning slot' },
        { entityType: 'restaurants', refId: RESTAURANT_IDS.rijks_restaurant, score: 0.92, snippet: 'Restaurant Rijks — business dinner inside Rijksmuseum' },
      ],
      preferencesSnapshot: { destinations: ['Amsterdam', 'Rotterdam', 'The Hague'], travelStyle: 'cultural', budget: 'mid' },
    },
  },
  {
    userId: USER_IDS.sarah,
    tripId: TRIP_IDS.photography_sarah,
    messages: [
      { role: 'user', content: 'I am a travel photographer. What are the most photogenic locations in the Netherlands?', timestamp: new Date('2026-05-01T08:00:00Z') },
      { role: 'assistant', content: 'Top photography locations: Kinderdijk windmills at golden hour (UNESCO, 19 mills in a row), Keukenhof tulip fields in April (flowers carpet the landscape), Zaanse Schans at dawn (green wooden mills reflected in the Zaan River), Giethoorn in morning mist (thatched rooftops, still canal water), Amsterdam canals from bridges at blue hour, Alkmaar cheese market for street photography.', timestamp: new Date('2026-05-01T08:00:13Z') },
      { role: 'user', content: 'What time should I arrive at Kinderdijk for the best light?', timestamp: new Date('2026-05-01T08:03:00Z') },
      { role: 'assistant', content: 'Arrive at the car park by 08:30-09:00 for golden hour in summer (sunrise is 05:30 in June). The site opens at 09:00, but the perimeter paths are accessible earlier. The light at golden hour illuminates the mill sails and casts long shadows across the polders — the reflection in the still canal water is most dramatic on windless mornings. Evening (18:00-19:30 in September) is also spectacular.', timestamp: new Date('2026-05-01T08:03:09Z') },
      { role: 'user', content: 'Are there any less-visited windmill sites for more authentic shots?', timestamp: new Date('2026-05-01T08:07:00Z') },
      { role: 'assistant', content: 'Yes — Zaanse Schans gets crowded by 10:00, but arriving at 08:30 gives you near-empty paths. Less-visited alternatives: De Kat mill at Zaanse Schans (paint-pigment windmill — only working paint mill in the world), the Wip mill at Kinderdijk\'s far end (few tourists venture that far), and the three working mills at Schiedam (near Rotterdam) — world\'s tallest historic windmills, very few tourists.', timestamp: new Date('2026-05-01T08:07:16Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'destinations', refId: DEST_IDS.kinderdijk, score: 0.97, snippet: 'Kinderdijk — 19 UNESCO windmills, golden hour photography' },
        { entityType: 'destinations', refId: DEST_IDS.zaanse_schans, score: 0.94, snippet: 'Zaanse Schans — working windmill village, dawn photography' },
        { entityType: 'activities', refId: ACTIVITY_IDS.kinderdijk_walk, score: 0.96, snippet: 'Kinderdijk windmill walk — best at golden hour 08:30-10:00' },
      ],
      preferencesSnapshot: { destinations: ['Amsterdam', 'Haarlem', 'Alkmaar'], travelStyle: 'adventure', budget: 'mid' },
    },
  },
  {
    userId: USER_IDS.ingrid,
    tripId: TRIP_IDS.wellness_ingrid,
    messages: [
      { role: 'user', content: 'I want a nature and wellness trip in the Netherlands. Not cities — natural landscapes and peace.', timestamp: new Date('2026-05-25T09:00:00Z') },
      { role: 'assistant', content: 'Perfect — the Netherlands beyond the cities is remarkably diverse. Texel Island: 28 km of North Sea dunes and beaches, seal sanctuaries, birdwatching (220+ species), wellness hotels. Giethoorn: car-free village with just canals and thatched farmhouses — the most serene place in the Netherlands. National Park Hoge Veluwe (Gelderland): 55 km² of heather, dunes, and forest with free white bicycles.', timestamp: new Date('2026-05-25T09:00:11Z') },
      { role: 'user', content: 'Are there wellness spas near Texel?', timestamp: new Date('2026-05-25T09:04:00Z') },
      { role: 'assistant', content: 'Hotel Opduin on Texel has a full spa and thalassotherapy centre using North Sea seawater — the best wellness hotel on the island. Strandhotel Seeduyn also has a wellness facility directly on the dunes. Both offer sea-view rooms, outdoor hot tubs, and dune walks from the door. De Koog village has several smaller wellness studios for yoga and massage.', timestamp: new Date('2026-05-25T09:04:08Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'destinations', refId: DEST_IDS.texel, score: 0.98, snippet: 'Texel Island — North Sea dunes, seals, wellness hotels' },
        { entityType: 'destinations', refId: DEST_IDS.giethoorn, score: 0.95, snippet: 'Giethoorn — car-free canals, thatched rooftops, tranquil' },
        { entityType: 'activities', refId: ACTIVITY_IDS.texel_cycling, score: 0.93, snippet: 'Texel cycling through dunes — 4h nature route' },
      ],
      preferencesSnapshot: { destinations: ['Texel', 'Giethoorn', 'Haarlem'], travelStyle: 'adventure', budget: 'mid' },
    },
  },
  {
    userId: USER_IDS.david,
    tripId: TRIP_IDS.food_tour_david,
    messages: [
      { role: 'user', content: 'Tell me about Indonesian food in the Netherlands and why it\'s so prominent.', timestamp: new Date('2026-06-25T14:00:00Z') },
      { role: 'assistant', content: 'The Netherlands colonised Indonesia (the Dutch East Indies) for 350 years until 1945. Post-independence, 300,000+ Indonesians and Dutch-Indonesians migrated to the Netherlands, bringing their food culture. Rijsttafel (rice table) — an elaborate Dutch colonial invention of 17-25+ small Indonesian dishes served simultaneously — became embedded in Dutch gastronomy. The Hague has the largest Indonesian community in Europe.', timestamp: new Date('2026-06-25T14:00:12Z') },
      { role: 'user', content: 'What is the best rijsttafel restaurant in Amsterdam?', timestamp: new Date('2026-06-25T14:03:00Z') },
      { role: 'assistant', content: 'Tempo Doeloe is consistently rated Amsterdam\'s finest. They use authentic Indonesian recipes (not Dutch adaptations), the spice levels are genuine, and the quality of individual dishes — rendang, gado-gado, sambal goreng — is exceptional. Book 3-4 weeks ahead for weekends. Budget €45-55/person with drinks. Café Bali and Sama Sebo are excellent alternatives if Tempo Doeloe is full.', timestamp: new Date('2026-06-25T14:03:08Z') },
      { role: 'user', content: 'What Dutch street food should I try?', timestamp: new Date('2026-06-25T14:06:00Z') },
      { role: 'assistant', content: 'Essential Dutch street food: raw haring with onion and pickle (eat it Dutch-style: tilt your head and lower the fish in — not in a bun), stroopwafel fresh off the iron at a market, poffertjes (mini Dutch pancakes with butter and icing sugar), bitterballen (deep-fried ragout balls at any brown café), and fresh frites (chips) from a frietkot with satay sauce + mayo + raw onion (called "oorlog" — "war").', timestamp: new Date('2026-06-25T14:06:15Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'restaurants', refId: RESTAURANT_IDS.tempo_doeloe, score: 0.97, snippet: 'Tempo Doeloe — Amsterdam\'s finest rijsttafel, book 3-4 weeks ahead' },
        { entityType: 'restaurants', refId: RESTAURANT_IDS.garoeda_hague, score: 0.95, snippet: 'Garoeda The Hague — oldest Indonesian rijsttafel restaurant, 1949' },
        { entityType: 'activities', refId: ACTIVITY_IDS.albert_cuyp_market, score: 0.90, snippet: 'Albert Cuyp Market — stroopwafels, haring, Dutch street food' },
      ],
      preferencesSnapshot: { destinations: ['Amsterdam', 'Rotterdam', 'Eindhoven'], travelStyle: 'budget', budget: 'mid' },
    },
  },
  {
    userId: USER_IDS.mohammed,
    tripId: TRIP_IDS.luxury_ams_mohammed,
    messages: [
      { role: 'user', content: 'What are the most exclusive private experiences available in Amsterdam?', timestamp: new Date('2026-09-15T11:00:00Z') },
      { role: 'assistant', content: 'Premium Amsterdam experiences: private guided tour of the Rijksmuseum after hours (Museum After Hours, €2,500+), private canal boat charter with chef and sommelier (from €300/hour via Lovers Canal Cruises), private art auction preview at Christie\'s Amsterdam, bespoke Delftware painting lesson at Royal Delft in Delft, and helicopter transfer Amsterdam–Maastricht (~€900/flight).', timestamp: new Date('2026-09-15T11:00:14Z') },
      { role: 'user', content: 'Are there dedicated luxury concierge services in Amsterdam?', timestamp: new Date('2026-09-15T11:04:00Z') },
      { role: 'assistant', content: 'Several. The Pulitzer and The Dylan both have concierge teams that specialise in high-net-worth guests — they can arrange everything from same-day Michelin reservations to private flower market tours before 06:00. Quintessentially (global luxury concierge) has an Amsterdam office. For art collection viewings, Galerie Ron Mandos and galleries on the Nieuwe Spiegelstraat have private viewing services.', timestamp: new Date('2026-09-15T11:04:09Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'hotels', refId: HOTEL_IDS.the_dylan, score: 0.96, snippet: 'The Dylan Amsterdam — 5-star boutique, Michelin-starred Vinkeles' },
        { entityType: 'hotels', refId: HOTEL_IDS.kruisherenhotel, score: 0.93, snippet: 'Kruisherenhotel Maastricht — Gothic monastery 5-star hotel' },
        { entityType: 'restaurants', refId: RESTAURANT_IDS.rijks_restaurant, score: 0.91, snippet: 'Restaurant Rijks — acclaimed Dutch cuisine, Rijksmuseum setting' },
      ],
      preferencesSnapshot: { destinations: ['Amsterdam', 'Rotterdam', 'Maastricht'], travelStyle: 'luxury', budget: 'luxury' },
    },
  },
  {
    userId: USER_IDS.carlos,
    tripId: TRIP_IDS.rotterdam_arch_carlos,
    messages: [
      { role: 'user', content: 'I\'m an architecture student visiting Rotterdam. What is the must-see modern architecture?', timestamp: new Date('2026-04-15T10:00:00Z') },
      { role: 'assistant', content: 'Essential Rotterdam architecture: Markthal by MVRDV (2014, glass horseshoe-arch market hall), Cube Houses by Piet Blom (1984, tilted cubes on hexagonal pylons), De Rotterdam by Rem Koolhaas/OMA (2013, triple-tower "vertical city"), Erasmusbrug by Ben van Berkel (1996, the "Swan"), Timmerhuis by OMA (2015, pixelated tower), and the Depot Boijmans Van Beuningen by MVRDV (2021, mirrored bowl museum).', timestamp: new Date('2026-04-15T10:00:13Z') },
      { role: 'user', content: 'Is the Depot Boijmans Van Beuningen worth visiting?', timestamp: new Date('2026-04-15T10:04:00Z') },
      { role: 'assistant', content: 'Architecturally extraordinary — MVRDV\'s 2021 mirrored bowl on stilts is one of the world\'s most dramatic museum buildings. Inside, it\'s the world\'s first publicly accessible art depot: 150,000 art works stored visibly across 6 floors in climate-controlled rooms. The rooftop garden has a 360° Rotterdam skyline panorama. Entry €20, worth it purely for the building experience.', timestamp: new Date('2026-04-15T10:04:10Z') },
    ],
    context: {
      lastVectorSearchResults: [
        { entityType: 'destinations', refId: DEST_IDS.rotterdam_centrum, score: 0.97, snippet: 'Rotterdam — post-WWII modernist architecture showcase' },
        { entityType: 'activities', refId: ACTIVITY_IDS.cube_houses, score: 0.95, snippet: 'Cube Houses — Piet Blom 1984 tilted cube houses' },
        { entityType: 'activities', refId: ACTIVITY_IDS.markthal_tour, score: 0.94, snippet: 'Markthal Rotterdam — MVRDV 2014 arch-shaped covered market' },
      ],
      preferencesSnapshot: { destinations: ['Rotterdam', 'Eindhoven', 'Groningen'], travelStyle: 'budget', budget: 'budget' },
    },
  },
];
