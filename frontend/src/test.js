import {TextServiceClient} from '@google/generative-ai';

const client = new TextServiceClient({
  apiKey: process.env.GOOGLE_API_KEY,
});

async function runTest() {
  try {
    const response = await client.generateText({
      model: 'text-bison-001',
      prompt: 'Say hello in a fun way!',
      maxOutputTokens: 50,
    });
    console.log('AI Response:', response.candidates[0].output);
  } catch (err) {
    console.error('Error calling AI:', err);
  }
}

runTest();
