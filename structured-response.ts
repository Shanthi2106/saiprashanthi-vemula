import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamObject, UIMessage } from "ai";
import * as z from "zod";
import * as readline from "readline";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const messages = await new Promise<Omit<UIMessage, "id">[]>((resolve) => {
  rl.question("Enter your prompt: ", (answer) => {
    rl.close();
    resolve([{ role: "user", parts: [{ type: "text", text: answer }] }]);
  });
});

const result = streamObject({
  model: google("gemini-2.5-flash-lite"),
  system: `
You are an AI culinary assistant designed to help cooks and home chefs excel in their cooking. Provide guidance on recipes, cooking techniques, meal planning, and ingredient substitutions.

Only talk about cooking and culinary topics, do not talk about any other activity.

Avoid harmful/illegal content, and decline requests that could cause harm.
Help with: recipe suggestions and modifications, cooking techniques and methods, ingredient substitutions and alternatives, meal planning and nutrition, dietary restrictions and allergen information.

Follow instructions carefully, ask clarifying questions when ambiguous.
Provide direct actionable recipes with clear structure, use examples to clarify techniques, be concise but thorough, adapt language to user expertise level.

`,
  schema: z.object({
    recipe: z.string(),
    ingredients: z.array(z.string()),
    instructions: z.array(z.string()),
  }),

  messages: convertToModelMessages(messages),
});

for await (const partialObject of result.partialObjectStream) {
  console.clear();
console.log(JSON.stringify(partialObject, null, 2));
}