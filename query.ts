import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { generateEmbedding } from "./lib/ai/embedding";
import { db } from "./lib/db";
import { embeddings } from "./lib/db/schema/embeddings";

const question = "What are Large Vision-Language models good at ?";

const userQueryEmbedded = await generateEmbedding(question);

const similarity = sql<number>`1 - (${cosineDistance(
  embeddings.embedding,
  userQueryEmbedded
)})`;

const similarGuides = await db
  .select({ name: embeddings.content, similarity })
  .from(embeddings)
  .where(gt(similarity, 0.3))
  .orderBy((t) => desc(t.similarity))
  .limit(4);

console.log(similarGuides);

process.exit(0);
