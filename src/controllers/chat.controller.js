const chatService = require('../services/chatService');
const { initSSE, sendEvent } = require('../services/streamService');
const { success, paginated } = require('../utils/response');
const logger = require('../utils/logger');

const HEARTBEAT_INTERVAL_MS = 15_000;

// ── POST /api/v1/chat ─────────────────────────────────────────────────────────

async function chat(req, res, next) {
  const { message, tripId, sessionId } = req.body;
  const userId = req.user._id;

  // Load or create session — surface errors as normal HTTP responses (before SSE starts)
  let session;
  try {
    session = await chatService.getOrCreateSession(userId, { sessionId, tripId });
  } catch (err) {
    return next(err);
  }

  // Persist the user message immediately so it survives a crash mid-stream
  session.messages.push({ role: 'user', content: message, timestamp: new Date() });
  await session.save();

  // ── SSE setup ────────────────────────────────────────────────────────────────
  initSSE(req, res);

  const abortController = new AbortController();
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) res.write(': heartbeat\n\n');
  }, HEARTBEAT_INTERVAL_MS);

  req.on('close', () => {
    clearInterval(heartbeat);
    abortController.abort();
    logger.debug('Chat SSE client disconnected — pipeline aborted');
  });

  // Accumulators — captured while streaming, saved after the stream ends
  let assistantContent = '';
  let sources          = [];
  let itinerary        = null;

  try {
    const pipeline = chatService.runPipeline(userId, message, session, {
      signal: abortController.signal,
    });

    for await (const event of pipeline) {
      if (abortController.signal.aborted) break;

      switch (event.type) {
        case 'intent':
          sendEvent(res, { type: 'intent', data: event.data });
          break;

        case 'chunk':
          assistantContent += event.content;
          sendEvent(res, { type: 'message', content: event.content });
          break;

        case 'sources':
          sources = event.data ?? [];
          sendEvent(res, { type: 'sources', data: event.data });
          break;

        case 'itinerary':
          itinerary = event.data;
          sendEvent(res, { type: 'itinerary', data: event.data });
          break;

        default:
          logger.warn('Unknown chat pipeline event:', event.type);
      }
    }

    if (!res.writableEnded) {
      sendEvent(res, { type: 'done' });
    }

    // Persist assistant response + update session context
    if (assistantContent) {
      await chatService.finalizeSession(session, assistantContent, sources, itinerary);
    }
  } catch (err) {
    logger.error('Chat pipeline error:', err.message);
    if (!res.writableEnded) {
      sendEvent(res, { type: 'error', message: 'An error occurred. Please try again.' });
    }
  } finally {
    clearInterval(heartbeat);
    if (!res.writableEnded) res.end();
  }
}

// ── GET /api/v1/chat/sessions ─────────────────────────────────────────────────

async function getSessions(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const result = await chatService.getSessions(req.user._id, { page, limit });
    return paginated(res, result.sessions, result);
  } catch (err) {
    next(err);
  }
}

// ── GET /api/v1/chat/sessions/:id ─────────────────────────────────────────────

async function getSession(req, res, next) {
  try {
    const session = await chatService.getSessionById(req.params.id, req.user._id);
    return success(res, session);
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/v1/chat/sessions/:id ─────────────────────────────────────────

async function deleteSession(req, res, next) {
  try {
    await chatService.deleteSession(req.params.id, req.user._id);
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { chat, getSessions, getSession, deleteSession };
