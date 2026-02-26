require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const universitySchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

const University = mongoose.models.University || model('University', universitySchema, 'universities');

const rawData = `1Memorial University of Newfoundland - Including medical and dental	Memorial University of Newfoundland - Including medical and dental
2University of Prince Edward Island - Including medical and dental	University of Prince Edward Island - Including medical and dental
3	Acadia University
4	Acadia Divinity College
5	Atlantic School of Theology
6	Cape Breton University
7Dalhousie University - Including medical and dental	Dalhousie University - Including medical and dental
8	University of King's College
9	Mount Saint Vincent University
10	Nova Scotia College of Art and Design University (NSCAD)
11	Université Sainte-Anne
12	St. Francis Xavier University
13	Saint Mary's University
14	Mount Allison University
15	University of New Brunswick
16	Université de Moncton (parent)
17	St. Thomas University
18	Bishop's University
19McGill University - Including medical and dental	McGill University - Including medical and dental
20Université de Montréal - Including medical and dental	Université de Montréal - Including medical and dental
21	Polytechnique Montréal
22	École des hautes études commerciales
23Université Laval - Including medical and dental	Université Laval - Including medical and dental
24Université de Sherbrooke - Including medical and dental	Université de Sherbrooke - Including medical and dental
25	Concordia University
26	Université du Québec à Chicoutimi
27	Université du Québec à Montréal
28	Université du Québec en Abitibi-Témiscamingue
29	Université du Québec à Trois-Rivières
30	Université du Québec en Outaouais
31	Université du Québec, École nationale d'administration publique (ENAP)
32	Université du Québec, Institut national de la recherche scientifique
33	Université du Québec à Rimouski
34	Université du Québec, École de technologie supérieure
35	Université du Québec, Télé-université du Québec (TÉLUQ)
36	Brock University
37	Concordia Lutheran Theological Seminary
38	Carleton University
39	University of Guelph
40	Lakehead University
41	Laurentian University of Sudbury/Université Laurentienne de Sudbury
42McMaster University - Including medical and dental	McMaster University - Including medical and dental
43	Nipissing University
44University of Ottawa - Including medical and dental	University of Ottawa - Including medical and dental
45	Saint-Paul University/Université Saint-Paul
46Queen's University - Including medical and dental	Queen's University - Including medical and dental
47	Ryerson University
48University of Toronto - Including medical and dental	University of Toronto - Including medical and dental
49	St. Augustine's Seminary
50	University of St. Michael's College
51	University of Trinity College
52	Victoria University
53	Knox College
54	Wycliffe College
55	Regis College
56	Trent University
57	University of Waterloo
58	St. Jerome's University
59	Renison University College
60	Conrad Grebel University College
61University of Western Ontario - Including medical and dental	University of Western Ontario - Including medical and dental
62	Huron University College
63	King's College
64	Wilfred Laurier University
65	University of Windsor
66	York University
67	Ontario College of Art and Design
68	University of Ontario Institute of Technology
69	Algoma University College
70	University of Sudbury
71	Université de Hearst
72	Huntington University
73	Thorneloe University
74	Brandon University
75	Canadian Mennonite University
76University of Manitoba - Including medical and dental	University of Manitoba - Including medical and dental
77	Université de Saint-Boniface
78	University of Winnipeg
79	University of Regina
80	Campion College
81	Luther College
82	University of Saskatchewan - Including medical and dental
83College of Emmanuel and St. Chad	College of Emmanuel and St. Chad
84	Lutheran Theological Seminary
85	St. Andrew's College
86	St. Thomas More College
87	Horizon College & Seminary
88	University of Alberta - Including medical and dental
89Athabasca University	Athabasca University
90	University of Calgary - Including medical and dental
91Burman University	Burman University
92	Concordia University of Edmonton
93	University of Lethbridge
94	The King's University College
95	Ambrose University
96	Grant MacEwan University
97	Mount Royal University
98	University of British Columbia - Including medical and dental
99University of Northern British Columbia	University of Northern British Columbia
100	Royal Roads University
101	Simon Fraser University
102	University of Victoria
103	Thompson Rivers University
104	Capilano University
105	Vancouver Island University
106	Emily Carr University of Art and Design
107	Kwantlen Polytechnic University
108	University of the Fraser Valley
109	Yukon University`;

const lines = rawData.split('\n');
const unis = new Set();

for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split('\t');

    // Get the last column part and trim it
    let name = parts[parts.length - 1].trim();

    // Clean off suffixes
    name = name.replace(" - Including medical and dental", "").trim();

    // Specific cleanups 
    // e.g "(parent)", "/Université...", "(NSCAD)"
    name = name.replace("(parent)", "").trim();
    name = name.split('/Université')[0].trim();
    name = name.split('/ Université')[0].trim();

    // Prevent adding duplicates
    if (name) {
        // Edge case for Wilfred Laurier
        if (name === "Wilfred Laurier University") name = "Wilfrid Laurier University";
        // Edge case for Ryerson 
        if (name === "Ryerson University") name = "Toronto Metropolitan University";
        // Edge case for Western
        if (name === "University of Western Ontario") name = "Western University";

        unis.add(name);
    }
}

function slugify(text) {
    // same slugify function logic used in API
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB...");

        // Print out unique university names
        console.log(`Parsing resulted in ${unis.size} unique universities.`);

        let addedCount = 0;

        for (const name of Array.from(unis)) {
            const slug = slugify(name);

            const exists = await University.findOne({ slug });
            if (!exists) {
                await University.create({ name, slug });
                console.log('Added:', name);
                addedCount++;
            } else {
                console.log('Skipped (already exists):', name);
            }
        }

        console.log(`Done seeding. Added ${addedCount} new universities.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
