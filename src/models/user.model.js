const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    preferences: {
      // Travel preferences — used later for vector search personalization
      destinations: [String],
      travelStyle: {
        type: String,
        enum: ['adventure', 'luxury', 'budget', 'cultural', 'family'],
      },
      currencies: [String],
    },
    // Voyage.ai embedding of the user's travel profile (populated later)
    profileEmbedding: {
      type: [Number],
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
