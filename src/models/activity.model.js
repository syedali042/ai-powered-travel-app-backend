const mongoose = require('mongoose');

const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    destinationId: { type: Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },
    description: { type: String },
    category: {
      type: String,
      required: true,
      enum: ['food', 'adventure', 'cultural', 'nightlife', 'nature', 'shopping', 'wellness', 'transport'],
    },
    duration: { type: Number }, // hours
    priceRange: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' },
    },
    priceLevel: {
      type: String,
      enum: ['free', 'budget', 'mid', 'luxury'],
    },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number], // [longitude, latitude]
    },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },
    images: [{ url: String, caption: String }],
    openingHours: {
      // e.g. { Mon: '09:00-18:00', Tue: '09:00-18:00', ... }
      type: Map,
      of: String,
    },
    bookingUrl: String,
    tags: [String],
    embedding: {
      type: [Number],
      select: false,
      validate: {
        validator: (v) => v.length === 0 || v.length === 1024,
        message: 'Embedding must be 1024 dimensions',
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

activitySchema.index({ coordinates: '2dsphere' });
activitySchema.index({ destinationId: 1, category: 1 });

// Atlas Vector Search index on `embedding`:
// { "name": "activity_vector_index", "type": "vectorSearch",
//   "fields": [{ "type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine" }] }

module.exports = mongoose.model('Activity', activitySchema);
