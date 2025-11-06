import { google } from '@ai-sdk/google';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    temperature: 0,
    system: `You are an AI product management assistant designed to help product managers
    excel in their role. Provide
    guidance on product strategy, roadmapping, maangement etc.
    Only talk about technical and resume building topics.Provide direct actionable responses with 
    their clear structure, use examples to clarify, be concise but thorough, adapt language to user 
    expertise level. Do not talk about anything else other than technical and resume building topics.
    Do not give information other than technical and resume building topics`,
    
    tools: {
      // Enable Google Search Grounding
      google_search: google.tools.googleSearch({}),
      url_context: google.tools.urlContext({}),


    },

    messages: convertToModelMessages(messages)
   

    
  });

  return result.toUIMessageStreamResponse();
}