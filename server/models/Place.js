const mongoose = require('mongoose');
const { calculateTrustScore } = require('../utils/trustScore');

const CATEGORIES = [
  'cafe',
  'study',
  'food',
  'hangout',
  'event',
  'other',
];

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Place name is required'],
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: CATEGORIES,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    address: {
      line1: { type: String, trim: true, default: '' },
      line2: { type: String, trim: true, default: '' },
      building: { type: String, trim: true, default: '' },
      floor: { type: String, trim: true, default: '' },
      area: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
      countryCode: { type: String, trim: true, uppercase: true, default: '' },
      formatted: { type: String, trim: true, default: '' },
    },
    shortNote: {
      type: String,
      required: [true, 'Short note is required'],
      maxlength: 280,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'Maximum 10 tags allowed',
      },
    },
    photo: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    visitedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    upvoteCount: {
      type: Number,
      default: 0,
    },
    visitedCount: {
      type: Number,
      default: 0,
    },
    trustScore: {
      type: Number,
      default: 0,
    },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

placeSchema.index({ location: '2dsphere' });
placeSchema.index({ moderationStatus: 1, trustScore: -1, createdAt: -1 });
placeSchema.index({ 'address.country': 1, 'address.city': 1, 'address.area': 1 });

placeSchema.pre('save', function (next) {
  if (this.lat != null && this.lng != null) {
    this.location = {
      type: 'Point',
      coordinates: [this.lng, this.lat],
    };
  }

  const upvotes = this.upvotedBy?.length ?? this.upvoteCount ?? 0;
  const visits = this.visitedBy?.length ?? this.visitedCount ?? 0;
  this.upvoteCount = upvotes;
  this.visitedCount = visits;
  this.trustScore = calculateTrustScore(this.upvoteCount, this.visitedCount);
  next();
});

placeSchema.methods.recalculateTrust = function () {
  this.upvoteCount = this.upvotedBy.length;
  this.visitedCount = this.visitedBy.length;
  this.trustScore = calculateTrustScore(this.upvoteCount, this.visitedCount);
};

module.exports = mongoose.model('Place', placeSchema);
module.exports.CATEGORIES = CATEGORIES;