const OpenAI = require('openai');
const ChatSession = require('../models/chatSession.model');
const Trip = require('../models/trip.model');
const User = require('../models/user.model');
const { generateEmbedding } = require('./embeddingService');
const { extractFilters } = require('./filterExtractor');
const { combinedSearch } = require('./vectorSearchService');
const { generateItinerary } = require('./ragService');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

// Lazy OpenAI — used only for intent detection and context summarization
let _openai = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const FAST_MODEL       = process.env.OPENAI_FAST_MODEL || 'gpt-4o-mini';
const HISTORY_WINDOW   = 20;   // messages kept verbatim
const MAX_CONTEXT_CHARS = 48_000; // ≈12 K tokens budget

// ── Session management ─────────────────────────────────────────────────────────

async function getOrCreateSession(userId, { sessionId, tripId } = {}) {
  if (sessionId) {
    const session = await ChatSession.findById(sessionId);
    if (!session) throw new NotFoundError('Chat session');
    if (session.userId.toString() !== userId.toString()) throw new ForbiddenError();
    return session;
  }

  if (tripId) {
    const existing = await ChatSession.findOne({ userId, tripId }).sort({ updatedAt: -1 });
    if (existing) return existing;
  }

  return ChatSession.create({ userId, tripId: tripId || null, messages: [] });
}

async function getSessions(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [sessions, total] = await Promise.all([
    ChatSession.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-messages') // omit messages for the list view
      .lean(),
    ChatSession.countDocuments({ userId }),
  ]);
  return { sessions, total, page, limit };
}

async function getSessionById(sessionId, userId) {
  const session = await ChatSession.findById(sessionId);
  if (!session) throw new NotFoundError('Chat session');
  if (session.userId.toString() !== userId.toString()) throw new ForbiddenError();
  return session;
}

async function deleteSession(sessionId, userId) {
  const session = await ChatSession.findById(sessionId);
  if (!session) throw new NotFoundError('Chat session');
  if (session.userId.toString() !== userId.toString()) throw new ForbiddenError();
  await session.deleteOne();
}

// ── Context management — B8.6 ─────────────────────────────────────────────────

function truncateToTokenBudget(messages) {
  let totalChars = 0;
  const result = [];
  for (const msg of [...messages].reverse()) {
    const chars = (msg.content || '').length;
    if (totalChars + chars > MAX_CONTEXT_CHARS) break;
    result.unshift(msg);
    totalChars += chars;
  }
  return result;
}

async function summarizeMessages(messages) {
  const text = messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const response = await getOpenAI().chat.completions.create({
    model: FAST_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Summarize the following travel planning conversation in 3–5 sentences. ' +
          'Preserve key travel preferences, decided destinations, budget constraints, and confirmed plans.',
      },
      { role: 'user', content: text },
    ],
    max_tokens: 400,
    temperature: 0.2,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Build the history array to pass into ragService.generateItinerary.
 * - Takes the last HISTORY_WINDOW messages verbatim.
 * - If older messages exist, summarizes them via GPT-4o-mini and injects as
 *   a system message at the front of the window.
 * - Applies the 12K-token budget cap.
 *
 * @param {Array} messages  Full session.messages array (excluding the current user turn)
 */
async function buildHistoryContext(messages) {
  if (!messages.length) return [];

  const recentMessages = messages.slice(-HISTORY_WINDOW);
  const olderMessages  = messages.slice(0, messages.length - HISTORY_WINDOW);

  if (olderMessages.length > 0 && process.env.OPENAI_API_KEY) {
    try {
      const summary = await summarizeMessages(olderMessages);
      const withSummary = [
        { role: 'system', content: `Previous conversation summary:\n${summary}` },
        ...recentMessages,
      ];
      return truncateToTokenBudget(withSummary);
    } catch (err) {
      logger.warn(`Context summarization failed: ${err.message}`);
    }
  }

  return truncateToTokenBudget(recentMessages);
}

// ── Intent detection — B8.7 ───────────────────────────────────────────────────

const INTENT_PROMPT =
  'Classify this travel message into exactly one intent. Reply with ONLY the single word.\n\n' +
  'Intents:\n' +
  '- plan: creating or building an itinerary or trip\n' +
  '- search: finding places, activities, or hotels\n' +
  '- modify: changing, updating, or removing something from an existing plan\n' +
  '- question: asking for facts, tips, or information\n' +
  '- compare: comparing multiple options or alternatives\n' +
  '- book: requesting to purchase, reserve, or book something\n\n' +
  'Message: ';

const VALID_INTENTS = ['plan', 'search', 'modify', 'question', 'compare', 'book'];

async function detectIntent(message) {
  if (!process.env.OPENAI_API_KEY) return 'plan';

  try {
    const response = await getOpenAI().chat.completions.create({
      model: FAST_MODEL,
      messages: [{ role: 'user', content: INTENT_PROMPT + message }],
      max_tokens: 5,
      temperature: 0,
    });
    const raw = (response.choices[0]?.message?.content || '').toLowerCase().trim();
    return VALID_INTENTS.includes(raw) ? raw : 'plan';
  } catch (err) {
    logger.warn(`Intent detection failed: ${err.message}`);
    return 'plan';
  }
}

// ── Trip context — B8.6 ───────────────────────────────────────────────────────

async function buildTripContext(tripId) {
  if (!tripId) return null;
  try {
    const trip = await Trip.findOne({ _id: tripId, isActive: true }).lean();
    if (!trip) return null;

    const parts = [`Trip: "${trip.title}" (${trip.status})`];
    if (trip.startDate) {
      parts.push(
        `Dates: ${trip.startDate.toDateString()} – ${trip.endDate?.toDateString() || 'TBD'}`
      );
    }
    if (trip.budget?.total) parts.push(`Budget: ${trip.budget.currency} ${trip.budget.total}`);
    if (trip.travelers?.count) {
      parts.push(`Travelers: ${trip.travelers.count} (${trip.travelers.type || 'unspecified'})`);
    }
    if (trip.itinerary?.length) {
      parts.push(`Itinerary: ${trip.itinerary.length} days already planned`);
    }

    return parts.join(' | ');
  } catch (err) {
    logger.warn(`Trip context load failed: ${err.message}`);
    return null;
  }
}

// ── Main pipeline — B8.2 ──────────────────────────────────────────────────────

/**
 * Full chat pipeline as an async generator. Yields typed SSE events:
 *   { type: 'intent',    data: { intent, sessionId } }
 *   { type: 'chunk',     content: string }             ← narrative text
 *   { type: 'sources',   data: Array }                  ← vector search results
 *   { type: 'itinerary', data: object }                 ← structured JSON block
 *
 * The caller (chat.controller) is responsible for:
 *   - Setting up SSE headers before iterating
 *   - Calling finalizeSession() after consuming all events
 *
 * @param {string}  userId
 * @param {string}  message  Current user message (already saved to session)
 * @param {object}  session  Mongoose ChatSession document (with user msg appended)
 * @param {object}  opts
 * @param {AbortSignal} opts.signal
 */
async function* runPipeline(userId, message, session, { signal } = {}) {
  // ── Step 1: Intent detection (fast — runs first so frontend can update UI) ──
  const intent = await detectIntent(message);
  yield { type: 'intent', data: { intent, sessionId: session._id } };

  // Booking not yet supported — short-circuit before any expensive calls
  if (intent === 'book') {
    yield {
      type: 'chunk',
      content:
        "Booking isn't available yet. I can help you discover and plan options — " +
        'want me to search for something that matches your needs?',
    };
    return;
  }

  // ── Step 2: Load user profile (preferences + embedding for re-ranking) ──────
  const userDoc = await User.findById(userId).select('+profileEmbedding').lean();
  const userEmbedding  = userDoc?.profileEmbedding?.length ? userDoc.profileEmbedding : null;
  const userPreferences = userDoc?.preferences || null;

  // ── Step 3: Trip context (enriches the query for better search results) ─────
  const tripContext = await buildTripContext(session.tripId);
  const enrichedMessage = tripContext
    ? `${message}\n\n[Trip context: ${tripContext}]`
    : message;

  // ── Step 4: Parallel — filter extraction + query embedding ──────────────────
  let filters = {};
  let queryEmbedding;

  try {
    [filters, queryEmbedding] = await Promise.all([
      extractFilters(enrichedMessage),
      generateEmbedding(enrichedMessage),
    ]);
  } catch (err) {
    logger.error('Pipeline setup (filters/embedding) failed:', err.message);
    // Try a bare embedding without filters before giving up
    try {
      queryEmbedding = await generateEmbedding(message);
    } catch (embErr) {
      yield {
        type: 'chunk',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      };
      return;
    }
  }

  // ── Step 5: Atlas Vector Search + optional preference re-ranking ─────────────
  const searchResults = await combinedSearch(queryEmbedding, {
    filters,
    limitPerType: 8,
    totalLimit: 15,
    userEmbedding,
  });

  // ── Step 6: Sliding-window history context (excludes current user message) ───
  // session.messages already has the user message appended — slice it off so
  // ragService doesn't see the current turn twice (it appends userQuery itself).
  const historyContext = await buildHistoryContext(
    session.messages.slice(0, session.messages.length - 1)
  );

  // ── Step 7: RAG generation — forward all events from ragService ───────────────
  const ragGen = generateItinerary(
    enrichedMessage,
    searchResults,
    userPreferences,
    historyContext,
    { signal }
  );

  for await (const event of ragGen) {
    yield event;
  }
}

// ── Session persistence (called by controller after stream completes) ─────────

/**
 * Appends the assistant response to the session, updates the context snapshot,
 * and optionally updates the associated Trip document with AI-generated metadata.
 *
 * @param {object}  session          Mongoose ChatSession document
 * @param {string}  assistantContent Full response text
 * @param {Array}   sources          Vector search results forwarded in the stream
 * @param {object|null} itinerary    Parsed itinerary JSON (or null if not generated)
 */
async function finalizeSession(session, assistantContent, sources, itinerary) {
  session.messages.push({
    role: 'assistant',
    content: assistantContent,
    timestamp: new Date(),
    metadata: {
      vectorSearchResults: sources.slice(0, 10).map((r) => ({
        refId: r._id,
        entityType: r._collection,
        score: r.score,
      })),
      model: process.env.OPENAI_MODEL || 'gpt-4o',
    },
  });

  session.context = {
    lastVectorSearchResults: sources.slice(0, 5).map((r) => ({
      entityType: r._collection,
      refId: r._id,
      score: r.score ?? 0,
      snippet: r.shortDescription || r.description?.slice(0, 150) || '',
    })),
    preferencesSnapshot: session.context?.preferencesSnapshot,
  };

  await session.save();

  // If a trip is linked and the AI generated a structured itinerary, update the trip title
  if (itinerary && session.tripId) {
    try {
      const tripUpdate = {};
      if (itinerary.title) tripUpdate.title = itinerary.title;
      if (Object.keys(tripUpdate).length) {
        await Trip.findByIdAndUpdate(session.tripId, { $set: tripUpdate });
      }
    } catch (err) {
      logger.warn(`Trip update from itinerary failed: ${err.message}`);
    }
  }
}

module.exports = {
  getOrCreateSession,
  getSessions,
  getSessionById,
  deleteSession,
  runPipeline,
  finalizeSession,
};
