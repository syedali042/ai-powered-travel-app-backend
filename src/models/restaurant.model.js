const mongoose = require('mongoose');

const { Schema } = mongoose;

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    destinationId: { type: Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },
    description: String,
    cuisineType: [
      {
        type: String,
        enum: [
          'italian', 'french', 'japanese', 'chinese', 'indian', 'mexican',
          'mediterranean', 'american', 'middle_eastern', 'thai', 'spanish',
          'greek', 'korean', 'vietnamese', 'fusion', 'local',
        ],
      },
    ],
    priceLevel: {
      type: String,
      enum: ['budget', 'mid', 'luxury'],
    },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number], // [longitude, latitude]
    },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },
    dietaryOptions: [
      {
        type: String,
        enum: ['vegan', 'vegetarian', 'halal', 'kosher', 'gluten_free', 'dairy_free', 'nut_free'],
      },
    ],
    images: [{ url: String, caption: String }],
    openingHours: { type: Map, of: String },
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

restaurantSchema.index({ coordinates: '2dsphere' });
restaurantSchema.index({ destinationId: 1, cuisineType: 1, priceLevel: 1 });

// Atlas Vector Search index on `embedding`:
// { "name": "restaurant_vector_index", "type": "vectorSearch",
//   "fields": [{ "type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine" }] }

module.exports = mongoose.model('Restaurant', restaurantSchema);
