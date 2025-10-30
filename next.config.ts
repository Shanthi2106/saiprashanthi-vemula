
import { generateText } from "ai";
import { google, GoogleGenerativeAIProviderMetadata } from "@ai-sdk/google";

export async function askWithSearch(prompt: string) {
  const { text, providerMetadata } = await generateText({
    model: google("gemini-2.5-flash"),
    tools: {
      // Enable Google Search Grounding
      google_search: google.tools.googleSearch({}),
    },
    prompt,
  });
   // Access Google-specific metadata (typesafe cast is optional)
   const g = providerMetadata?.google as GoogleGenerativeAIProviderMetadata | undefined;
   const groundingMetadata = g?.groundingMetadata; // queries, chunks, supports, etc.
 
   return { text, groundingMetadata };
 }