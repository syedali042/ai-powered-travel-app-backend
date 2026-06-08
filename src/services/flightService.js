// Flight price search — provider not yet configured.
// Implement here when a flight data provider is chosen (e.g. Skyscanner Partner API,
// Duffel, or Kiwi.com Tequila). Wire the provider into cacheService.wrap the same
// way hotelService.js does for RateHawk.

async function searchFlights(/* origin, destination, departureDate, adults */) {
  return [];
}

module.exports = { searchFlights };
