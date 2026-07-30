import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const url = new URL(process.env.DATABASE_URL || "");
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Get all directories grouped by platform
  const dirs = await prisma.directory.findMany({
    where: { url: { not: null }, NOT: { url: "" } },
    select: { id: true, platform: true, url: true, status: true, automationMode: true }
  });

  // Group by platform
  const byPlatform = new Map<string, typeof dirs>();
  for (const d of dirs) {
    const key = d.platform.toLowerCase().trim();
    if (!byPlatform.has(key)) byPlatform.set(key, []);
    byPlatform.get(key)!.push(d);
  }

  console.log(`Total entries: ${dirs.length}, Unique platforms: ${byPlatform.size}`);
  console.log("");

  // Classify directories
  type Difficulty = "SIMPLE" | "MEDIUM" | "HARD" | "REVIEW" | "SOCIAL" | "CONTENT";
  const difficulty: Record<string, Difficulty> = {
    // SIMPLE - basic HTML forms
    "yellow pages": "SIMPLE",
    "manta": "SIMPLE", 
    "hotfrog": "SIMPLE",
    "superpages": "SIMPLE",
    "merchant circle": "SIMPLE",
    "local.com": "SIMPLE",
    "ezlocal": "SIMPLE",
    "opendi": "SIMPLE",
    "spoke": "SIMPLE",
    "n49": "SIMPLE",
    "brownbook": "SIMPLE",
    
    // REVIEW platforms
    "trustpilot": "REVIEW",
    "sitejabber": "REVIEW",
    "provenexpert": "REVIEW",
    "g2": "REVIEW",
    
    // CONTENT platforms
    "medium": "CONTENT",
    "hubpages": "CONTENT",
    "ezinearticles": "CONTENT",
    "slideshare": "CONTENT",
    "quora": "CONTENT",
    "tumblr": "CONTENT",
    "business2community": "CONTENT",
    
    // SOCIAL / SPA
    "pinterest business": "SOCIAL",
    "youtube channel": "SOCIAL",
    "twitter / x": "SOCIAL",
    "github": "SOCIAL",
    "stack overflow": "SOCIAL",
    "producthunt": "SOCIAL",
    "angellist/wellfound": "SOCIAL",
    "crunchbase": "SOCIAL",
    
    // AGENCY DIRECTORIES (MEDIUM)
    "goodfirms": "MEDIUM",
    "designrush": "MEDIUM",
    "agency spotter": "MEDIUM",
    "the manifest": "MEDIUM",
    "upcity": "MEDIUM",
    "expertise.com": "MEDIUM",
    "sortlist": "MEDIUM",
    "bark.com": "MEDIUM",
    "semfirms": "MEDIUM",
    "topseos": "MEDIUM",
    "find best seo": "MEDIUM",
    "influencer mkt hub": "MEDIUM",
    "digital agency net": "MEDIUM",
    
    // PORTFOLIO / DESIGN
    "behance": "CONTENT",
    "dribbble": "CONTENT",
    "awwwards": "CONTENT",
    "css design awards": "CONTENT",
    "siteinspire": "CONTENT",
    
    // SAAS PARTNERS (HARD - registration required)
    "stripe partner": "HARD",
    "activecampaign": "HARD",
    "hubspot agency dir": "HARD",
    "shopify partners": "HARD",
    "woocommerce agency": "HARD",
    "webflow partner": "HARD",
    "mailchimp partner": "HARD",
    "semrush agency partners": "HARD",
    
    // LOCAL/CHAMBER (MEDIUM)
    "alignable": "MEDIUM",
    "nextdoor business": "MEDIUM",
    "citylocalpro": "MEDIUM",
    "fl business dir": "MEDIUM",
    "plantations chamber": "MEDIUM",
    "broward county chamber": "MEDIUM",
    "ft lauderdale chamber": "MEDIUM",
    "miami chamber": "MEDIUM",
    "city of plantation": "MEDIUM",
    "broward county biz": "MEDIUM",
    "score mentor network": "MEDIUM",
    "fl deo business": "MEDIUM",
    "sba.gov business": "MEDIUM",
    "fl sbdc network": "MEDIUM",
    "south fl biz journal": "MEDIUM",
    
    // DATA AGGREGATORS (HARD)
    "data axle": "HARD",
    "express update usa": "HARD",
    "neustar localeze": "HARD",
    "foursquare business": "HARD",
  };

  // For each unique platform, show classification
  const results: Array<{platform: string, url: string, difficulty: Difficulty, status: string, mode: string}> = [];
  
  for (const [platform, entries] of byPlatform) {
    // Pick best entry (READY > AI_PREPARED > PENDING)
    const priority: Record<string, number> = { READY: 0, AI_PREPARED: 1, PENDING: 2, MANUAL: 3 };
    entries.sort((a, b) => (priority[a.automationMode] ?? 3) - (priority[b.automationMode] ?? 3));
    const best = entries[0];
    
    const diff = difficulty[platform] || "MEDIUM";
    results.push({
      platform: best.platform,
      url: best.url,
      difficulty: diff,
      status: best.status,
      mode: best.automationMode
    });
  }

  // Sort by difficulty then platform
  const order: Record<Difficulty, number> = { SIMPLE: 0, REVIEW: 1, CONTENT: 2, SOCIAL: 3, MEDIUM: 4, HARD: 5 };
  results.sort((a, b) => {
    const da = order[a.difficulty];
    const db = order[b.difficulty];
    if (da !== db) return da - db;
    return a.platform.localeCompare(b.platform);
  });

  console.log("CLASSIFIED DIRECTORIES:\n");
  console.log(`Total unique platforms: ${results.length}\n`);
  
  let currentDiff = "";
  for (const r of results) {
    if (r.difficulty !== currentDiff) {
      currentDiff = r.difficulty;
      console.log(`\n=== ${currentDiff} (${results.filter(x => x.difficulty === currentDiff).length}) ===`);
    }
    console.log(`  ${r.platform.padEnd(30)} ${r.url.padEnd(50)} ${r.status.padEnd(10)} ${r.mode}`);
  }

  console.log("\n\n=== FIRST 5 FOR AUTOMATION ===");
  const simpleFirst = results.filter(r => r.difficulty === "SIMPLE").slice(0, 5);
  for (const r of simpleFirst) {
    console.log(`  ${r.platform} - ${r.url}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);