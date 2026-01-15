import { Schema, model, Document } from 'mongoose';

export interface IUniversity extends Document {
  name: string;
  slug: string;
  founded?: number;
  location?: string;
  totalStudents?: number;
  acceptanceRate?: number | null;
  imageUrl?: string;
  website?: string;
  highlights?: string[];
  createdAt?: Date;
}

const universitySchema = new Schema<IUniversity>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  founded: { type: Number },
  location: { type: String },
  totalStudents: { type: Number },
  acceptanceRate: { type: Number },
  imageUrl: { type: String },
  website: { type: String },
  highlights: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export const University = model<IUniversity>('University', universitySchema);
export const university = University;
export default University;
