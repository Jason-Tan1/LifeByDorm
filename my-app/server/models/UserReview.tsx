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
  year: number;
  roomType: string;
  fileImage?: string;
  images?: string[];
  createdAt?: Date;
  user?: string;
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
  year: { type: Number, required: true },
  roomType: { type: String, required: true },
  fileImage: { type: String },
  images: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  user: { type: String }
});

export const UserReview = model<IReview>('UserReview', reviewSchema);