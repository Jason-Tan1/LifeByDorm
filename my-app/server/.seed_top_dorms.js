require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// Mock Dorm Data
const dormsData = {
    "University of Toronto": [
        { name: "Chestnut Residence" },
        { name: "Innis College" },
        { name: "New College" },
        { name: "St. Michael's College" },
        { name: "Trinity College" },
        { name: "University College" },
        { name: "Victoria College" },
        { name: "Woodsworth College" }
    ],
    "University of British Columbia": [
        { name: "Place Vanier" },
        { name: "Totem Park" },
        { name: "Orchard Commons" },
        { name: "Walter Gage" },
        { name: "Marine Drive" },
        { name: "Ponderosa Commons" },
        { name: "Brock Commons Tallwood House" }
    ],
    "McGill University": [
        { name: "Carrefour Sherbrooke" },
        { name: "La Citadelle" },
        { name: "New Residence Hall" },
        { name: "Royal Victoria College" },
        { name: "Solin Hall" },
        { name: "Douglas Hall" },
        { name: "McConnell Hall" },
        { name: "Molson Hall" }
    ],
    "Western University": [
        { name: "Saugeen-Maitland Hall" },
        { name: "Medway-Sydenham Hall" },
        { name: "Delaware Hall" },
        { name: "Elgin Hall" },
        { name: "Essex Hall" },
        { name: "Perth Hall" },
        { name: "Ontario Hall" },
        { name: "London Hall" }
    ],
    "Queen's University": [
        { name: "Victoria Hall" },
        { name: "Leggett Hall" },
        { name: "Watts Hall" },
        { name: "Brant House" },
        { name: "Smith House" },
        { name: "Gordon Brockington House" },
        { name: "Jean Royce Hall" },
        { name: "Ban Righ Hall" },
        { name: "Chown Hall" },
        { name: "David C. Smith House" },
        { name: "McNeill House" }
    ]
};

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

async function seedTopDorms() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB...");

        // Basic schemas just to query and insert
        const uniSchema = new mongoose.Schema({
            name: String,
            slug: String
        });
        const University = mongoose.models.University || mongoose.model('University', uniSchema, 'universities');

        const dormSchema = new mongoose.Schema({
            name: String,
            slug: String,
            universitySlug: String,
            status: { type: String, default: 'approved' }
        });
        const Dorm = mongoose.models.Dorm || mongoose.model('Dorm', dormSchema, 'dorms');

        let totalAdded = 0;

        for (const uniName of Object.keys(dormsData)) {
            // Find the university in the DB to get its exact slug
            const uni = await University.findOne({ name: uniName });

            if (!uni) {
                console.log(`❌ Skipping ${uniName}: Not found in the database.`);
                continue;
            }

            const uniSlug = uni.slug;

            // Check if dorms already exist for this university
            const existingDormsCount = await Dorm.countDocuments({ universitySlug: uniSlug });

            if (existingDormsCount > 0) {
                console.log(`⏭️  Skipping ${uniName}: Already has ${existingDormsCount} dorms seeded.`);
                continue;
            }

            console.log(`🔨 Seeding dorms for ${uniName}...`);

            const dormsToInsert = dormsData[uniName].map(dorm => ({
                name: dorm.name,
                slug: slugify(dorm.name),
                universitySlug: uniSlug,
                status: 'approved'
            }));

            await Dorm.insertMany(dormsToInsert);
            console.log(`✅ Inserted ${dormsToInsert.length} dorms for ${uniName}`);
            totalAdded += dormsToInsert.length;
        }

        console.log(`\n🎉 Finished! Seeded a total of ${totalAdded} top-tier dorms.`);
        process.exit(0);

    } catch (error) {
        console.error("Error seeding top dorms:", error);
        process.exit(1);
    }
}

seedTopDorms();
