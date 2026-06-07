const { cleanText } = require('./embeddingService');

/**
 * Builds a semantically rich plain-text representation of a document so
 * Voyage AI can produce a meaningful embedding for vector similarity search.
 *
 * @param {object} doc      - Mongoose document or plain object from .lean()
 * @param {string} type     - 'destination' | 'activity' | 'hotel' | 'user'
 * @param {object} context  - Optional extra fields not on the doc
 *                            { destinationName: string } for activity / hotel
 * @returns {string} cleaned embedding text
 */
function buildEmbeddingText(doc, type, context = {}) {
  let raw;

  switch (type) {
    case 'destination': {
      const categories = (doc.category || []).join(', ');
      const tags = (doc.tags || []).join(', ');
      const months = (doc.bestMonths || []).join(', ');
      raw = [
        `${doc.name}.`,
        doc.country ? `${doc.country}.` : '',
        doc.city ? `${doc.city}.` : '',
        doc.description || '',
        doc.shortDescription ? doc.shortDescription : '',
        categories ? `Best for: ${categories}.` : '',
        months ? `Best months: ${months}.` : '',
        tags ? `Tags: ${tags}.` : '',
      ].join(' ');
      break;
    }

    case 'activity': {
      const destName = context.destinationName || '';
      const tags = (doc.tags || []).join(', ');
      raw = [
        destName ? `${doc.name} in ${destName}.` : `${doc.name}.`,
        doc.description || '',
        doc.category ? `Type: ${doc.category}.` : '',
        doc.priceLevel ? `Price level: ${doc.priceLevel}.` : '',
        doc.duration ? `Duration: ${doc.duration}h.` : '',
        tags ? `Tags: ${tags}.` : '',
      ].join(' ');
      break;
    }

    case 'hotel': {
      const destName = context.destinationName || '';
      const amenities = (doc.amenities || []).join(', ');
      raw = [
        destName ? `${doc.name} in ${destName}.` : `${doc.name}.`,
        doc.starRating ? `${doc.starRating}-star hotel.` : '',
        doc.description || '',
        amenities ? `Amenities: ${amenities}.` : '',
        doc.priceLevel ? `Price level: ${doc.priceLevel}.` : '',
      ].join(' ');
      break;
    }

    case 'user': {
      const destinations = (doc.preferences?.destinations || []).join(', ');
      const currencies = (doc.preferences?.currencies || []).join(', ');
      raw = [
        doc.preferences?.travelStyle ? `Travel style: ${doc.preferences.travelStyle}.` : '',
        destinations ? `Preferred destinations: ${destinations}.` : '',
        currencies ? `Currencies: ${currencies}.` : '',
      ].join(' ');
      break;
    }

    default:
      throw new Error(`buildEmbeddingText: unknown type "${type}"`);
  }

  return cleanText(raw);
}

/**
 * Returns true if the user has enough preference data to warrant embedding.
 * Used as a guard before calling generateEmbedding for user profiles.
 * Update this logic once interaction tracking is implemented.
 */
function userHasEmbeddablePreferences(user) {
  const prefs = user.preferences || {};
  const hasStyle = Boolean(prefs.travelStyle);
  const hasDests = Array.isArray(prefs.destinations) && prefs.destinations.length > 0;
  const hasCurrencies = Array.isArray(prefs.currencies) && prefs.currencies.length > 0;
  return hasStyle || hasDests || hasCurrencies;
}

module.exports = { buildEmbeddingText, userHasEmbeddablePreferences };
