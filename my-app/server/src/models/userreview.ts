import { Schema, model, Document } from 'mongoose';

const mongoose = require('mongoose');

export interface IReview extends Document {
  university?: string;
  dorm?: string;
  room: number;
  bathroom: number;
  building: number;
  amenities: number;
  location: number;
  description: string;
  year: number[];
  roomType: string[];
  wouldDormAgain?: boolean;
  fileImage?: string;
  images?: string[];
  createdAt?: Date;
  user?: string;
  status?: string;
  verified?: boolean;
}

const reviewSchema = new Schema<IReview>({
  university: { type: String },
  dorm: { type: String },
  room: { type: Number, required: true },
  bathroom: { type: Number, required: true },
  building: { type: Number, required: true },
  amenities: { type: Number, required: true },
  location: { type: Number, required: true },
  description: { type: String, required: true },
  year: { type: [Number], required: true },
  roomType: { type: [String], required: true },
  wouldDormAgain: { type: Boolean, default: false },
  fileImage: { type: String },
  images: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  user: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  verified: { type: Boolean, default: false }
});

// Performance: Compound index for the most common query pattern (university + dorm + status)
reviewSchema.index({ university: 1, dorm: 1, status: 1 });
// Performance: Index for sorting by createdAt (used by all listing queries)
reviewSchema.index({ createdAt: -1 });
// Performance: Index for user-specific review lookups
reviewSchema.index({ user: 1 });
// Performance: Index for admin pending reviews
reviewSchema.index({ status: 1, createdAt: -1 });

export const UserReview = model<IReview>('userreview', reviewSchema);
export const userreview = UserReview;