import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamObject, UIMessage } from "ai";
import * as z from "zod";
import * as readline from "readline";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const messages = await new Promise<Omit<UIMessage, "id">[]>((resolve) => {
  rl.question("Enter your profile/introduction: ", (answer) => {
    rl.close();
    resolve([{ role: "user", parts: [{ type: "text", text: answer }] }]);
  });
});

const experienceSchema = 
    z.array(
      z.object({
        jobTitle: z.string(),
        company: z.string(),
        duration: z.string(),
        responsibilities: z.array(z.string()),
      })
    )
const educationSchema = 
    z.array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        fieldOfStudy: z.string(),
        graduationYear: z.string(),
      })
    )
const personalInfoSchema =
    z.object({
        email: z.string(),
        name: z.string(),
        phone: z.string(),
    });


const result = streamObject({
  model: google("gemini-2.5-flash-lite"),
  temperature: 0.5,
  system: `
You are an AI assistant designed to help build resume. Provide guidance on how to build the resume, what to include, what to avoid, what to highlights, what to keep in mind while building the resume.

Only talk about technical and resume building topics, do not talk about any other activity. Be concise and to the point.

Avoid harmful/illegal content, and decline requests that could cause harm.
Help with: technical and resume building topics.

Follow instructions carefully, ask clarifying questions when ambiguous.
Provide detailed and actionable guidance on how to build the resume.

`,
  schema: z.object({
    personalInfo:personalInfoSchema,
    education:educationSchema,
    experience:experienceSchema,
    skills:z.array(z.string()),
    achievements:z.array(z.string()),
    certifications:z.array(z.string()),
  }),

  messages: convertToModelMessages(messages),
});

for await (const partialObject of result.partialObjectStream) {
  console.clear();
console.log(JSON.stringify(partialObject, null, 2));
}