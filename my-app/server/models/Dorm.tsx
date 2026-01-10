import { Schema, model, Document } from 'mongoose';

export interface IDorm extends Document {
  name: string;
  slug: string;
  universitySlug: string;
  imageUrl?: string;
  images?: string[];
  rating?: number;
  totalReviews?: number;
  description?: string;
  amenities?: string[];
  roomTypes?: string[];
  createdAt?: Date;
  // New fields for user-submitted dorms requiring admin approval
  status?: 'pending' | 'approved' | 'declined';
  submittedBy?: string; // User email who submitted the dorm
}

const dormSchema = new Schema<IDorm>({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  universitySlug: { type: String, required: true },
  imageUrl: { type: String },
  images: { type: [String], default: [] },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  description: { type: String },
  amenities: { type: [String], default: [] },
  roomTypes: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  // New fields for admin approval workflow
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'approved' },
  submittedBy: { type: String }
});

// Compound index for universitySlug + slug
dormSchema.index({ universitySlug: 1, slug: 1 }, { unique: true });

export const Dorm = model<IDorm>('Dorm', dormSchema);
export const dorm = Dorm;

export default Dorm;