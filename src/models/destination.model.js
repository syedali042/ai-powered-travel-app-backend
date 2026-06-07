const mongoose = require('mongoose');

const { Schema } = mongoose;

const budgetTierSchema = new Schema(
  {
    budget: { type: Number },
    mid: { type: Number },
    luxury: { type: Number },
    currency: { type: String, default: 'USD' },
  },
  { _id: false }
);

const destinationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    region: { type: String, trim: true },
    description: { type: String }, // rich text (HTML or Markdown)
    shortDescription: { type: String, maxlength: 300 },
    coordinates: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    category: [
      {
        type: String,
        enum: ['historical', 'beach', 'adventure', 'cultural', 'nature', 'urban', 'wellness', 'family'],
      },
    ],
    bestMonths: [{ type: String, enum: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] }],
    avgDailyBudget: { type: budgetTierSchema },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },
    images: [{ url: String, caption: String, isPrimary: { type: Boolean, default: false } }],
    tags: [String],
    // Voyage AI voyage-3.5-lite produces 1024-dim vectors
    embedding: {
      type: [Number],
      select: false,
      validate: {
        validator: (v) => v.length === 0 || v.length === 1024,
        message: 'Embedding must be 1024 dimensions',
      },
    },
    metadata: {
      climate: String,
      language: [String],
      currency: String,
      timezone: String,
      visaInfo: String,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Standard Mongoose-managed indexes
destinationSchema.index({ coordinates: '2dsphere' });
destinationSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
destinationSchema.index({ country: 1, category: 1 });

// Atlas Vector Search index on `embedding` must be created in Atlas UI / Atlas CLI:
// {
//   "name": "destination_vector_index",
//   "type": "vectorSearch",
//   "fields": [{ "type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine" }]
// }

module.exports = mongoose.model('Destination', destinationSchema);
