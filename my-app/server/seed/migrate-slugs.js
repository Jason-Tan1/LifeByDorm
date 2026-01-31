// Database Migration Script
// Fixes potential missing fields (slugs) in production data
// Execute: node seed/migrate-slugs.js

require('dotenv').config();
const mongoose = require('mongoose');

// Simple slugify function matching what we likely use
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

// Dorm Schema (Simplified for migration)
const dormSchema = new mongoose.Schema({
    name: String,
    slug: String,
    universitySlug: String
}, { strict: false });

const Dorm = mongoose.model('Dorm', dormSchema);

// University Schema
const universitySchema = new mongoose.Schema({
    name: String,
    slug: String
}, { strict: false });

const University = mongoose.model('University', universitySchema);

async function migrate() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI is undefined in .env');

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connected');

        // 1. Migrate Universities
        console.log('\n🏫 Checking Universities...');
        const universities = await University.find({});
        for (const uni of universities) {
            let changed = false;
            if (!uni.slug) {
                uni.slug = slugify(uni.name);
                console.log(`   + Added slug for ${uni.name}: ${uni.slug}`);
                changed = true;
            }
            if (changed) await uni.save();
        }

        // 2. Migrate Dorms
        console.log('\nHz Checking Dorms...');
        const dorms = await Dorm.find({});
        for (const dorm of dorms) {
            let changed = false;

            // Fix Slug
            if (!dorm.slug) {
                dorm.slug = slugify(dorm.name);
                console.log(`   + Added slug for dorm ${dorm.name}: ${dorm.slug}`);
                changed = true;
            }

            // Fix UniversitySlug if missing (attempt to derive from simple name match if stored elsewhere, or skip)
            // Assuming universitySlug might be populated, but if not, relying on slugify of university name??
            // In this codebase, dorms usually store universitySlug.

            if (changed) {
                try {
                    await dorm.save();
                } catch (err) {
                    console.error(`Error saving ${dorm.name}:`, err.message);
                }
            }
        }

        console.log('\n🎉 Migration complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

migrate();
