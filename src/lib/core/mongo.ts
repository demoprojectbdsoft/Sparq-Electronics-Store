import { MongoClient } from "mongodb";

/**
 * The MongoDB connection better-auth already writes to.
 *
 * Next.js reloads modules on every edit in development, so the client is kept
 * on `globalThis`: one connection pool per process instead of one per reload.
 */
const globalForMongo = globalThis as unknown as { mongoClient?: MongoClient };

export function getDb() {
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(process.env.MONGODB_URI as string);
  }

  return globalForMongo.mongoClient.db(process.env.DATABASE as string);
}
