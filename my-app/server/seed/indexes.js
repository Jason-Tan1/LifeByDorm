// MongoDB Index Creation Script
// Run this to optimize database query performance
// Execute: node seed/indexes.js

require('dotenv').config();
const mongoose = require('mongoose');

async function createIndexes() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebydorm';
        console.log('🔌 Connecting to MongoDB...');

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });

        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // Universities collection indexes
        console.log('📊 Creating indexes for universities collection...');
        await db.collection('universities').createIndex({ slug: 1 }, { unique: true, background: true });
        await db.collection('universities').createIndex({ name: 1 }, { background: true });
        console.log('   ✅ universities indexes created');

        // Dorms collection indexes
        console.log('📊 Creating indexes for dorms collection...');
        await db.collection('dorms').createIndex({ universitySlug: 1, slug: 1 }, { unique: true, background: true });
        await db.collection('dorms').createIndex({ universitySlug: 1, status: 1 }, { background: true });
        await db.collection('dorms').createIndex({ status: 1 }, { background: true });
        await db.collection('dorms').createIndex({ name: 1 }, { background: true });
        console.log('   ✅ dorms indexes created');

        // UserReviews collection indexes
        console.log('📊 Creating indexes for userreviews collection...');
        await db.collection('userreviews').createIndex({ university: 1, dorm: 1 }, { background: true });
        await db.collection('userreviews').createIndex({ university: 1, status: 1 }, { background: true });
        await db.collection('userreviews').createIndex({ status: 1, createdAt: -1 }, { background: true });
        await db.collection('userreviews').createIndex({ user: 1, createdAt: -1 }, { background: true });
        await db.collection('userreviews').createIndex({ dorm: 1, status: 1 }, { background: true });
        console.log('   ✅ userreviews indexes created');

        // Users collection indexes
        console.log('📊 Creating indexes for users collection...');
        await db.collection('users').createIndex({ email: 1 }, { unique: true, background: true });
        console.log('   ✅ users indexes created');

        console.log('\n🎉 All indexes created successfully!');
        console.log('\n📈 Performance improvements:');
        console.log('   - University lookups by slug: O(log n)');
        console.log('   - Dorm lookups by university+slug: O(log n)');
        console.log('   - Review filtering by university/dorm: O(log n)');
        console.log('   - User lookups by email: O(log n)');

    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

createIndexes();
