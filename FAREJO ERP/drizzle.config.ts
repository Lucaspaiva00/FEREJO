import { defineConfig } from "drizzle-kit";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://farejo:farejo@localhost:5432/farejo";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
