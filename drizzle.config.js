import "dotenv/config";

/** @type { import("drizzle-kit").Config } */
export default {
  schema: "./db/schema.js",
  out: "./drizzle",
  dialect: "mysql",
  driver: "mysql2",
  dbCredentials: {
    uri: process.env.DATABASE_URL,
  },
};
