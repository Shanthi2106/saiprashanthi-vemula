import { db } from "@/lib/db";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { sql } from "drizzle-orm";
import z from "zod";

const mcpClient = await createMCPClient({
  transport: {
    type: "http",
    url: "https://rube.app/mcp",

    // optional: configure HTTP headers
    headers: { Authorization: `Bearer ${process.env.RUBE_MCP_TOKEN}` },
  },
});

export const maxDuration = 60;

// const databaseInformation = `
// -- INCOME TABLE
// -- Contains income distribution statistics for U.S. countries by year.
// -- Data tracks how population is distributed across income brackets within each country.

// CREATE TABLE income (
//   id SERIAL PRIMARY KEY, -- Unique identifier (auto-incremented primary key)
//   index INT NOT NULL, -- Original row index from source CSV
//   year INT NOT NULL, -- Year of the data collection (e.g., 2010, 2015)
//   fips INT NOT NULL, -- Federal Information Processing Standards code (unique country identifier)
//   state_fips INT NOT NULL, -- FIPS code for the state
//   country_fips INT NOT NULL, -- FIPS code for the country within the state
//   country_name VARCHAR(255) NOT NULL, -- Name of the country (e.g., "Autauga country")
//   state_name VARCHAR(255) NOT NULL, -- Full state name (e.g., "Alabama")
//   state_abbr VARCHAR(2) NOT NULL, -- Two-letter state abbreviation (e.g., "AL")
//   metro_nonmetro VARCHAR(50) NOT NULL, -- Classification as "Metropolitan" or "Non-metropolitan"
//   income_group VARCHAR(50) NOT NULL, -- Income bracket (e.g., "Under $25k", "$25-50k", "$50-100k", "Over $100k")
//   income_group_population INT NOT NULL, -- Number of people in that specific income bracket for the country/year
//   total_population_all_income_groups INT NOT NULL, -- Total population across all income groups (for validation/aggregation)
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp of record insertion
// );

// -- GENDER TABLE
// -- Contains gender demographics for U.S. countries by year.
// -- Data tracks male and female population distribution for each country across different years.

// CREATE TABLE gender(
//   id SERIAL PRIMARY KEY, -- Unique identifier (auto-incremented primary key)
//   index INT NOT NULL, -- Original row index from source CSV
//   year INT NOT NULL, -- Year of the data collection (e.g., 2010, 2015)
//   fips INT NOT NULL, -- Federal Information Processing Standards code (unique country identifier)
//   state_fips INT NOT NULL, -- FIPS code for the state
//   country_fips INT NOT NULL, -- FIPS code for the country within the state
//   country_name VARCHAR(255) NOT NULL, -- Name of the country (e.g., "Autauga country")
//   state_name VARCHAR(255) NOT NULL, -- Full state name (e.g., "Alabama")
//   state_abbr VARCHAR(2) NOT NULL, -- Two-letter state abbreviation (e.g., "AL")
//   metro_nonmetro VARCHAR(50) NOT NULL, -- Classification as "Metropolitan" or "Non-metropolitan"
//   male_population INT NOT NULL, -- Count of male residents in the country for that year
//   female_population INT NOT NULL, -- Count of female residents in the country for that year
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp of record insertion
// );

// -- RESOURCES TABLE
// -- Stores user-provided content resources that can be searched and referenced.
// -- Used as the source material for semantic search via embeddings.

// CREATE TABLE resources (
//   id VARCHAR(191) PRIMARY KEY, -- Unique identifier (generated using nanoid)
//   content TEXT NOT NULL, -- The actual content of the resource
//   created_at TIMESTAMP NOT NULL DEFAULT now(), -- Timestamp of resource creation
//   updated_at TIMESTAMP NOT NULL DEFAULT now() -- Timestamp of last update
// );

// -- EMBEDDINGS TABLE
// -- Stores vector embeddings for resource content to enable semantic search.
// -- Each embedding is associated with a resource and indexed for efficient similarity searches.

// CREATE TABLE embeddings (
//   id VARCHAR(191) PRIMARY KEY, -- Unique identifier (generated using nanoid)
//   resource_id VARCHAR(191) NOT NULL REFERENCES resources(id) ON DELETE CASCADE, -- Foreign key to resources table
//   content TEXT NOT NULL, -- The text content that was embedded
//   embedding VECTOR(1536) NOT NULL, -- 1536-dimensional vector embedding (OpenAI embedding dimensions)
//   -- HNSW index on embedding column for fast vector similarity search using cosine distance. Always ignore this embeddings column when executing SQL queries since it contains the vector embeddings.
//   CONSTRAINT embeddingIndex UNIQUE (id)
// );

// CREATE INDEX embeddingIndex ON embeddings USING hnsw (embedding vector_cosine_ops);
// `;

const databaseInformation = `

1. Gender Table:

CREATE TABLE gender (
  id SERIAL PRIMARY KEY, -- unique ID
  "index" INTEGER NOT NULL, -- original row index from source CSV
  year INTEGER NOT NULL,
  fips INTEGER NOT NULL, -- FIPS code
  state_fips INTEGER NOT NULL, -- FIPS code for the state
  country_fips INTEGER NOT NULL, -- FIPS code for the country
  country_name VARCHAR(255), -- Name of the country
  state_name VARCHAR(255), -- Full state name
  state_abbr VARCHAR(2), -- Two-letter state abbreviation
  metro_nonmetro VARCHAR(255), -- Classification as "Metropolitan" or "Non-metropolitan"
  male_population INTEGER, -- Count of male residents in the country for that year
  female_population INTEGER, -- Count of female residents in the country for that year
);

Sample Rows:
[
  {
    "id": 6286,
    "index": 0,
    "year": 2010,
    "fips": 1001,
    "state_fips": 1,
    "country_fips": 1,
    "country_name": "Autauga country",
    "state_name": "Alabama",
    "state_abbr": "AL",
    "metro_nonmetro": "Metropolitan",
    "male_population": 25780,
    "female_population": 27375,
    "created_at": "2025-11-23 15:48:36.158708"
  },
  {
    "id": 6287,
    "index": 1,
    "year": 2015,
    "fips": 1001,
    "state_fips": 1,
    "country_fips": 1,
    "country_name": "Autauga country",
    "state_name": "Alabama",
    "state_abbr": "AL",
    "metro_nonmetro": "Metropolitan",
    "male_population": 26745,
    "female_population": 28476,
    "created_at": "2025-11-23 15:48:36.158708"
  }
]

`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const tools = await mcpClient.tools();

  const result = streamText({
    model: "anthropic/claude-haiku-4.5",

    stopWhen: stepCountIs(50), // Stop after 50 steps maximum

    tools: {
      ...tools,

      // get_relevant_content: {
      //   description: "Get relevant content from the database",

      //   inputSchema: z.object({
      //     question: z
      //       .string()
      //       .describe(
      //         "The original normalized question to get relevant content for"
      //       ),
      //     similarPhrases: z
      //       .array(z.string())
      //       .describe(
      //         "Phrases similar to the question to cover more similarity score surface from the vector store."
      //       ),
      //   }),

      //   execute: async ({ question, similarPhrases }) => {
      //     const [_relevantContent, ...similarContent] = await Promise.all([
      //       findRelevantContent(question),
      //       ...similarPhrases.map(findRelevantContent),
      //     ]);

      //     const deduplicatedContent = [
      //       ...new Set([
      //         ..._relevantContent.map((_) => JSON.stringify(_)),
      //         ...similarContent.map((_) => JSON.stringify(_)),
      //       ]),
      //     ];

      //     return deduplicatedContent;
      //   },
      // },

      // sql: {
      //   description: "Execute SQL queries on the database",
      //   inputSchema: z.object({
      //     query: z.string().describe("The SQL query to execute"),
      //   }),
      //   execute: async ({ query }) => {
      //     console.log({ query });

      //     if (query.toLowerCase().includes("delete")) {
      //       return "Deletion operations are not allowed.";
      //     }

      //     if (query.toLowerCase().includes("drop")) {
      //       return "Drop operations are not allowed.";
      //     }

      //     if (query.toLowerCase().includes("insert")) {
      //       return "insert operations are not allowed.";
      //     }

      //     const result = await db.execute(sql.raw(query));
      //     return JSON.stringify(result);
      //   },
      // },

      sql: {
        inputSchema: z.object({
          queries: z.string().describe("The SQL query to execute").array(),
        }),

        description: "Execute SQL queries on the database",

        execute: async ({ queries }) => {
          console.log({ queries });

          const result = await db.execute(sql.raw(queries[0]));

          return JSON.stringify(result);
        },
      },
    },

    system: `
You are an AI assistant designed to help people find information in a database.
Follow instructions carefully, ask clarifying questions when ambiguous.
Respond in valid markdown.
When reporting information to the user, be extremely concise and sacrifice grammar for the sake of concision.
Provide direct actionable responses with clear structure, use examples to clarify, be concise but thorough, adapt language to user expertise level.
`,

    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}