const mongoose = require('mongoose');

// MongoDB TTL collection for external API response caching.
// Each document expires automatically when its expiresAt timestamp is reached
// (expireAfterSeconds: 0 instructs MongoDB to use the field value directly).
const cacheSchema = new mongoose.Schema(
  {
    key:      { type: String, required: true, unique: true },
    data:     { type: mongoose.Schema.Types.Mixed, required: true },
    provider: { type: String },
    expiresAt:{ type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true, collection: 'api_cache' }
);

module.exports = mongoose.model('ApiCache', cacheSchema);
