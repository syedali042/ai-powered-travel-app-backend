const logger = require('../utils/logger');

const HEARTBEAT_INTERVAL_MS = 15_000;

// ── SSE helpers ───────────────────────────────────────────────────────────────

/**
 * Writes one SSE frame to the response.
 * Each frame is:  "data: <json>\n\n"
 */
function sendEvent(res, payload) {
  if (res.writableEnded) return;
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

/**
 * Set the required SSE response headers and flush immediately.
 * Must be called before any other writes.
 */
function initSSE(req, res) {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();
}

// ── Main streaming handler ────────────────────────────────────────────────────

/**
 * Pipes the output of a ragService.generateItinerary() async generator to an
 * HTTP response as Server-Sent Events (SSE).
 *
 * SSE event types emitted:
 *   { type: 'message',   content: string }    — narrative text chunk
 *   { type: 'sources',   data: Array }         — search results that grounded the response
 *   { type: 'itinerary', data: object }        — parsed structured JSON itinerary
 *   { type: 'done' }                           — stream finished
 *   { type: 'error',     message: string }     — unrecoverable error
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {AsyncGenerator}             generator  from ragService.generateItinerary()
 */
async function streamRAGResponse(req, res, generator) {
  initSSE(req, res);

  // AbortController lets us cancel the OpenAI stream when the client disconnects
  const abortController = new AbortController();

  // Heartbeat: keeps the connection alive through proxies that time out idle connections
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': heartbeat\n\n'); // SSE comment — ignored by browsers
    }
  }, HEARTBEAT_INTERVAL_MS);

  // Client disconnect handler
  req.on('close', () => {
    clearInterval(heartbeat);
    abortController.abort();
    logger.debug('SSE client disconnected — stream aborted');
  });

  try {
    for await (const event of generator) {
      if (abortController.signal.aborted) break;

      switch (event.type) {
        case 'chunk':
          sendEvent(res, { type: 'message', content: event.content });
          break;

        case 'sources':
          sendEvent(res, { type: 'sources', data: event.data });
          break;

        case 'itinerary':
          sendEvent(res, { type: 'itinerary', data: event.data });
          break;

        default:
          logger.warn('streamRAGResponse: unknown event type', event.type);
      }
    }

    // Signal completion to the client
    if (!res.writableEnded) {
      sendEvent(res, { type: 'done' });
    }
  } catch (err) {
    logger.error('streamRAGResponse error:', err.message);
    if (!res.writableEnded) {
      sendEvent(res, { type: 'error', message: 'Stream error — please try again.' });
    }
  } finally {
    clearInterval(heartbeat);
    if (!res.writableEnded) res.end();
  }
}

module.exports = { streamRAGResponse, initSSE, sendEvent };
