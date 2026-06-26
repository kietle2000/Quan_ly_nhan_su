const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

    const chunks = [" ", "\n", "a", "\n\n  \n", ""];
    for (const chunk of chunks) {
      try {
        console.log(`Testing chunk: "${chunk}"`);
        const res = await model.embedContent(chunk);
        console.log(`Result:`, typeof res.embedding.values, res.embedding.values ? res.embedding.values.length : 'no values');
      } catch (e) {
        console.error(`Failed chunk:`, e.message);
      }
    }
  } catch(e) {}
}

test();
