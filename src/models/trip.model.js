const mongoose = require('mongoose');

const { Schema } = mongoose;

const itineraryItemSchema = new Schema(
  {
    type: { type: String, enum: ['activity', 'hotel', 'transport'], required: true },
    refId: { type: Schema.Types.ObjectId }, // ref to Activity / Hotel
    time: String, // e.g. '09:00'
    duration: Number, // hours
    notes: String,
  },
  { _id: false }
);

const itineraryDaySchema = new Schema(
  {
    dayNumber: { type: Number, required: true },
    date: Date,
    items: [itineraryItemSchema],
  },
  { _id: false }
);

const tripDestinationSchema = new Schema(
  {
    destinationId: { type: Schema.Types.ObjectId, ref: 'Destination', required: true },
    arrivalDate: Date,
    departureDate: Date,
  },
  { _id: false }
);

const tripSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['draft', 'planned', 'active', 'completed'],
      default: 'draft',
    },
    startDate: Date,
    endDate: Date,
    budget: {
      total: Number,
      currency: { type: String, default: 'USD' },
    },
    travelers: {
      count: { type: Number, default: 1, min: 1 },
      type: { type: String, enum: ['solo', 'couple', 'family', 'group', 'business'] },
    },
    destinations: [tripDestinationSchema],
    itinerary: [itineraryDaySchema],
    sharedWith: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    // Inline chat history on the trip (lightweight; full sessions use ChatSession)
    chatHistory: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    // TTL field: set to createdAt + 30 days when status is 'draft'; cleared on promotion
    draftExpiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

tripSchema.index({ userId: 1, status: 1 });
tripSchema.index({ 'destinations.destinationId': 1 });

// Pre-save: auto-populate draftExpiresAt for new drafts; clear it when promoted
tripSchema.pre('save', function (next) {
  if (this.isNew && this.status === 'draft') {
    this.draftExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else if (this.isModified('status') && this.status !== 'draft') {
    this.draftExpiresAt = undefined;
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
