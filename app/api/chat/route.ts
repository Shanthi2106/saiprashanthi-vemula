import { db } from "@/lib/db";
import { createMCPClient } from '@ai-sdk/mcp';
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



export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const tools = await mcpClient.tools();

  const result = streamText({
    model: "anthropic/claude-haiku-4.5",

    stopWhen: stepCountIs(50), // Stop after 50 steps maximum

    tools: {
      ...tools,

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