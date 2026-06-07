const mongoose = require('mongoose');

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: {
      // Stores tool call results, citations, confidence scores, etc.
      vectorSearchResults: [{ refId: Schema.Types.ObjectId, entityType: String, score: Number }],
      tokensUsed: Number,
      model: String,
    },
  },
  { _id: false }
);

const chatSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', default: null },
    messages: [messageSchema],
    // Snapshot of context used for this session — refreshed per turn
    context: {
      lastVectorSearchResults: [
        {
          entityType: String, // 'destinations' | 'activities' | 'hotels' | 'restaurants'
          refId: Schema.Types.ObjectId,
          score: Number,
          snippet: String,
        },
      ],
      preferencesSnapshot: {
        destinations: [String],
        travelStyle: String,
        budget: String,
      },
    },
  },
  { timestamps: true }
);

chatSessionSchema.index({ userId: 1, updatedAt: -1 });
chatSessionSchema.index({ tripId: 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
