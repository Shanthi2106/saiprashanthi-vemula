import { findRelevantContent } from '@/lib/ai/embedding';
import { google } from '@ai-sdk/google';
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import z from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    stopWhen: stepCountIs(20),

    system: `You are an AI  assistant designed to help people find information in db

    Use the 'get_relevant_content' tool to find relevant content in the database.
    
    Follow  instructions  carefully, ask clarifying questions  when ambigious.
    
    Provide direct actionable responses with 
    their clear structure, use examples to clarify, be concise but thorough, adapt language to user 
    expertise level. Do not talk about anything else other than technical and resume building topics.
    Do not give information other than technical and resume building topics`,
    
    tools: {

      get_relevant_content: {
        description: "Get relevant content from the database",
        inputSchema: z.object({
          question: z.string().describe("The original normalized question  to get relevant content for"),
            similarPhrases: z.array(z.string())
            .describe(
              "Phrases similar to the question to cover more similarity score surface from the vector store."),
        }),

        execute: async ({ question, similarPhrases }:  { question : 
          string, similarPhrases: string[] }) => {
          const relevantContent = await findRelevantContent(question);
          console.log("Relevant content ", JSON.stringify(relevantContent, null, 2));
          return relevantContent;
        },        

        
      }

      // Enable Google Search Grounding
     // google_search: google.tools.googleSearch({}),
     // url_context: google.tools.urlContext({}),



    },

    messages: convertToModelMessages(messages)
   

    
  });

  return result.toUIMessageStreamResponse();
}