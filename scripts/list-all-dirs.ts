import "dotenv/config";
import pg from "pg";

const url = new URL(process.env.DATABASE_URL || "");
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false }, max: 1 });

async function main() {
  // Just list all directories
  const result = await pool.query("SELECT id, platform, url, \"submissionUrl\", category FROM \"Directory\" WHERE url IS NOT NULL AND url != ''");
  console.log(`Total: ${result.rows.length} directories\n`);
  
  for (const r of result.rows) {
    console.log(`${r.platform.padEnd(30)} ${r.url.slice(0, 35).padEnd(37)} cat:${(r.category || "none").padEnd(8)} subUrl:${(r.submissionUrl || "none")}`);
  }
  
  await pool.end();
}

main().catch(console.error);