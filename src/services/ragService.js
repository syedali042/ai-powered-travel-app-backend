const OpenAI = require('openai');
const logger = require('../utils/logger');

// Lazy-initialize to avoid key validation at require-time
let _openai = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// Delimiter marking the start / end of the structured JSON block in the response.
// The model writes narrative first, then appends the JSON block.
const JSON_START = '<itinerary_json>';
const JSON_END   = '</itinerary_json>';

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildSystemPrompt() {
  return `You are an expert Netherlands travel planning assistant with deep knowledge of Dutch cities, culture, accommodation, cuisine, and attractions. You help travellers craft personalised, practical itineraries.

When responding:
- Write a warm, knowledgeable travel recommendation in Markdown
- Reference specific places from the provided search results whenever relevant (use their exact names)
- Be specific: mention prices in EUR, opening hours, booking tips, and transport options
- Prioritise the Netherlands — every recommendation should be in the Netherlands

After your narrative, append a structured JSON block EXACTLY like this:

${JSON_START}
{
  "title": "Short descriptive trip title",
  "summary": "One sentence that captures the trip's character",
  "recommendedDuration": 3,
  "estimatedBudget": { "budget": 400, "mid": 800, "luxury": 1800, "currency": "EUR" },
  "highlights": ["Top highlight 1", "Top highlight 2", "Top highlight 3"],
  "suggestions": [
    {
      "type": "destination",
      "refId": "MongoDB _id from search results, or null if not matched",
      "name": "Place name",
      "reason": "Why it fits this traveller"
    }
  ],
  "tips": ["Practical tip 1", "Practical tip 2"]
}
${JSON_END}

The JSON must be valid. The suggestions array should include 3-8 items mixing destinations, activities, and hotels. Always set refId to the _id string from the search results when you reference a specific item, or null otherwise.`;
}

function buildContextBlock(searchResults) {
  if (!searchResults?.length) return 'No search results available.';

  const sections = { destinations: [], activities: [], hotels: [] };
  for (const r of searchResults) {
    sections[r._collection]?.push(r);
  }

  const lines = [];

  if (sections.destinations.length) {
    lines.push('## Relevant Destinations');
    for (const d of sections.destinations) {
      lines.push(
        `- **${d.name}** (id: ${d._id}) — ${d.city || d.country} | Score: ${d.score?.toFixed(3)}` +
        `\n  ${d.shortDescription || d.description?.slice(0, 120) || ''}`
      );
    }
  }

  if (sections.activities.length) {
    lines.push('\n## Relevant Activities');
    for (const a of sections.activities) {
      lines.push(
        `- **${a.name}** (id: ${a._id}) — ${a.category} | ${a.priceLevel} | Score: ${a.score?.toFixed(3)}` +
        `\n  ${a.description?.slice(0, 120) || ''}`
      );
    }
  }

  if (sections.hotels.length) {
    lines.push('\n## Relevant Hotels');
    for (const h of sections.hotels) {
      lines.push(
        `- **${h.name}** (id: ${h._id}) — ${h.starRating}★ | ${h.priceLevel} | Score: ${h.score?.toFixed(3)}` +
        `\n  ${h.description?.slice(0, 120) || ''}`
      );
    }
  }

  return lines.join('\n');
}

function buildPreferencesBlock(prefs) {
  if (!prefs) return '';
  const parts = [];
  if (prefs.travelStyle)              parts.push(`Travel style: ${prefs.travelStyle}`);
  if (prefs.destinations?.length)     parts.push(`Interested in: ${prefs.destinations.join(', ')}`);
  if (prefs.currencies?.length)       parts.push(`Currencies: ${prefs.currencies.join(', ')}`);
  return parts.length ? `**Traveller preferences:** ${parts.join(' | ')}` : '';
}

function buildMessages(userQuery, searchResults, userPreferences, chatHistory) {
  const messages = [{ role: 'system', content: buildSystemPrompt() }];

  // Inject search context + user preferences as a leading assistant-facing message
  const contextParts = [
    '## Search Results (use these to ground your recommendations)',
    buildContextBlock(searchResults),
  ];
  const prefBlock = buildPreferencesBlock(userPreferences);
  if (prefBlock) contextParts.push(`\n${prefBlock}`);

  messages.push({ role: 'user', content: contextParts.join('\n') });
  messages.push({ role: 'assistant', content: 'Understood. I will base my recommendations on these results.' });

  // Inject last 10 messages of chat history for continuity
  if (chatHistory?.length) {
    const recent = chatHistory.slice(-10);
    for (const msg of recent) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  // The current user query
  messages.push({ role: 'user', content: userQuery });

  return messages;
}

// ── Core generator ────────────────────────────────────────────────────────────

/**
 * Streams a personalised travel recommendation via GPT-4o.
 *
 * Yields a sequence of typed events:
 *   { type: 'chunk',     content: string }          — narrative text chunk (stream to UI)
 *   { type: 'sources',   data: Array }               — referenced search results
 *   { type: 'itinerary', data: object }              — parsed structured itinerary
 *
 * The caller (streamService) is responsible for translating these into SSE events.
 *
 * @param {string}   userQuery
 * @param {Array}    searchResults   from combinedSearch / individual searches
 * @param {object}   userPreferences user.preferences object (optional)
 * @param {Array}    chatHistory     array of { role, content } messages (optional)
 * @param {object}   opts
 * @param {AbortSignal} opts.signal  AbortSignal to cancel the stream on client disconnect
 */
async function* generateItinerary(userQuery, searchResults, userPreferences, chatHistory, { signal } = {}) {
  const messages = buildMessages(userQuery, searchResults ?? [], userPreferences, chatHistory);

  const controller = new AbortController();
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let stream;
  try {
    stream = await getOpenAI().chat.completions.create(
      { model: OPENAI_MODEL, messages, stream: true },
      { signal: controller.signal }
    );
  } catch (err) {
    logger.error('OpenAI stream creation failed:', err.message);
    throw err;
  }

  // Streaming state
  let pending    = '';  // text not yet yielded (buffered to catch split markers)
  let jsonMode   = false;
  let jsonBuffer = '';
  const SAFE_LEN = JSON_START.length; // number of chars to keep unsubmitted as lookahead

  try {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (!delta) continue;

      if (jsonMode) {
        jsonBuffer += delta;
        continue;
      }

      pending += delta;

      const startIdx = pending.indexOf(JSON_START);
      if (startIdx !== -1) {
        // Emit text before the JSON marker
        const textBefore = pending.slice(0, startIdx).trimEnd();
        if (textBefore) yield { type: 'chunk', content: textBefore };

        // Accumulate everything after the start marker as JSON
        jsonBuffer = pending.slice(startIdx + JSON_START.length);
        jsonMode   = true;
        pending    = '';
      } else {
        // Emit the safe portion (keep last SAFE_LEN chars to handle split markers)
        const safeEnd = Math.max(0, pending.length - SAFE_LEN);
        if (safeEnd > 0) {
          yield { type: 'chunk', content: pending.slice(0, safeEnd) };
          pending = pending.slice(safeEnd);
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      logger.error('OpenAI stream error:', err.message);
      throw err;
    }
    return; // client disconnected — stop gracefully
  }

  // Flush remaining text (if the model never wrote JSON)
  if (pending && !jsonMode) {
    yield { type: 'chunk', content: pending };
  }

  // Emit sources (top results that grounded the response)
  yield {
    type: 'sources',
    data: (searchResults ?? []).slice(0, 15).map((r) => ({
      _id:        r._id,
      name:       r.name,
      collection: r._collection,
      score:      r.score,
    })),
  };

  // Parse and emit the structured itinerary JSON
  if (jsonBuffer) {
    const endIdx = jsonBuffer.lastIndexOf(JSON_END);
    const jsonStr = (endIdx !== -1 ? jsonBuffer.slice(0, endIdx) : jsonBuffer).trim();
    try {
      const itinerary = JSON.parse(jsonStr);
      yield { type: 'itinerary', data: itinerary };
    } catch (parseErr) {
      logger.warn('Could not parse itinerary JSON from LLM response:', parseErr.message);
    }
  }
}

module.exports = { generateItinerary };
