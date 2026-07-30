import dotenv from "dotenv";
dotenv.config();
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const res = await pool.query(
    `SELECT logs FROM "AutomationJob" WHERE id = 'cms64cn9t0000dkutgtcam93g'`
  );
  if (!res.rows[0]) { console.log("Not found"); await pool.end(); return; }
  const logs = JSON.parse(res.rows[0].logs);
  const relevant = logs.filter(l => l.includes("No next") || l.includes("button") || l.includes("Next") || l.includes("submit") || l.includes("Submit") || l.includes("Select country") || l.includes("Select country") || l.includes("error") || l.includes("filled") || l.includes("failed") || l.includes("Fields on step"));
  relevant.forEach(l => console.log(l));
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
