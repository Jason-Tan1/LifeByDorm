const map = {
    "Memorial University of Newfoundland": { location: "St. John's, Newfoundland and Labrador", website: "https://www.mun.ca/" },
    "University of Prince Edward Island": { location: "Charlottetown, Prince Edward Island", website: "https://www.upei.ca/" },
    "Acadia University": { location: "Wolfville, Nova Scotia", website: "https://www2.acadiau.ca/" },
    "Acadia Divinity College": { location: "Wolfville, Nova Scotia", website: "https://acadiadiv.ca/" },
    "Atlantic School of Theology": { location: "Halifax, Nova Scotia", website: "https://www.astheology.ns.ca/" },
    "Cape Breton University": { location: "Sydney, Nova Scotia", website: "https://www.cbu.ca/" },
    "Dalhousie University": { location: "Halifax, Nova Scotia", website: "https://www.dal.ca/" },
    "University of King's College": { location: "Halifax, Nova Scotia", website: "https://ukings.ca/" },
    "Mount Saint Vincent University": { location: "Halifax, Nova Scotia", website: "https://www.msvu.ca/" },
    "Nova Scotia College of Art and Design University": { location: "Halifax, Nova Scotia", website: "https://nscad.ca/" },
    "Université Sainte-Anne": { location: "Pointe-de-l'Église, Nova Scotia", website: "https://www.usainteanne.ca/" },
    "St. Francis Xavier University": { location: "Antigonish, Nova Scotia", website: "https://www.stfx.ca/" },
    "Saint Mary's University": { location: "Halifax, Nova Scotia", website: "https://smu.ca/" },
    "Mount Allison University": { location: "Sackville, New Brunswick", website: "https://mta.ca/" },
    "University of New Brunswick": { location: "Fredericton, New Brunswick", website: "https://www.unb.ca/" },
    "Université de Moncton": { location: "Moncton, New Brunswick", website: "https://www.umoncton.ca/" },
    "St. Thomas University": { location: "Fredericton, New Brunswick", website: "https://www.stu.ca/" },
    "Bishop's University": { location: "Sherbrooke, Quebec", website: "https://www.ubishops.ca/" },
    "McGill University": { location: "Montreal, Quebec", website: "https://www.mcgill.ca/" },
    "Université de Montréal": { location: "Montreal, Quebec", website: "https://www.umontreal.ca/" },
    "Polytechnique Montréal": { location: "Montreal, Quebec", website: "https://www.polymtl.ca/" },
    "École des hautes études commerciales": { location: "Montreal, Quebec", website: "https://www.hec.ca/" },
    "Université Laval": { location: "Quebec City, Quebec", website: "https://www.ulaval.ca/" },
    "Université de Sherbrooke": { location: "Sherbrooke, Quebec", website: "https://www.usherbrooke.ca/" },
    "Concordia University": { location: "Montreal, Quebec", website: "https://www.concordia.ca/" },
    "Université du Québec à Chicoutimi": { location: "Saguenay, Quebec", website: "https://www.uqac.ca/" },
    "Université du Québec à Montréal": { location: "Montreal, Quebec", website: "https://uqam.ca/" },
    "Université du Québec en Abitibi-Témiscamingue": { location: "Rouyn-Noranda, Quebec", website: "https://www.uqat.ca/" },
    "Université du Québec à Trois-Rivières": { location: "Trois-Rivières, Quebec", website: "https://www.uqtr.ca/" },
    "Université du Québec en Outaouais": { location: "Gatineau, Quebec", website: "https://uqo.ca/" },
    "Université du Québec, École nationale d'administration publique (ENAP)": { location: "Quebec City, Quebec", website: "https://www.enap.ca/" },
    "Université du Québec, Institut national de la recherche scientifique": { location: "Quebec City, Quebec", website: "https://inrs.ca/" },
    "Université du Québec à Rimouski": { location: "Rimouski, Quebec", website: "https://www.uqar.ca/" },
    "Université du Québec, École de technologie supérieure": { location: "Montreal, Quebec", website: "https://www.etsmtl.ca/" },
    "Université du Québec, Télé-université du Québec (TÉLUQ)": { location: "Quebec City, Quebec", website: "https://www.teluq.ca/" },
    "Brock University": { location: "St. Catharines, Ontario", website: "https://brocku.ca/" },
    "Concordia Lutheran Theological Seminary": { location: "St. Catharines, Ontario", website: "https://concordia-seminary.ca/" },
    "Carleton University": { location: "Ottawa, Ontario", website: "https://carleton.ca/" },
    "University of Guelph": { location: "Guelph, Ontario", website: "https://www.uoguelph.ca/" },
    "Lakehead University": { location: "Thunder Bay, Ontario", website: "https://www.lakeheadu.ca/" },
    "Laurentian University of Sudbury": { location: "Sudbury, Ontario", website: "https://laurentian.ca/" },
    "McMaster University": { location: "Hamilton, Ontario", website: "https://www.mcmaster.ca/" },
    "Nipissing University": { location: "North Bay, Ontario", website: "https://www.nipissingu.ca/" },
    "University of Ottawa": { location: "Ottawa, Ontario", website: "https://www.uottawa.ca/" },
    "Saint-Paul University": { location: "Ottawa, Ontario", website: "https://ustpaul.ca/" },
    "Queen's University": { location: "Kingston, Ontario", website: "https://www.queensu.ca/" },
    "Toronto Metropolitan University": { location: "Toronto, Ontario", website: "https://www.torontomu.ca/" },
    "University of Toronto": { location: "Toronto, Ontario", website: "https://www.utoronto.ca/" },
    "St. Augustine's Seminary": { location: "Toronto, Ontario", website: "https://staugustines.on.ca/" },
    "University of St. Michael's College": { location: "Toronto, Ontario", website: "https://stmikes.utoronto.ca/" },
    "University of Trinity College": { location: "Toronto, Ontario", website: "https://www.trinity.utoronto.ca/" },
    "Victoria University": { location: "Toronto, Ontario", website: "https://vicu.utoronto.ca/" },
    "Knox College": { location: "Toronto, Ontario", website: "https://knox.utoronto.ca/" },
    "Wycliffe College": { location: "Toronto, Ontario", website: "https://www.wycliffecollege.ca/" },
    "Regis College": { location: "Toronto, Ontario", website: "https://regiscollege.ca/" },
    "Trent University": { location: "Peterborough, Ontario", website: "https://www.trentu.ca/" },
    "University of Waterloo": { location: "Waterloo, Ontario", website: "https://uwaterloo.ca/" },
    "St. Jerome's University": { location: "Waterloo, Ontario", website: "https://www.sju.ca/" },
    "Renison University College": { location: "Waterloo, Ontario", website: "https://uwaterloo.ca/renison/" },
    "Conrad Grebel University College": { location: "Waterloo, Ontario", website: "https://uwaterloo.ca/grebel/" },
    "Western University": { location: "London, Ontario", website: "https://www.uwo.ca/" },
    "Huron University College": { location: "London, Ontario", website: "https://huronatwestern.ca/" },
    "King's College": { location: "London, Ontario", website: "https://www.kings.uwo.ca/" },
    "Wilfrid Laurier University": { location: "Waterloo, Ontario", website: "https://www.wlu.ca/" },
    "University of Windsor": { location: "Windsor, Ontario", website: "https://www.uwindsor.ca/" },
    "York University": { location: "Toronto, Ontario", website: "https://www.yorku.ca/" },
    "Ontario College of Art and Design": { location: "Toronto, Ontario", website: "https://www.ocadu.ca/" },
    "University of Ontario Institute of Technology": { location: "Oshawa, Ontario", website: "https://ontariotechu.ca/" },
    "Algoma University College": { location: "Sault Ste. Marie, Ontario", website: "https://algomau.ca/" },
    "University of Sudbury": { location: "Sudbury, Ontario", website: "https://usudbury.ca/" },
    "Université de Hearst": { location: "Hearst, Ontario", website: "https://www.uhearst.ca/" },
    "Huntington University": { location: "Sudbury, Ontario", website: "https://huntingtonu.ca/" },
    "Thorneloe University": { location: "Sudbury, Ontario", website: "https://thorneloe.ca/" },
    "Brandon University": { location: "Brandon, Manitoba", website: "https://www.brandonu.ca/" },
    "Canadian Mennonite University": { location: "Winnipeg, Manitoba", website: "https://www.cmu.ca/" },
    "University of Manitoba": { location: "Winnipeg, Manitoba", website: "https://umanitoba.ca/" },
    "Université de Saint-Boniface": { location: "Winnipeg, Manitoba", website: "https://ustboniface.ca/" },
    "University of Winnipeg": { location: "Winnipeg, Manitoba", website: "https://www.uwinnipeg.ca/" },
    "University of Regina": { location: "Regina, Saskatchewan", website: "https://www.uregina.ca/" },
    "Campion College": { location: "Regina, Saskatchewan", website: "https://campioncollege.ca/" },
    "Luther College": { location: "Regina, Saskatchewan", website: "https://www.luthercollege.edu/university/" },
    "University of Saskatchewan": { location: "Saskatoon, Saskatchewan", website: "https://www.usask.ca/" },
    "College of Emmanuel and St. Chad": { location: "Saskatoon, Saskatchewan", website: "http://stthomasmorecollege.ca/" }, // Note: Often defunct or merged
    "Lutheran Theological Seminary": { location: "Saskatoon, Saskatchewan", website: "https://www.lutherantheological.ca/" },
    "St. Andrew's College": { location: "Saskatoon, Saskatchewan", website: "https://standrews.ca/" },
    "St. Thomas More College": { location: "Saskatoon, Saskatchewan", website: "https://stmcollege.ca/" },
    "Horizon College & Seminary": { location: "Saskatoon, Saskatchewan", website: "https://www.horizon.edu/" },
    "University of Alberta": { location: "Edmonton, Alberta", website: "https://www.ualberta.ca/" },
    "Athabasca University": { location: "Athabasca, Alberta", website: "https://www.athabascau.ca/" },
    "University of Calgary": { location: "Calgary, Alberta", website: "https://www.ucalgary.ca/" },
    "Burman University": { location: "Lacombe, Alberta", website: "https://www.burmanu.ca/" },
    "Concordia University of Edmonton": { location: "Edmonton, Alberta", website: "https://concordia.ab.ca/" },
    "University of Lethbridge": { location: "Lethbridge, Alberta", website: "https://www.ulethbridge.ca/" },
    "The King's University College": { location: "Edmonton, Alberta", website: "https://www.kingsu.ca/" },
    "Ambrose University": { location: "Calgary, Alberta", website: "https://ambrose.edu/" },
    "Grant MacEwan University": { location: "Edmonton, Alberta", website: "https://www.macewan.ca/" },
    "Mount Royal University": { location: "Calgary, Alberta", website: "https://www.mtroyal.ca/" },
    "University of British Columbia": { location: "Vancouver, British Columbia", website: "https://www.ubc.ca/" },
    "University of Northern British Columbia": { location: "Prince George, British Columbia", website: "https://www.unbc.ca/" },
    "Royal Roads University": { location: "Victoria, British Columbia", website: "https://www.royalroads.ca/" },
    "Simon Fraser University": { location: "Burnaby, British Columbia", website: "https://www.sfu.ca/" },
    "University of Victoria": { location: "Victoria, British Columbia", website: "https://www.uvic.ca/" },
    "Thompson Rivers University": { location: "Kamloops, British Columbia", website: "https://www.tru.ca/" },
    "Capilano University": { location: "North Vancouver, British Columbia", website: "https://www.capilanou.ca/" },
    "Vancouver Island University": { location: "Nanaimo, British Columbia", website: "https://www.viu.ca/" },
    "Emily Carr University of Art and Design": { location: "Vancouver, British Columbia", website: "https://www.ecuad.ca/" },
    "Kwantlen Polytechnic University": { location: "Surrey, British Columbia", website: "https://www.kpu.ca/" },
    "University of the Fraser Valley": { location: "Abbotsford, British Columbia", website: "https://www.ufv.ca/" },
    "Yukon University": { location: "Whitehorse, Yukon", website: "https://www.yukonu.ca/" }
};


require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const universitySchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    location: { type: String },
    website: { type: String }
});

const University = mongoose.models.University || model('University', universitySchema, 'universities');

async function updateUnis() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB...");

        let updateCount = 0;

        // Fetch all 
        const unis = await University.find({});

        for (const u of unis) {
            // Look it up.
            // Account for slight naming variations
            let match = map[u.name];

            if (!match) {
                // Find if any key matches closely
                for (const [key, val] of Object.entries(map)) {
                    if (u.name.includes(key) || key.includes(u.name)) {
                        match = val;
                        break;
                    }
                }
            }

            if (match) {
                let changed = false;

                // Skip over those that already have it (the prompt said ignore ones that have them implemented)
                if (!u.location || u.location === null || u.location.trim() === "") {
                    u.location = match.location;
                    changed = true;
                }

                if (!u.website || u.website === null || u.website.trim() === "") {
                    u.website = match.website;
                    changed = true;
                }

                if (changed) {
                    await u.save();
                    console.log(`Updated ${u.name} with ${u.location} / ${u.website}`);
                    updateCount++;
                } else {
                    console.log(`Skipped ${u.name} (already has location and website)`);
                }
            } else {
                console.log(`No manual mapping found for DB user: ${u.name}`);
            }
        }

        console.log(`Done seeding locations and websites. Updated ${updateCount} universities.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateUnis();
