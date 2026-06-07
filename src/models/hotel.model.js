const mongoose = require('mongoose');

const { Schema } = mongoose;

const hotelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    destinationId: { type: Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },
    description: String,
    starRating: { type: Number, min: 1, max: 5 },
    pricePerNight: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' },
    },
    priceLevel: {
      type: String,
      enum: ['budget', 'mid', 'luxury'],
    },
    amenities: [
      {
        type: String,
        enum: [
          'wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking',
          'airport_shuttle', 'pet_friendly', 'beach_access', 'room_service',
          'air_conditioning', 'concierge', 'business_center',
        ],
      },
    ],
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number], // [longitude, latitude]
    },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },
    images: [{ url: String, caption: String, isPrimary: { type: Boolean, default: false } }],
    bookingUrl: String,
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

hotelSchema.index({ coordinates: '2dsphere' });
hotelSchema.index({ destinationId: 1, priceLevel: 1, starRating: -1 });

// Atlas Vector Search index on `embedding`:
// { "name": "hotel_vector_index", "type": "vectorSearch",
//   "fields": [{ "type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine" }] }

module.exports = mongoose.model('Hotel', hotelSchema);
