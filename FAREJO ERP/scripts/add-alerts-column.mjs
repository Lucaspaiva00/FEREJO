import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    // Check if alertsSent already exists
    const [cols] = await conn.execute("SHOW COLUMNS FROM campaigns LIKE 'alertsSent'");
    if (cols.length > 0) {
      console.log("Column alertsSent already exists in campaigns. Skipping.");
    } else {
      await conn.execute("ALTER TABLE campaigns ADD COLUMN alertsSent TEXT NULL");
      await conn.execute("UPDATE campaigns SET alertsSent = '[]' WHERE alertsSent IS NULL");
      console.log("Added alertsSent to campaigns.");
    }
    // Verify tasks columns
    const [taskCols] = await conn.execute("SHOW COLUMNS FROM tasks");
    const fields = taskCols.map(r => r.Field);
    console.log("Tasks columns:", fields.join(", "));
  } finally {
    await conn.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
