import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { University } from '../models/Universities';
import { Dorm } from '../models/Dorm';

dotenv.config();

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebydorm';
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // Seed universities
  const uniFilePath = path.resolve(__dirname, 'universityInformation.json');
  if (!fs.existsSync(uniFilePath)) {
    console.error('University seed file not found:', uniFilePath);
    process.exit(1);
  }

  const uniRaw = fs.readFileSync(uniFilePath, 'utf8');
  const universities = JSON.parse(uniRaw) as any[];
  console.log(`Found ${universities.length} universities in seed file`);

  for (const uni of universities) {
    const slug = uni.slug || (uni.name && uni.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    const doc = {
      name: uni.name,
      slug,
      founded: uni.founded || null,
      location: uni.location || null,
      totalStudents: uni.totalStudents || null,
      acceptanceRate: typeof uni.acceptanceRate === 'number' ? uni.acceptanceRate : null,
      imageUrl: uni.imageUrl || uni.imageURL || null,
      website: uni.website || null,
      highlights: Array.isArray(uni.highlights) ? uni.highlights : []
    };

    const res = await University.updateOne({ slug }, { $set: doc }, { upsert: true });
    console.log('Upserted university', slug, res.acknowledged ? 'ok' : JSON.stringify(res));
  }

  // Seed dorms
  const dormFilePath = path.resolve(__dirname, 'dormInformation.json');
  if (fs.existsSync(dormFilePath)) {
    const dormRaw = fs.readFileSync(dormFilePath, 'utf8');
    const dorms = JSON.parse(dormRaw) as any[];
    console.log(`Found ${dorms.length} dorms in seed file`);

    for (const dorm of dorms) {
      const slug = dorm.slug || (dorm.name && dorm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      
      // Handle both single imageUrl and multiple images
      let images: string[] = [];
      if (Array.isArray(dorm.images)) {
        images = dorm.images.filter((img: any) => img);
      } else if (dorm.imageUrl) {
        images = [dorm.imageUrl];
      }
      
      const doc = {
        name: dorm.name,
        slug,
        universitySlug: dorm.universitySlug,
        imageUrl: dorm.imageUrl || null,
        images: images,
        rating: dorm.rating || 0,
        totalReviews: dorm.totalReviews || 0,
        description: dorm.description || null,
        amenities: Array.isArray(dorm.amenities) ? dorm.amenities : [],
        roomTypes: Array.isArray(dorm.roomTypes) ? dorm.roomTypes : []
      };

      const res = await Dorm.updateOne(
        { universitySlug: doc.universitySlug, slug: doc.slug },
        { $set: doc },
        { upsert: true }
      );
      console.log('Upserted dorm', slug, 'for', doc.universitySlug, res.acknowledged ? 'ok' : JSON.stringify(res));
    }
  } else {
    console.log('No dorm seed file found, skipping dorms');
  }

  console.log('Seeding complete');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
